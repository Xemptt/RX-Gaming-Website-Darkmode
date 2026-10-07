const {test}=require("node:test");
const assert=require("node:assert/strict");
const {loadTs}=require("./load-ts.cjs");

test("backend basket requests preserve Basic auth with public token and private key",async()=>{
  const originalFetch=global.fetch;
  const originalPublic=process.env.TEBEX_PUBLIC_TOKEN;
  const originalPrivate=process.env.TEBEX_PRIVATE_KEY;
  try {
    process.env.TEBEX_PUBLIC_TOKEN="test-public-token";
    process.env.TEBEX_PRIVATE_KEY="test-private-key";
    const {accountPath,tebexAuthorization,tebexRequest}=loadTs("lib/tebex.ts");
    global.fetch=async(url,init)=>{
      assert.equal(url,"https://headless.tebex.io/api/accounts/test-public-token/baskets");
      const headers=new Headers(init.headers);
      assert.equal(headers.get("Authorization"),"Basic "+Buffer.from("test-public-token:test-private-key").toString("base64"));
      assert.equal(headers.get("Content-Type"),"application/json");
      assert.equal(headers.get("Accept"),"application/json");
      return Response.json({data:{ident:"test-basket"}});
    };
    const headers=new Headers({Authorization:tebexAuthorization()});
    await tebexRequest(accountPath("/baskets"),{method:"POST",headers,body:"{}"});
  } finally {
    global.fetch=originalFetch;
    if(originalPublic===undefined)delete process.env.TEBEX_PUBLIC_TOKEN;else process.env.TEBEX_PUBLIC_TOKEN=originalPublic;
    if(originalPrivate===undefined)delete process.env.TEBEX_PRIVATE_KEY;else process.env.TEBEX_PRIVATE_KEY=originalPrivate;
  }
});

test("missing private credentials fail before making a checkout request",()=>{
  const original=process.env.TEBEX_PRIVATE_KEY;
  try {
    delete process.env.TEBEX_PRIVATE_KEY;
    const {tebexAuthorization,StoreUnavailableError}=loadTs("lib/tebex.ts");
    assert.throws(tebexAuthorization,error=>error instanceof StoreUnavailableError&&/secure checkout/i.test(error.message));
  } finally {if(original===undefined)delete process.env.TEBEX_PRIVATE_KEY;else process.env.TEBEX_PRIVATE_KEY=original;}
});

test("Tebex validation details explain a rejected request",async()=>{
  const originalFetch=global.fetch;
  try {
    global.fetch=async()=>Response.json({title:"Request payload error",detail:"Basic auth credentials are required"},{status:422});
    const {tebexRequest,StoreUnavailableError}=loadTs("lib/tebex.ts");
    await assert.rejects(tebexRequest("/test"),error=>error instanceof StoreUnavailableError&&error.status===422&&/Basic auth credentials are required/.test(error.message));
  } finally {global.fetch=originalFetch;}
});
