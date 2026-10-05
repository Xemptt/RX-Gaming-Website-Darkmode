const {test}=require("node:test");
const assert=require("node:assert/strict");
const {loadTs}=require("./load-ts.cjs");
test("status only queries configured addresses, preserves ports and caches simultaneous requests",async()=>{
  const oldFetch=global.fetch;let calls=0;
  try{
    global.fetch=async url=>{calls++;assert.equal(url,"https://api.mcsrvstat.us/3/mc.biccys.uk%3A25567");return Response.json({online:true,players:{online:2,max:20}});};
    const {GET}=loadTs("app/api/server-status/route.ts");
    assert.equal((await GET(new Request("http://localhost/api/server-status?server=evil.test"))).status,400);assert.equal(calls,0);
    const responses=await Promise.all([1,2].map(()=>GET(new Request("http://localhost/api/server-status?server=insanecraft"))));
    assert.equal(calls,1);assert.deepEqual(await responses[0].json(),{online:true,playersOnline:2,maxPlayers:20});
  }finally{global.fetch=oldFetch;}
});
test("status distinguishes offline realms from upstream failures and malformed counts",async()=>{
  const oldFetch=global.fetch;
  try{
    for(const [response,expected] of [[Response.json({online:false}),{online:false}],[new Response("",{status:503}),{online:null}],[Response.json({online:true,players:{online:-1,max:20}}),{online:null}]]){
      global.fetch=async()=>response;
      const {GET}=loadTs("app/api/server-status/route.ts");
      assert.deepEqual(await (await GET(new Request("http://localhost/api/server-status?server=rlcraft"))).json(),expected);
    }
  }finally{global.fetch=oldFetch;}
});
