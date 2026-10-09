const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const discord = loadTs("lib/discord.ts");

function connectDiscord(h, t, id = "234567890123456789") {
  const oldId = process.env.DISCORD_CLIENT_ID;
  const oldSecret = process.env.DISCORD_CLIENT_SECRET;
  process.env.DISCORD_CLIENT_ID = "123456789012345678";
  process.env.DISCORD_CLIENT_SECRET = "test-discord-secret";
  t.after(() => {
    if (oldId === undefined) delete process.env.DISCORD_CLIENT_ID; else process.env.DISCORD_CLIENT_ID = oldId;
    if (oldSecret === undefined) delete process.env.DISCORD_CLIENT_SECRET; else process.env.DISCORD_CLIENT_SECRET = oldSecret;
  });
  h.jar.set(discord.DISCORD_SESSION_COOKIE, discord.createDiscordSession({ id, username: "test_player" }));
}

test("Discord packages require a verified account and ignore request-body IDs", async () => {
  const h = harness({ packageOptions: [{ name: "discord_id", type: "discord_id", required: false }] });
  const response = await h.POST(h.request({ discordId: "234567890123456789" }));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).needsDiscord, true);
  assert.equal(h.calls.some(call => call.init.method === "POST"), false);
});

test("checkout sends verified Discord and delivery-server variables together and retries without duplication", async t => {
  const h = harness({ packageOptions: [
    { name: "server", type: "dropdown", options: [{ value: 2441063 }] },
    { name: "discord_id", type: "discord_id", required: false },
  ] });
  connectDiscord(h, t);
  assert.equal((await h.POST(h.request())).status, 200);
  const add = h.calls.find(call => call.path.endsWith("/packages") && call.init.method === "POST");
  assert.deepEqual(JSON.parse(add.init.body).variable_data, { server: "2441063", discord_id: "234567890123456789" });
  assert.equal((await h.POST(h.request())).status, 200);
  assert.equal(h.calls.filter(call => call.path.endsWith("/baskets") && call.init.method === "POST").length, 1);
  assert.equal(h.basket.packages.length, 1);
});

test("changing Discord account or upgrading a legacy basket creates a basket with current role delivery", async t => {
  const h = harness({ packageOptions: [{ name: "discord_id", type: "discord_id" }] });
  connectDiscord(h, t);
  assert.equal((await h.POST(h.request())).status, 200);
  h.jar.set(discord.DISCORD_SESSION_COOKIE, discord.createDiscordSession({ id: "334567890123456789", username: "other_player" }));
  assert.equal((await h.POST(h.request())).status, 200);
  const adds = h.calls.filter(call => call.path.endsWith("/packages") && call.init.method === "POST");
  assert.equal(JSON.parse(adds[1].init.body).variable_data.discord_id, "334567890123456789");
  assert.equal(h.calls.filter(call => call.path.endsWith("/baskets") && call.init.method === "POST").length, 2);
  h.jar.delete(discord.DISCORD_BASKET_COOKIE);
  assert.equal((await h.POST(h.request())).status, 200);
  assert.equal(h.calls.filter(call => call.path.endsWith("/baskets") && call.init.method === "POST").length, 3);
});

test("new Discord requirements on an existing package force that package to be prepared again", async t => {
  const options = [];
  const h = harness({ packageOptions: options });
  connectDiscord(h, t);
  assert.equal((await h.POST(h.request())).status, 200);
  options.push({ name: "discord_id", type: "discord_id" });
  assert.equal((await h.POST(h.request())).status, 200);
  const adds = h.calls.filter(call => call.path.endsWith("/packages") && call.init.method === "POST");
  assert.equal(adds.length, 2);
  assert.equal(JSON.parse(adds[1].init.body).variable_data.discord_id, "234567890123456789");
});

