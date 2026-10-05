import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountPath, fetchCatalog, tebexRequest, StoreUnavailableError } from "@/lib/tebex";
import { validateCheckoutItems, trustedTebexUrl } from "@/lib/validation";
import { readJsonBody, RequestBodyError, clientIp, checkoutOrigin } from "@/lib/request";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  // Prefer the deployment's configured public origin behind reverse proxies.
  const origin = checkoutOrigin(request);
  if (!origin || request.headers.get("origin") !== origin) return NextResponse.json({ error: "Please start checkout from this website." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)]);
  let resumable = false;
  try {
    const body = await readJsonBody(request, signal);
    const items = validateCheckoutItems(body?.items);
    if (!items) return NextResponse.json({ error: "Your cart contains invalid items. Remove them and choose products from the store." }, { status: 400 });
    const username = typeof body.username === "string" ? body.username.trim() : "";
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) return NextResponse.json({ error: "Enter a valid Java Minecraft username (3–16 letters, numbers or underscores)." }, { status: 400 });
    const ip = clientIp(request);
    if (!ip) return NextResponse.json({ error: "Secure checkout is not configured for this host. Please use the official store below." }, { status: 503 });
    const catalog = await fetchCatalog(signal);
    const products = items.map(item => catalog.find(product => product.id === item.packageId));
    if (products.some((product, index) => !product || (product.disableQuantity && items[index].quantity !== 1))) return NextResponse.json({ error: "An item is no longer available or its quantity is not allowed. Please refresh your cart." }, { status: 400 });
    if (new Set(products.map(product => product!.currency)).size !== 1) return NextResponse.json({ error: "Please check out items in one currency at a time." }, { status: 400 });
    const api = (path: string, init: RequestInit = {}) => tebexRequest(path, { ...init, signal });
    const jar = await cookies();
    const savedBasket = jar.get("rx-basket")?.value;
    let basket;
    if (savedBasket && /^[a-zA-Z0-9-]{1,160}$/.test(savedBasket)) {
      try {
        basket = (await api(accountPath(`/baskets/${savedBasket}`))).data;
      } catch (error) {
        if (error instanceof StoreUnavailableError && [404, 422].includes(error.status || 0)) jar.delete("rx-basket");
        else { resumable = true; throw error; }
      }
      if (basket?.complete || (basket?.username && basket.username.toLowerCase() !== username.toLowerCase())) basket = undefined;
    }
    if (!basket) {
      basket = (await api(accountPath("/baskets"), { method: "POST",
        body: JSON.stringify({ username, ip_address: ip, complete_url: `${origin}/store/success`, cancel_url: `${origin}/cart`, complete_auto_redirect: true }),
      })).data;
    }
    if (!basket || typeof basket.ident !== "string" || !/^[a-zA-Z0-9-]{1,160}$/.test(basket.ident) || basket.complete) throw new StoreUnavailableError("This checkout session has expired. Please start again.");
    const ident = basket.ident;
    jar.set("rx-basket", ident, { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), maxAge: 1800, path: "/" });
    resumable = true;
    if (!basket.username && !basket.username_id) {
      const auth = await api(accountPath(`/baskets/${ident}/auth?returnUrl=${encodeURIComponent(`${origin}/cart?resume=1`)}`));
      if (!Array.isArray(auth) || !auth.length) throw new StoreUnavailableError("Your Minecraft account could not be verified. Please check your username or use the official store.");
      const authUrl = trustedTebexUrl(auth[0]?.url);
      if (!authUrl) throw new StoreUnavailableError("Unable to open account verification. Please use the official store.");
      if (body.resume === true) return NextResponse.json({ error: "Account verification was not completed. Please try checkout again.", resumable: true }, { status: 400 });
      return NextResponse.json({ checkoutUrl: authUrl });
    }
    // Synchronize against current upstream contents so retries never add twice.
    for (const existing of basket.packages || []) {
      if (!items.some(item => item.packageId === String(existing.id))) await api(`/baskets/${ident}/packages/remove`, { method: "POST", body: JSON.stringify({ package_id: String(existing.id) }) });
    }
    for (const item of items) {
      const existing = basket.packages?.find((pkg: { id: number }) => String(pkg.id) === item.packageId);
      if (existing) {
        if (existing.in_basket?.quantity !== item.quantity) await api(`/baskets/${ident}/packages/${item.packageId}`, { method: "PUT", body: JSON.stringify({ quantity: item.quantity }) });
      } else {
        await api(`/baskets/${ident}/packages`, { method: "POST", body: JSON.stringify({ package_id: item.packageId, quantity: item.quantity }) });
      }
    }
    const finalBasket = await api(accountPath(`/baskets/${ident}`));
    const checkoutUrl = trustedTebexUrl(finalBasket.data?.links?.checkout);
    if (!checkoutUrl) throw new StoreUnavailableError("Checkout is not ready. Please try the official store.");
    // Keep the session for cancellation and retry; a completed basket is replaced on next use.
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof RequestBodyError || error instanceof StoreUnavailableError ? error.message : "The payment service could not be reached in time. Your cart is saved; please try again.",
      resumable,
    }, { status: error instanceof RequestBodyError ? error.status : 503 });
  }
}
