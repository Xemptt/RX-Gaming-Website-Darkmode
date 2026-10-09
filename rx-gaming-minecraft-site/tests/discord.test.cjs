const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const discord = loadTs("lib/discord.ts");

function configured(t) {
  const oldId = process.env.DISCORD_CLIENT_ID;
  const oldSecret = process.env.DISCORD_CLIENT_SECRET;
  process.env.DISCORD_CLIENT_ID = "123456789012345678";
  process.env.DISCORD_CLIENT_SECRET = "test-discord-secret-not-a-real-credential";
  t.after(() => {
    if (oldId === undefined) delete process.env.DISCORD_CLIENT_ID; else process.env.DISCORD_CLIENT_ID = oldId;
    if (oldSecret === undefined) delete process.env.DISCORD_CLIENT_SECRET; else process.env.DISCORD_CLIENT_SECRET = oldSecret;
  });
}

test("Discord sessions reject tampering, wrong purposes, expiry and changed signing secrets", t => {
  configured(t);
  const account = { id: "234567890123456789", username: "test_player" };
  const value = discord.createDiscordSession(account);
  assert.deepEqual(discord.readDiscordSession(value), account);
  assert.equal(discord.readDiscordSession(value + "x"), null);
  assert.equal(discord.readDiscordSession(discord.createDiscordState()), null);
  const originalNow = Date.now;
  try { Date.now = () => originalNow() + 86401000; assert.equal(discord.readDiscordSession(value), null); }
  finally { Date.now = originalNow; }
  process.env.DISCORD_CLIENT_SECRET = "changed-test-secret";
  assert.equal(discord.readDiscordSession(value), null);
});

test("Discord state and basket bindings cannot be reused for another account, basket or package selection", t => {
  configured(t);
  const state = discord.createDiscordState();
  assert.equal(discord.validDiscordState(state, state), true);
  assert.equal(discord.validDiscordState(undefined, state), false);
  assert.equal(discord.validDiscordState(state, discord.createDiscordState()), false);
  const binding = discord.bindDiscordBasket("basket-1", "234567890123456789", ["2", "1"]);
  assert.equal(discord.matchesDiscordBasket(binding, "basket-1", "234567890123456789", ["1", "2"]), true);
  assert.equal(discord.matchesDiscordBasket(binding, "basket-2", "234567890123456789", ["1", "2"]), false);
  assert.equal(discord.matchesDiscordBasket(binding, "basket-1", "334567890123456789", ["1", "2"]), false);
  assert.equal(discord.matchesDiscordBasket(binding, "basket-1", "234567890123456789", ["1", "2", "3"]), false);
});

function routes() {
  const jar = new Map();
  const options = new Map();
  const response = {
    json: (data, init) => Response.json(data, init),
    redirect: (url, status) => new Response(null, { status, headers: { location: url } }),
  };
  const mocks = {
    "next/server": { NextResponse: response },
    "next/headers": { cookies: async () => ({
      get: name => jar.has(name) ? { value: jar.get(name) } : undefined,
      set: (name, value, opts) => { jar.set(name, value); options.set(name, opts); },
      delete: name => jar.delete(name),
    }) },
    "@/lib/request": { checkoutOrigin: () => "https://site.example" },
  };
  return { jar, options, ...loadTs("app/api/discord/route.ts", mocks), callback: loadTs("app/api/discord/callback/route.ts", mocks).GET };
}

