import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkoutOrigin } from "@/lib/request";
import {
  discordConfigured, readDiscordSession, createDiscordState, discordAuthorizationUrl,
  discordCookieOptions, DISCORD_SESSION_COOKIE, DISCORD_STATE_COOKIE, DISCORD_BASKET_COOKIE,
} from "@/lib/discord";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({ configured: discordConfigured(), account: readDiscordSession(jar.get(DISCORD_SESSION_COOKIE)?.value) }, { headers });
}

export async function POST(request: Request) {
  const origin = checkoutOrigin(request);
  if (!origin || request.headers.get("origin") !== origin) {
    return NextResponse.json({ error: "Please connect Discord from this website." }, { status: 403, headers });
  }
  if (!discordConfigured()) {
    return NextResponse.json({ error: "Discord login is not available yet. Please use the official store to purchase a Discord rank." }, { status: 503, headers });
  }
  const state = createDiscordState();
  (await cookies()).set(DISCORD_STATE_COOKIE, state, discordCookieOptions(origin, 600));
  return NextResponse.json({ url: discordAuthorizationUrl(origin, state) }, { headers });
}

export async function DELETE(request: Request) {
  const origin = checkoutOrigin(request);
  if (!origin || request.headers.get("origin") !== origin) {
    return NextResponse.json({ error: "Please disconnect Discord from this website." }, { status: 403, headers });
  }
  const jar = await cookies();
  for (const name of [DISCORD_SESSION_COOKIE, DISCORD_STATE_COOKIE, DISCORD_BASKET_COOKIE, "rx-basket"]) jar.delete(name);
  return NextResponse.json({ account: null }, { headers });
}
