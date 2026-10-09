import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkoutOrigin } from "@/lib/request";
import {
  validDiscordState, exchangeDiscordAccount, createDiscordSession, discordCookieOptions,
  DISCORD_SESSION_COOKIE, DISCORD_STATE_COOKIE, DISCORD_BASKET_COOKIE, DISCORD_SESSION_SECONDS,
} from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = checkoutOrigin(request);
  if (!origin) return NextResponse.json({ error: "Website address is unavailable." }, { status: 503 });
  const finish = (result: string) => {
    const response = NextResponse.redirect(`${origin}/cart?discord=${result}`, 303);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  const jar = await cookies();
  const params = new URL(request.url).searchParams;
  if (!validDiscordState(jar.get(DISCORD_STATE_COOKIE)?.value, params.get("state"))) return finish("expired");
  jar.delete(DISCORD_STATE_COOKIE);
  if (params.has("error")) return finish("cancelled");
  const code = params.get("code");
  if (!code || code.length > 2048) return finish("failed");
  try {
    const account = await exchangeDiscordAccount(code, origin, AbortSignal.any([request.signal, AbortSignal.timeout(15000)]));
    jar.set(DISCORD_SESSION_COOKIE, createDiscordSession(account), discordCookieOptions(origin, DISCORD_SESSION_SECONDS));
    // A new account must never inherit another account's prepared Tebex basket.
    jar.delete("rx-basket");
    jar.delete(DISCORD_BASKET_COOKIE);
    return finish("connected");
  } catch {
    return finish("failed");
  }
}
