const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
function harness({ auth = false, failAtPackage, malicious = false } = {}) {
  const jar = new Map();
  const calls = [];
  let failed = false;
  let basket = { ident: "basket-123", username: auth ? null : "Player_1", username_id: auth ? null : 10, complete: false, packages: [], links: { checkout: malicious ? "https://evil.test/pay" : "https://pay.tebex.io/basket-123" } };
  class StoreUnavailableError extends Error {}
  const service = {
    StoreUnavailableError,
    accountPath: path => "/accounts/test" + path,
    fetchCatalog: async () => [{id:"123",currency:"GBP",price:5},{id:"124",currency:"GBP",price:8},{id:"125",currency:"GBP",price:10,disableQuantity:true}],
    tebexRequest: async (path, init={}) => {
      calls.push({path,init});
      assert.ok(init.signal instanceof AbortSignal, "all upstream requests receive cancellation");
      if (path.endsWith("/baskets") && init.method === "POST") return {data:structuredClone(basket)};
      if (path.includes("/auth?")) return [{name:"Minecraft",url:"https://ident.tebex.io/verify"}];
      if (path.endsWith("/packages")) {
        const payload=JSON.parse(init.body);
        if (failAtPackage === payload.package_id && !failed) {failed=true;throw new Error("Temporary upstream outage");}
        basket.packages.push({id:Number(payload.package_id),in_basket:{quantity:payload.quantity}});
        return {data:structuredClone(basket)};
      }
      if (path.endsWith("/packages/remove")) { const id=JSON.parse(init.body).package_id; basket.packages=basket.packages.filter(p=>String(p.id)!==id); return {}; }
      if (/\/packages\/\d+$/.test(path) && init.method==="PUT") {basket.packages.find(p=>String(p.id)===path.split("/").pop()).in_basket.quantity=JSON.parse(init.body).quantity;return {};}
      return {data:structuredClone(basket)};
    }
  };
  const requestLib=loadTs("lib/request.ts");
  const {POST}=loadTs("app/api/tebex/checkout/route.ts",{
    "@/lib/tebex":service,
    "@/lib/request":{...requestLib,clientIp:()=> "203.0.113.10"},
    "next/headers":{cookies:async()=>({get:name=>jar.has(name)?{value:jar.get(name)}:undefined,set:(name,value,options)=>{assert.equal(options.httpOnly,true);jar.set(name,value);},delete:name=>jar.delete(name)})}
  });
  const request=(body, origin="http://localhost:3000")=>new Request("http://localhost:3000/api/tebex/checkout",{method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify({username:"Player_1",items:[{packageId:"123",quantity:2}],...body})});
  return {POST,request,calls,jar,basket,verify:()=>{basket.username="Player_1";basket.username_id=10;}};
}
test("fresh Minecraft basket includes username/client IP and authoritative package quantities",async()=>{
  const h=harness();const response=await h.POST(h.request());
  assert.equal(response.status,200);
  assert.equal((await response.json()).checkoutUrl,"https://pay.tebex.io/basket-123");
  const create=JSON.parse(h.calls.find(c=>c.path.endsWith("/baskets")).init.body);
  assert.equal(create.username,"Player_1");assert.equal(create.ip_address,"203.0.113.10");
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

