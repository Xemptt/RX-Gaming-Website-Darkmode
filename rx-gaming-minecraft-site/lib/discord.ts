import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DISCORD_SESSION_COOKIE = "rx-discord";
export const DISCORD_STATE_COOKIE = "rx-discord-state";
export const DISCORD_BASKET_COOKIE = "rx-basket-discord";
export const DISCORD_SESSION_SECONDS = 60 * 60 * 24;
export const DISCORD_CALLBACK_PATH = "/api/discord/callback";
export type DiscordAccount = { id: string; username: string };

export function discordConfigured() {
  return /^\d{17,20}$/.test(process.env.DISCORD_CLIENT_ID?.trim() || "") && !!process.env.DISCORD_CLIENT_SECRET?.trim();
}

function signature(value: string) {
  const secret = process.env.DISCORD_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("Discord login is not configured.");
  return createHmac("sha256", secret).update(`rx-discord-v1:${value}`).digest("base64url");
}

function sign(purpose: string, data: object, seconds: number) {
  const value = Buffer.from(JSON.stringify({ purpose, ...data, expires: Date.now() + seconds * 1000 })).toString("base64url");
  return `${value}.${signature(value)}`;
}

function read(value: string | undefined, purpose: string): Record<string, unknown> | null {
  if (!value || value.length > 2048 || !discordConfigured()) return null;
  try {
    const [payload, mac, extra] = value.split(".");
    if (!payload || !mac || extra !== undefined) return null;
    const expected = Buffer.from(signature(payload));
    const actual = Buffer.from(mac);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.purpose === purpose && typeof data.expires === "number" && data.expires > Date.now() ? data : null;
  } catch { return null; }
}

export function createDiscordState() {
  return sign("state", { nonce: randomBytes(32).toString("base64url") }, 600);
}

export function validDiscordState(cookie: string | undefined, state: string | null) {
  return !!state && state === cookie && read(cookie, "state") !== null;
}

export function createDiscordSession(account: DiscordAccount) {
  return sign("session", account, DISCORD_SESSION_SECONDS);
}

export function readDiscordSession(value: string | undefined): DiscordAccount | null {
  const data = read(value, "session");
  return data && typeof data.id === "string" && /^[1-9]\d{16,19}$/.test(data.id) &&
    typeof data.username === "string" && data.username.length > 0 && data.username.length <= 80
    ? { id: data.id, username: data.username } : null;
}

export function bindDiscordBasket(ident: string, id: string, packages: string[]) {
  return sign("basket", { ident, id, packages: [...packages].sort().join(",") }, 1800);
}

export function matchesDiscordBasket(value: string | undefined, ident: string, id: string, packages: string[]) {
  const data = read(value, "basket");
  return data?.ident === ident && data?.id === id && data?.packages === [...packages].sort().join(",");
}

export function discordCookieOptions(origin: string, maxAge: number) {
  return { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax" as const, path: "/", maxAge };
}

export function discordAuthorizationUrl(origin: string, state: string) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.search = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!.trim(), response_type: "code", scope: "identify",
    redirect_uri: `${origin}${DISCORD_CALLBACK_PATH}`, state, prompt: "consent",
  }).toString();
  return url.href;
}

export async function exchangeDiscordAccount(code: string, origin: string, signal: AbortSignal): Promise<DiscordAccount> {
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST", cache: "no-store", signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!.trim(), client_secret: process.env.DISCORD_CLIENT_SECRET!.trim(),
      grant_type: "authorization_code", code, redirect_uri: `${origin}${DISCORD_CALLBACK_PATH}`,
    }),
  });
  if (!response.ok) throw new Error("Discord login failed.");
  const token = await response.json();
  if (typeof token.access_token !== "string" || token.token_type?.toLowerCase() !== "bearer") throw new Error("Discord login failed.");
  const profile = await fetch("https://discord.com/api/v10/users/@me", {
    cache: "no-store", signal, headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!profile.ok) throw new Error("Discord account unavailable.");
  const user = await profile.json();
  if (typeof user.id !== "string" || !/^[1-9]\d{16,19}$/.test(user.id) || typeof user.username !== "string" || !user.username || user.username.length > 80 || user.bot) {
    throw new Error("Invalid Discord account.");
  }
  // Access and refresh tokens never enter browser storage or the session cookie.
  return { id: user.id, username: user.username };
}
