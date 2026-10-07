import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  accountPath,
  fetchCatalog,
  tebexRequest,
  StoreUnavailableError,
} from "@/lib/tebex";
import { validateCheckoutItems, trustedTebexUrl } from "@/lib/validation";
import {
  readJsonBody,
  RequestBodyError,
  checkoutOrigin,
} from "@/lib/request";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const origin = checkoutOrigin(request);

  if (!origin || request.headers.get("origin") !== origin) {
    return NextResponse.json(
      { error: "Please start checkout from this website." },
      { status: 403 },
    );
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json(
      { error: "Expected JSON." },
      { status: 415 },
    );
  }

  const signal = AbortSignal.any([
    request.signal,
    AbortSignal.timeout(45000),
  ]);

  let resumable = false;

  try {
    const body = await readJsonBody(request, signal);
    const items = validateCheckoutItems(body?.items);

    if (!items) {
      return NextResponse.json(
        {
          error:
            "Your cart contains invalid items. Remove them and choose products from the store.",
        },
        { status: 400 },
      );
    }

    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const voucherType = body.voucherType === "giftcard" || body.voucherType === "coupon"
      ? body.voucherType
      : "";
    const voucherCode = typeof body.voucherCode === "string" ? body.voucherCode.trim() : "";

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Java Minecraft username (3–16 letters, numbers or underscores).",
        },
        { status: 400 },
      );
    }

    if (voucherCode && (!voucherType || voucherCode.length > 128 || /[\u0000-\u001f\u007f]/.test(voucherCode))) {
      return NextResponse.json(
        { error: "Enter a valid gift card or discount code." },
        { status: 400 },
      );
    }

    const catalog = await fetchCatalog(signal);
    type CatalogProduct = (typeof catalog)[number];
    const products: CatalogProduct[] = [];

    for (const item of items) {
      const product = catalog.find(
        (catalogProduct) => catalogProduct.id === item.packageId,
      );

      if (
        !product ||
        (product.disableQuantity && item.quantity !== 1)
      ) {
        return NextResponse.json(
          {
            error:
              "An item is no longer available or its quantity is not allowed. Please refresh your cart.",
          },
          { status: 400 },
        );
      }

      products.push(product);
    }

    if (new Set(products.map((product) => product.currency)).size !== 1) {
      return NextResponse.json(
        { error: "Please check out items in one currency at a time." },
        { status: 400 },
      );
    }

    const api = (path: string, init: RequestInit = {}) =>
      tebexRequest(path, { ...init, signal });

    const jar = await cookies();
    const savedBasket = jar.get("rx-basket")?.value;
    let basket;

    if (savedBasket && /^[a-zA-Z0-9-]{1,160}$/.test(savedBasket)) {
      try {
        basket = (await api(accountPath(`/baskets/${savedBasket}`))).data;
      } catch (error) {
        if (
          error instanceof StoreUnavailableError &&
          [404, 422].includes(error.status || 0)
        ) {
          jar.delete("rx-basket");
        } else {
          resumable = true;
          throw error;
        }
      }

      if (
        basket?.complete ||
        (basket?.username &&
          basket.username.toLowerCase() !== username.toLowerCase())
      ) {
        basket = undefined;
      }

      // Older baskets created without an identifier cannot be updated to
      // include one. Start a fresh basket so Tebex receives this checkout's
      // Minecraft username during creation.
      if (basket && !basket.username && !basket.username_id) {
        basket = undefined;
        jar.delete("rx-basket");
      }
    }
    if (!basket) {
      basket = (
        await api(accountPath("/baskets"), {
          method: "POST",
          // Bind the Java recipient during creation. The username-only
          // payload works without overriding the customer IP.
          body: JSON.stringify({
            username,
            complete_url: `${origin}/store/success`,
            cancel_url: `${origin}/cart`,
            complete_auto_redirect: true,
          }),
        })
      ).data;
    }

    if (
      !basket ||
      typeof basket.ident !== "string" ||
      !/^[a-zA-Z0-9-]{1,160}$/.test(basket.ident) ||
      basket.complete
    ) {
      throw new StoreUnavailableError(
        "This checkout session has expired. Please start again.",
      );
    }

    const ident = basket.ident;

    jar.set("rx-basket", ident, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https:"),
      maxAge: 1800,
      path: "/",
    });

    resumable = true;

    if (!basket.username && !basket.username_id) {
      const auth = await api(
        accountPath(
          `/baskets/${ident}/auth?returnUrl=${encodeURIComponent(
            `${origin}/cart?resume=1`,
          )}`,
        ),
      );

      if (!Array.isArray(auth) || !auth.length) {
        throw new StoreUnavailableError(
          "Your Minecraft account could not be verified. Please check your username or use the official store.",
        );
      }

      // Tebex may return more than one authentication option, and the `url`
      // field is optional. Use the first option that contains a trusted URL
      // instead of assuming the first entry is usable.
      const authUrl = auth
        .map((option: unknown) => {
          if (!option || typeof option !== "object" || !("url" in option)) {
            return null;
          }
          return trustedTebexUrl(option.url);
        })
        .find((url): url is string => url !== null);

      if (!authUrl) {
        // Log response shape only. Authentication URLs can contain session
        // data, so never include their values or paths in server logs.
        console.warn("[Tebex checkout] No valid authentication URL returned:", {
          optionCount: auth.length,
          options: auth.slice(0, 5).map((option: unknown) => ({
            type: option === null ? "null" : typeof option,
            keys:
              option && typeof option === "object"
                ? Object.keys(option)
                : [],
            urlType:
              option && typeof option === "object" && "url" in option
                ? typeof option.url
                : "missing",
          })),
        });
        throw new StoreUnavailableError(
          "Unable to open account verification. Please use the official store.",
        );
      }

      if (body.resume === true) {
        return NextResponse.json(
          {
            error:
              "Account verification was not completed. Please try checkout again.",
            resumable: true,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({ checkoutUrl: authUrl });
    }

    // Sync the basket so retries do not add items twice.
    for (const existing of basket.packages || []) {
      if (
        !items.some(
          (item) => item.packageId === String(existing.id),
        )
      ) {
        await api(`/baskets/${ident}/packages/remove`, {
          method: "POST",
          body: JSON.stringify({
            package_id: String(existing.id),
          }),
        });
      }
    }

    for (const item of items) {
      const existing = basket.packages?.find(
        (pkg: { id: number }) => String(pkg.id) === item.packageId,
      );

      if (existing) {
        if (existing.in_basket?.quantity !== item.quantity) {
          await api(
            `/baskets/${ident}/packages/${item.packageId}`,
            {
              method: "PUT",
              body: JSON.stringify({ quantity: item.quantity }),
            },
          );
        }
      } else {
        await api(`/baskets/${ident}/packages`, {
          method: "POST",
          body: JSON.stringify({
            package_id: item.packageId,
            quantity: item.quantity,
          }),
        });
      }
    }

    if (voucherCode) {
      const coupons = Array.isArray(basket.coupons) ? basket.coupons : [];
      const giftcards = Array.isArray(basket.giftcards) ? basket.giftcards : [];
      const matchingCoupon = voucherType === "coupon" && coupons.some(
        (coupon: { coupon_code?: string }) => coupon.coupon_code === voucherCode,
      );
      const matchingGiftcard = voucherType === "giftcard" && giftcards.some(
        (giftcard: { card_number?: string }) => giftcard.card_number === voucherCode,
      );

      try {
        if (voucherType === "coupon") {
          if (!matchingCoupon) {
            if (coupons.length) {
              await api(accountPath(`/baskets/${ident}/coupons/remove`), { method: "POST" });
            }
            for (const giftcard of giftcards) {
              await api(accountPath(`/baskets/${ident}/giftcards/remove`), {
                method: "POST",
                body: JSON.stringify({ card_number: giftcard.card_number }),
              });
            }
            await api(accountPath(`/baskets/${ident}/coupons`), {
              method: "POST",
              body: JSON.stringify({ coupon_code: voucherCode }),
            });
          } else {
            for (const giftcard of giftcards) {
              await api(accountPath(`/baskets/${ident}/giftcards/remove`), {
                method: "POST",
                body: JSON.stringify({ card_number: giftcard.card_number }),
              });
            }
          }
        } else if (!matchingGiftcard) {
          if (coupons.length) {
            await api(accountPath(`/baskets/${ident}/coupons/remove`), { method: "POST" });
          }
          for (const giftcard of giftcards) {
            await api(accountPath(`/baskets/${ident}/giftcards/remove`), {
              method: "POST",
              body: JSON.stringify({ card_number: giftcard.card_number }),
            });
          }
          await api(accountPath(`/baskets/${ident}/giftcards`), {
            method: "POST",
            body: JSON.stringify({ card_number: voucherCode }),
          });
        } else {
          if (coupons.length) {
            await api(accountPath(`/baskets/${ident}/coupons/remove`), { method: "POST" });
          }
          for (const giftcard of giftcards) {
            if (giftcard.card_number !== voucherCode) {
              await api(accountPath(`/baskets/${ident}/giftcards/remove`), {
                method: "POST",
                body: JSON.stringify({ card_number: giftcard.card_number }),
              });
            }
          }
        }
      } catch (error) {
        if (error instanceof StoreUnavailableError && error.status && error.status < 500) {
          return NextResponse.json(
            { error: "That code could not be applied. Check the code and type, then try again." },
            { status: 422 },
          );
        }
        throw error;
      }
    }

    const finalBasket = await api(
      accountPath(`/baskets/${ident}`),
    );

    const checkoutUrl = trustedTebexUrl(
      finalBasket.data?.links?.checkout,
    );

    if (!checkoutUrl) {
      throw new StoreUnavailableError(
        "Checkout is not ready. Please try the official store.",
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    let message =
      "The payment service could not be reached in time. Your cart is saved; please try again.";

    if (
      error instanceof RequestBodyError ||
      error instanceof StoreUnavailableError
    ) {
      message = error.message;
    }

    return NextResponse.json(
      { error: message, resumable },
      {
        status:
          error instanceof RequestBodyError ? error.status : 503,
      },
    );
  }
}