test("Discord login starts only from this site and requests only identify permission", async t => {
  configured(t);
  const h = routes();
  const crossSite = await h.POST(new Request("https://site.example/api/discord", { method: "POST", headers: { origin: "https://evil.example" } }));
  assert.equal(crossSite.status, 403);
  assert.equal(h.jar.size, 0);
  const response = await h.POST(new Request("https://site.example/api/discord", { method: "POST", headers: { origin: "https://site.example" } }));
  const url = new URL((await response.json()).url);
  assert.equal(url.origin, "https://discord.com");
  assert.equal(url.searchParams.get("scope"), "identify");
  assert.equal(url.searchParams.get("redirect_uri"), "https://site.example/api/discord/callback");
  assert.equal(url.searchParams.get("state"), h.jar.get(discord.DISCORD_STATE_COOKIE));
  assert.deepEqual(h.options.get(discord.DISCORD_STATE_COOKIE), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
});

test("Discord callback verifies state, reads the account server-side and clears the old basket", async t => {
  configured(t);
  const h = routes();
  const state = discord.createDiscordState();
  h.jar.set(discord.DISCORD_STATE_COOKIE, state);
  h.jar.set("rx-basket", "old-basket");
  const oldFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push(url);
    if (url.endsWith("/oauth2/token")) {
      assert.equal(init.body.get("grant_type"), "authorization_code");
      assert.equal(init.body.get("redirect_uri"), "https://site.example/api/discord/callback");
      return Response.json({ access_token: "test-access-token", refresh_token: "test-refresh-token", token_type: "Bearer" });
    }
    assert.equal(url, "https://discord.com/api/v10/users/@me");
    assert.equal(init.headers.Authorization, "Bearer test-access-token");
    return Response.json({ id: "234567890123456789", username: "player" });
  };
  t.after(() => { global.fetch = oldFetch; });
  const invalid = await h.callback(new Request("https://site.example/api/discord/callback?code=test&state=wrong"));
  assert.match(invalid.headers.get("location"), /discord=expired$/);
  assert.equal(calls.length, 0);
  const response = await h.callback(new Request(`https://site.example/api/discord/callback?code=test&state=${encodeURIComponent(state)}`));
  assert.equal(response.headers.get("location"), "https://site.example/cart?discord=connected");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(h.jar.has("rx-basket"), false);
  assert.equal(h.jar.has(discord.DISCORD_STATE_COOKIE), false);
  const cookie = h.jar.get(discord.DISCORD_SESSION_COOKIE);
  assert.deepEqual(discord.readDiscordSession(cookie), { id: "234567890123456789", username: "player" });
  assert.doesNotMatch(Buffer.from(cookie.split(".")[0], "base64url").toString(), /access.token|refresh.token/);
  const replay = await h.callback(new Request(`https://site.example/api/discord/callback?code=test&state=${encodeURIComponent(state)}`));
  assert.match(replay.headers.get("location"), /discord=expired$/);
  assert.equal(calls.length, 2);
});

test("Discord cancellation and outages return safely without an account cookie", async t => {
  configured(t);
  const h = routes();
  let state = discord.createDiscordState();
  h.jar.set(discord.DISCORD_STATE_COOKIE, state);
  const cancelled = await h.callback(new Request(`https://site.example/api/discord/callback?error=access_denied&state=${encodeURIComponent(state)}`));
  assert.match(cancelled.headers.get("location"), /discord=cancelled$/);
  state = discord.createDiscordState();
  h.jar.set(discord.DISCORD_STATE_COOKIE, state);
  const oldFetch = global.fetch;
  global.fetch = async () => new Response("private upstream details", { status: 503 });
  t.after(() => { global.fetch = oldFetch; });
  const failed = await h.callback(new Request(`https://site.example/api/discord/callback?code=test&state=${encodeURIComponent(state)}`));
  assert.match(failed.headers.get("location"), /discord=failed$/);
  assert.equal(h.jar.has(discord.DISCORD_SESSION_COOKIE), false);
});

test("Discord status is private, disconnect is origin-protected, and missing config fails clearly", async t => {
  configured(t);
  const h = routes();
  h.jar.set(discord.DISCORD_SESSION_COOKIE, discord.createDiscordSession({ id: "234567890123456789", username: "player" }));
  h.jar.set("rx-basket", "basket-1");
  const status = await h.GET();
  assert.equal(status.headers.get("cache-control"), "private, no-store");
  assert.equal((await status.json()).account.username, "player");
  assert.equal((await h.DELETE(new Request("https://site.example/api/discord", { method: "DELETE" }))).status, 403);
  assert.equal((await h.DELETE(new Request("https://site.example/api/discord", { method: "DELETE", headers: { origin: "https://site.example" } }))).status, 200);
  assert.equal(h.jar.size, 0);
  delete process.env.DISCORD_CLIENT_SECRET;
  assert.equal((await h.POST(new Request("https://site.example/api/discord", { method: "POST", headers: { origin: "https://site.example" } }))).status, 503);
});
