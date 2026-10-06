const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const {readJsonBody,clientIp,checkoutOrigin}=loadTs("lib/request.ts");
test("checkout uses the browser host and configured deployment origin without trusting forwarded hosts",()=>{
  const previous=process.env.SITE_URL;
  try {
    delete process.env.SITE_URL;
    const req=new Request("http://localhost:3000/api/tebex/checkout",{headers:{host:"127.0.0.1:3000","x-forwarded-host":"evil.test"}});
    assert.equal(checkoutOrigin(req),"http://127.0.0.1:3000");
    assert.equal(checkoutOrigin(new Request("http://localhost",{headers:{host:"localhost@evil.test"}})),null);
    process.env.SITE_URL="https://site.rx-gaming.online";
    assert.equal(checkoutOrigin(req),"https://site.rx-gaming.online");
    process.env.SITE_URL="invalid";assert.equal(checkoutOrigin(req),null);
  } finally {if(previous===undefined)delete process.env.SITE_URL;else process.env.SITE_URL=previous;}
});
test("request body cap rejects streamed bytes before buffering the entire upload",async()=>{
  let cancelled=false;
  const stream=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(6000));},cancel(){cancelled=true;}});
  const request=new Request("http://localhost",{method:"POST",body:stream,duplex:"half"});
  await assert.rejects(readJsonBody(request,new AbortController().signal),error=>error.status===413);
  assert.equal(cancelled,true);
});
test("request body reader stops on cancellation and handles malformed JSON",async()=>{
  await assert.rejects(readJsonBody(new Request("http://localhost",{method:"POST",body:"{"}),new AbortController().signal),error=>error.status===400);
  const controller=new AbortController();
  const stream=new ReadableStream({});
  const promise=readJsonBody(new Request("http://localhost",{method:"POST",body:stream,duplex:"half"}),controller.signal);
  controller.abort();
  await assert.rejects(promise);
});
test("client IP is accepted only from explicitly trusted deployment headers",()=>{
  const oldVercel=process.env.VERCEL;const oldHeader=process.env.TEBEX_CLIENT_IP_HEADER;
  try{
    delete process.env.VERCEL;delete process.env.TEBEX_CLIENT_IP_HEADER;
    const req=new Request("http://localhost",{headers:{"x-forwarded-for":"203.0.113.2","x-vercel-forwarded-for":"203.0.113.3"}});
    assert.equal(clientIp(req),null);
    process.env.VERCEL="1";assert.equal(clientIp(req),"203.0.113.3");
    delete process.env.VERCEL;process.env.TEBEX_CLIENT_IP_HEADER="x-forwarded-for";assert.equal(clientIp(req),"203.0.113.2");
    assert.equal(clientIp(new Request("http://localhost",{headers:{"x-forwarded-for":"203.0.113.1, 203.0.113.2"}})),null);
  }finally{if(oldVercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=oldVercel;if(oldHeader===undefined)delete process.env.TEBEX_CLIENT_IP_HEADER;else process.env.TEBEX_CLIENT_IP_HEADER=oldHeader;}
});
test("realm categories override ambiguous package names and live currency is retained",async()=>{
  const oldFetch=global.fetch;const oldToken=process.env.TEBEX_PUBLIC_TOKEN;
  try{
    process.env.TEBEX_PUBLIC_TOKEN="test-only-token";
    global.fetch=async url=>{
      assert.match(url,/^https:\/\/headless.tebex.io\/api\/accounts\/test-only-token\/categories\?includePackages=1$/);
      return Response.json({data:[{name:"Insane ranks",parent:{name:"RLCraft"},packages:[{id:1,name:"Insane Rank",total_price:5,currency:"GBP"}]},{name:"Packages",parent:{name:"Insanecraft"},packages:[{id:2,name:"Survival Bundle",total_price:8,currency:"GBP"}]},{name:"Other",parent:{name:"RLCraft"},packages:[{id:3,name:"🐉 Dragonborn",total_price:12,currency:"GBP"}]},{name:"Ranks",parent:{name:"Insanecraft"},packages:[{id:4,name:"🔵 Extreme",total_price:5,currency:"GBP"},{id:5,name:"🟣 Mental",total_price:10,currency:"GBP"},{id:6,name:"🟤 Loony",total_price:20,currency:"GBP"},{id:7,name:"🔴 Nutty",total_price:30,currency:"GBP"},{id:8,name:"🟠 Crazy",total_price:40,currency:"GBP"},{id:9,name:"🟡 Insane",total_price:50,currency:"GBP"}]}]});
    };
    const {fetchTebexProducts}=loadTs("lib/tebex.ts");
    const rl=await fetchTebexProducts("rlcraft");assert.deepEqual(rl.map(p=>p.id),["1","3"]);assert.equal(rl[0].currency,"GBP");assert.equal(rl[1].img,"/ranks/rlcraft/rank-dragonborn.webp");
    const ic=await fetchTebexProducts("insanecraft");assert.deepEqual(ic.map(p=>p.id),["2","4","5","6","7","8","9"]);
    const expectedRewards=[
      ["5 homes total","1 Insane Crate Key"],
      ["All Extreme permissions","6 homes total","1 PlayerVaultsX vault total","2 Insane Crate Keys"],
      ["All Extreme and Mental permissions","7 homes total","2 PlayerVaultsX vaults total","4 Insane Crate Keys"],
      ["All Extreme, Mental and Loony permissions","8 homes total","3 PlayerVaultsX vaults total","6 Insane Crate Keys"],
      ["All Extreme, Mental, Loony and Nutty permissions","11 homes total","4 PlayerVaultsX vaults total","8 Insane Crate Keys"],
      ["All Extreme, Mental, Loony, Nutty and Crazy permissions","13 homes total","5 PlayerVaultsX vaults total","10 Insane Crate Keys"],
    ];
    for (const [index,benefits] of expectedRewards.entries()) for (const benefit of benefits) assert.ok(ic[index+1].description.includes(benefit),`${ic[index+1].name} includes ${benefit}`);
    global.fetch=async()=>new Response("{}",{status:503});
    await assert.rejects(fetchTebexProducts("rlcraft"));
  }finally{global.fetch=oldFetch;if(oldToken===undefined)delete process.env.TEBEX_PUBLIC_TOKEN;else process.env.TEBEX_PUBLIC_TOKEN=oldToken;}
});

