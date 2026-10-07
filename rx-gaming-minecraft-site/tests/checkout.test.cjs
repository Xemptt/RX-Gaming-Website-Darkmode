const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
function harness({ auth = false, authOptions = [{name:"Minecraft",url:"https://ident.tebex.io/verify"}], failAtPackage, malicious = false, voucherStatus } = {}) {
  const jar = new Map();
  const calls = [];
  let failed = false;
  let created = 0;
  let basket = { ident: "basket-123", username: null, username_id: null, complete: false, packages: [], coupons: [], giftcards: [], links: {} };
  class StoreUnavailableError extends Error { constructor(message, status) { super(message); this.status=status; } }
  const service = {
    StoreUnavailableError,
    accountPath: path => "/accounts/test" + path,
    fetchCatalog: async () => [{id:"123",currency:"GBP",price:5},{id:"124",currency:"GBP",price:8},{id:"125",currency:"GBP",price:10,disableQuantity:true}],
    tebexRequest: async (path, init={}) => {
      calls.push({path,init});
      assert.ok(init.signal instanceof AbortSignal, "all upstream requests receive cancellation");
      if (path.endsWith("/baskets") && init.method === "POST") {
        const payload=JSON.parse(init.body);
        if (Object.hasOwn(payload,"ip_address")) throw new StoreUnavailableError("Tebex rejected ip_address",422);
        const ident=++created === 1 ? "basket-123" : `basket-123-${created}`;
        basket={ident,username:auth ? null : payload.username,username_id:auth ? null : 10,complete:false,packages:[],coupons:[],giftcards:[],links:{}};
        return {data:structuredClone(basket)};
      }
      if (path.includes("/auth?")) return authOptions;
      if (path.endsWith("/packages")) {
        const payload=JSON.parse(init.body);
        if (failAtPackage === payload.package_id && !failed) {failed=true;throw new Error("Temporary upstream outage");}
        basket.packages.push({id:Number(payload.package_id),in_basket:{quantity:payload.quantity}});
        basket.links.checkout=malicious ? "https://evil.test/pay" : `https://pay.tebex.io/${basket.ident}`;
        return {data:structuredClone(basket)};
      }
      if (path.endsWith("/packages/remove")) { const id=JSON.parse(init.body).package_id; basket.packages=basket.packages.filter(p=>String(p.id)!==id); return {}; }
      if (/\/packages\/\d+$/.test(path) && init.method==="PUT") {basket.packages.find(p=>String(p.id)===path.split("/").pop()).in_basket.quantity=JSON.parse(init.body).quantity;return {};}
      if (path.endsWith("/coupons/remove")) { basket.coupons=[]; return {}; }
      if (path.endsWith("/coupons")) { if (voucherStatus) throw new StoreUnavailableError("Tebex rejected the code", voucherStatus); basket.coupons=[JSON.parse(init.body)]; return {data:structuredClone(basket)}; }
      if (path.endsWith("/giftcards/remove")) { const code=JSON.parse(init.body).card_number; basket.giftcards=basket.giftcards.filter(card=>card.card_number!==code); return {}; }
      if (path.endsWith("/giftcards")) { if (voucherStatus) throw new StoreUnavailableError("Tebex rejected the code", voucherStatus); basket.giftcards=[JSON.parse(init.body)]; return {data:structuredClone(basket)}; }
      return {data:structuredClone(basket)};
    }
  };
  const requestLib=loadTs("lib/request.ts");
  const {POST}=loadTs("app/api/tebex/checkout/route.ts",{
    "@/lib/tebex":service,
    "@/lib/request":requestLib,
    "next/server":{NextResponse:Response},
    "next/headers":{cookies:async()=>({get:name=>jar.has(name)?{value:jar.get(name)}:undefined,set:(name,value,options)=>{assert.equal(options.httpOnly,true);jar.set(name,value);},delete:name=>jar.delete(name)})}
  });
  const request=(body, origin="http://localhost:3000")=>new Request("http://localhost:3000/api/tebex/checkout",{method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify({username:"Player_1",items:[{packageId:"123",quantity:2}],...body})});
  return {POST,request,calls,jar,get basket(){return basket;},verify:()=>{basket.username="Player_1";basket.username_id=10;}};
}
test("fresh Java basket binds the username without the rejected IP field or account authentication",async()=>{
  const h=harness({authOptions:[]});const response=await h.POST(h.request());
  assert.equal(response.status,200);
  assert.equal((await response.json()).checkoutUrl,"https://pay.tebex.io/basket-123");
  const create=JSON.parse(h.calls.find(c=>c.path.endsWith("/baskets")).init.body);
  assert.equal(create.username,"Player_1");assert.equal(Object.hasOwn(create,"ip_address"),false);
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
  assert.deepEqual(h.basket.coupons,[{coupon_code:"RX-G"}]);
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