function harness({ auth = false, authOptions = [{name:"Minecraft",url:"https://ident.tebex.io/verify"}], failAtPackage, malicious = false, voucherStatus, voucherDetail, packageOptions = [], trustedIp = "203.0.113.10", configured = true } = {}) {
  const jar = new Map();
  const calls = [];
  let failed = false;
  let created = 0;
  let basket = { ident: "basket-123", username: null, username_id: null, ip: trustedIp, complete: false, packages: [], coupons: [], giftcards: [], links: {} };
  class StoreUnavailableError extends Error { constructor(message, status, detail) { super(message); this.status=status; this.detail=detail; } }
  const service = {
    StoreUnavailableError,
    tebexAuthorization: () => {
      if (!configured) throw new StoreUnavailableError("Secure checkout is temporarily unavailable. Please use the official store.");
      return "Basic test-credentials";
    },
    accountPath: path => "/accounts/test" + path,
    fetchCatalog: async () => [{id:"123",currency:"GBP",price:5},{id:"124",currency:"GBP",price:8},{id:"125",currency:"GBP",price:10,disableQuantity:true}],
    tebexRequest: async (path, init={}) => {
      calls.push({path,init});
      assert.ok(init.signal instanceof AbortSignal, "all upstream requests receive cancellation");
      assert.equal(new Headers(init.headers).get("Authorization"),"Basic test-credentials", "basket requests must be authenticated");
      if (path.endsWith("/baskets") && init.method === "POST") {
        const payload=JSON.parse(init.body);
        assert.equal(payload.ip_address,trustedIp);
        const ident=++created === 1 ? "basket-123" : `basket-123-${created}`;
        basket={ident,username:auth ? null : payload.username,username_id:auth ? null : 10,ip:payload.ip_address,complete:false,packages:[],coupons:[],giftcards:[],links:{}};
        return {data:structuredClone(basket)};
      }
      if (path.includes("/auth?")) return authOptions;
      if (/^\/accounts\/test\/packages\/\d+$/.test(path)) return {data:{options:packageOptions,variables:[]}};
      if (path.endsWith("/packages")) {
        const payload=JSON.parse(init.body);
        if (failAtPackage === payload.package_id && !failed) {failed=true;throw new Error("Temporary upstream outage");}
        basket.packages.push({id:Number(payload.package_id),in_basket:{quantity:payload.quantity}});
        basket.links.checkout=malicious ? "https://evil.test/pay" : `https://pay.tebex.io/${basket.ident}`;
        return {data:structuredClone(basket)};
      }
      if (path.endsWith("/packages/remove")) { const id=JSON.parse(init.body).package_id; basket.packages=basket.packages.filter(p=>String(p.id)!==id); return {}; }
      if (/\/packages\/\d+$/.test(path) && init.method==="PUT") {basket.packages.find(p=>String(p.id)===path.split("/").pop()).in_basket.quantity=JSON.parse(init.body).quantity;return {};}
      if (path.endsWith("/coupons/remove")) {
        const code=JSON.parse(init.body || "{}").coupon_code;
        assert.equal(typeof code,"string","Tebex requires the coupon_code being removed");
        basket.coupons=basket.coupons.filter(coupon=>coupon.code!==code);
        return {success:true};
      }
      if (path.endsWith("/coupons")) {
        if (voucherStatus) throw new StoreUnavailableError("Tebex rejected the code", voucherStatus, voucherDetail);
        const code=JSON.parse(init.body).coupon_code;
        basket.coupons.push({code});
        return {success:true};
      }
      if (path.endsWith("/giftcards/remove")) { const code=JSON.parse(init.body).card_number; basket.giftcards=basket.giftcards.filter(card=>card.card_number!==code); return {}; }
      if (path.endsWith("/giftcards")) { if (voucherStatus) throw new StoreUnavailableError("Tebex rejected the code", voucherStatus, voucherDetail); basket.giftcards=[JSON.parse(init.body)]; return {success:true}; }
      return {data:structuredClone(basket)};
    }
  };
  const requestLib=loadTs("lib/request.ts");
  const {POST}=loadTs("app/api/tebex/checkout/route.ts",{
    "@/lib/tebex":service,
    "@/lib/request":{...requestLib,clientIp:()=>trustedIp},
    "next/server":{NextResponse:Response},
    "next/headers":{cookies:async()=>({get:name=>jar.has(name)?{value:jar.get(name)}:undefined,set:(name,value,options)=>{assert.equal(options.httpOnly,true);jar.set(name,value);},delete:name=>jar.delete(name)})}
  });
  const request=(body, origin="http://localhost:3000")=>new Request("http://localhost:3000/api/tebex/checkout",{method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify({username:"Player_1",items:[{packageId:"123",quantity:2}],...body})});
  return {POST,request,calls,jar,get basket(){return basket;},verify:()=>{basket.username="Player_1";basket.username_id=10;}};
}
test("fresh Java basket binds the username and customer IP through authenticated requests",async()=>{
  const h=harness({authOptions:[]});const response=await h.POST(h.request());
  assert.equal(response.status,200);
  assert.equal((await response.json()).checkoutUrl,"https://pay.tebex.io/basket-123");
  const create=JSON.parse(h.calls.find(c=>c.path.endsWith("/baskets")).init.body);
  assert.equal(create.username,"Player_1");assert.equal(create.ip_address,"203.0.113.10");
  assert.equal(h.calls.some(c=>c.path.includes("/auth?")),false);
  assert.deepEqual(h.basket.packages,[{id:123,in_basket:{quantity:2}}]);
});
test("authentication redirect resumes the same basket and adds packages once",async()=>{
  const h=harness({auth:true});
  assert.equal((await (await h.POST(h.request())).json()).checkoutUrl,"https://ident.tebex.io/verify");
  assert.equal(h.basket.packages.length,0);
  h.verify();
  assert.equal((await h.POST(h.request({resume:true}))).status,200);
  assert.equal(h.calls.filter(c=>c.path.endsWith("/baskets")).length,1);
  assert.equal(h.basket.packages.length,1);
});
test("partial upstream failure is resumable and retry does not duplicate purchases",async()=>{
  const h=harness({failAtPackage:"124"});
  const body={items:[{packageId:"123",quantity:2},{packageId:"124",quantity:1}]};
  const failed=await h.POST(h.request(body));assert.equal(failed.status,503);assert.equal((await failed.json()).resumable,true);
  assert.equal((await h.POST(h.request(body))).status,200);
  assert.equal(h.calls.filter(c=>c.path.endsWith("/baskets")).length,1);
  assert.deepEqual(h.basket.packages.map(p=>p.id),[123,124]);
});
test("checkout fails closed for invalid origin, username, unavailable IDs and redirect hosts",async()=>{
  let h=harness();assert.equal((await h.POST(h.request({},"https://evil.test"))).status,403);
  assert.equal((await h.POST(h.request({username:"invalid name"}))).status,400);
  assert.equal((await h.POST(h.request({items:[{packageId:"999",quantity:1}]}))).status,400);
  assert.equal((await h.POST(h.request({items:[{packageId:"125",quantity:2}]}))).status,400);
  h=harness({malicious:true});assert.equal((await h.POST(h.request())).status,503);
});
test("checkout synchronizes removals and changed quantities after cancellation",async()=>{
  const h=harness();await h.POST(h.request());
  h.basket.packages.push({id:124,in_basket:{quantity:1}});
  assert.equal((await h.POST(h.request({items:[{packageId:"123",quantity:3}]}))).status,200);
  assert.deepEqual(h.basket.packages,[{id:123,in_basket:{quantity:3}}]);
});
test("checkout applies a Tebex discount code to the basket",async()=>{
  const h=harness();const response=await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}));
  assert.equal(response.status,200);
  assert.deepEqual(h.basket.coupons,[{code:"RX-G"}]);
  assert.ok(h.calls.some(c=>c.path.endsWith("/coupons")&&JSON.parse(c.init.body).coupon_code==="RX-G"));
});
test("checkout applies a Tebex gift card to the basket",async()=>{
  const h=harness();const response=await h.POST(h.request({voucherType:"giftcard",voucherCode:"0123 4567"}));
  assert.equal(response.status,200);
  assert.deepEqual(h.basket.giftcards,[{card_number:"0123 4567"}]);
  assert.ok(h.calls.some(c=>c.path.endsWith("/giftcards")&&JSON.parse(c.init.body).card_number==="0123 4567"));
});
test("invalid Tebex voucher codes return a clear error",async()=>{
  const h=harness({voucherStatus:422});const response=await h.POST(h.request({voucherType:"coupon",voucherCode:"NOT-VALID"}));
  assert.equal(response.status,422);
  assert.match((await response.json()).error,/could not be applied/i);
});
test("checkout shows the actual Tebex coupon eligibility reason",async()=>{
  const reason="You have items in your basket where the coupon cannot be applied.";
  const h=harness({voucherStatus:400,voucherDetail:reason});
  const response=await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}));
  const body=await response.json();
  assert.equal(response.status,422);
  assert.ok(body.error.includes(reason));
  assert.equal(body.resumable,true);
});
test("service authentication failures are not reported as invalid discount codes",async()=>{
  const h=harness({voucherStatus:401});
  const response=await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}));
  assert.equal(response.status,503);
});
test("retry keeps an existing coupon using Tebex's code response field",async()=>{
  const h=harness();const body={voucherType:"coupon",voucherCode:"RX-G"};
  assert.equal((await h.POST(h.request(body))).status,200);
  assert.equal((await h.POST(h.request(body))).status,200);
  assert.deepEqual(h.basket.coupons,[{code:"RX-G"}]);
  assert.equal(h.calls.filter(c=>c.path.endsWith("/coupons")).length,1);
  assert.equal(h.calls.filter(c=>c.path.endsWith("/coupons/remove")).length,0);
});
test("changing a coupon removes each old code with the required payload",async()=>{
  const h=harness();await h.POST(h.request({voucherType:"coupon",voucherCode:"OLD"}));
  h.basket.coupons.push({code:"ALSO-OLD"});
  const response=await h.POST(h.request({voucherType:"coupon",voucherCode:"NEW"}));
  assert.equal(response.status,200);
  assert.deepEqual(h.basket.coupons,[{code:"NEW"}]);
  assert.deepEqual(h.calls.filter(c=>c.path.endsWith("/coupons/remove")).map(c=>JSON.parse(c.init.body).coupon_code),["OLD","ALSO-OLD"]);
});
test("clearing the code clears saved coupons and gift cards",async()=>{
  const h=harness();await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}));
  h.basket.giftcards.push({card_number:"0123 4567"});
  const response=await h.POST(h.request({voucherType:"coupon",voucherCode:""}));
  assert.equal(response.status,200);
  assert.deepEqual(h.basket.coupons,[]);
  assert.deepEqual(h.basket.giftcards,[]);
});
test("switching between a coupon and gift card removes the previous type",async()=>{
  const h=harness();await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}));
  assert.equal((await h.POST(h.request({voucherType:"giftcard",voucherCode:"0123 4567"}))).status,200);
  assert.deepEqual(h.basket.coupons,[]);
  assert.deepEqual(h.basket.giftcards,[{card_number:"0123 4567"}]);
  assert.equal((await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}))).status,200);
  assert.deepEqual(h.basket.giftcards,[]);
  assert.deepEqual(h.basket.coupons,[{code:"RX-G"}]);
});
test("saved anonymous baskets are recreated with the entered Java username",async()=>{
  const h=harness({authOptions:[]});h.jar.set("rx-basket",h.basket.ident);
  const response=await h.POST(h.request());
  assert.equal(response.status,200);
  assert.equal(h.calls.filter(c=>c.path.endsWith("/baskets")&&c.init.method==="POST").length,1);
  assert.equal(h.basket.username,"Player_1");
  assert.equal(h.calls.some(c=>c.path.includes("/auth?")),false);
});
test("changing recipient creates a fresh basket for the new Java username",async()=>{
  const h=harness();await h.POST(h.request());
  const response=await h.POST(h.request({username:"Player_2"}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).checkoutUrl,"https://pay.tebex.io/basket-123-2");
  assert.equal(h.calls.filter(c=>c.path.endsWith("/baskets")&&c.init.method==="POST").length,2);
  assert.equal(h.basket.username,"Player_2");
  assert.deepEqual(h.basket.packages,[{id:123,in_basket:{quantity:2}}]);
});
test("checkout refuses basket creation when server credentials are missing",async()=>{
  const h=harness({configured:false});const response=await h.POST(h.request());
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/secure checkout/i);
  assert.equal(h.calls.length,0);
});
test("checkout refuses basket creation without a trusted customer IP",async()=>{
  const h=harness({trustedIp:null});const response=await h.POST(h.request());
  assert.equal(response.status,503);
  assert.equal(h.calls.length,0);
});
test("a saved basket attributed to a different IP is replaced",async()=>{
  const h=harness();await h.POST(h.request());h.basket.ip="203.0.113.20";
  const response=await h.POST(h.request());
  assert.equal(response.status,200);
  assert.equal(h.calls.filter(c=>c.path.endsWith("/baskets")&&c.init.method==="POST").length,2);
  assert.equal(h.basket.ip,"203.0.113.10");
});

test("a package's sole delivery server is sent using Tebex variable_data",async()=>{
  const h=harness({packageOptions:[{name:"server",type:"dropdown",options:[{label:"RLCraft",value:2441063}]}]});
  const response=await h.POST(h.request({voucherType:"coupon",voucherCode:"RX-G"}));
  assert.equal(response.status,200);
  const add=h.calls.find(call=>call.path.endsWith("/packages"));
  assert.deepEqual(JSON.parse(add.init.body).variable_data,{server:"2441063"});
  assert.deepEqual(h.basket.coupons,[{code:"RX-G"}]);
});

test("checkout does not choose a delivery server when the customer has a choice",async()=>{
  const h=harness({packageOptions:[{name:"server",type:"dropdown",options:[{value:1},{value:2}]}]});
  const response=await h.POST(h.request());
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/select its options in the official store/);
  assert.equal(h.calls.some(call=>call.path.endsWith("/packages")),false);
});

