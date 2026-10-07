const {test}=require("node:test");
const assert=require("node:assert/strict");
const {loadTs}=require("./load-ts.cjs");

test("sale flags follow Tebex discounts while retaining the returned price",async()=>{
  const originalFetch=global.fetch;
  const originalToken=process.env.TEBEX_PUBLIC_TOKEN;
  try {
    process.env.TEBEX_PUBLIC_TOKEN="test-token";
    let discount=2;
    let price=9.6;
    global.fetch=async()=>Response.json({data:[{name:"Insanecraft",packages:[
      {id:123,name:"Extreme",base_price:10,sales_tax:1.6,total_price:price,discount,currency:"GBP"},
      {id:124,name:"Mental",total_price:20,discount:"10",currency:"GBP"},
    ]}]});
    const {fetchCatalog}=loadTs("lib/tebex.ts");
    let products=await fetchCatalog();
    assert.equal(products[0].isPromo,true);
    assert.equal(products[0].price,9.6,"the website must not subtract a sale twice");
    assert.equal(products[1].isPromo,false,"malformed discounts must not advertise a sale");
    discount=0;price=12;
    products=await fetchCatalog();
    assert.equal(products[0].isPromo,false);
    assert.equal(products[0].price,12);
  } finally {
    global.fetch=originalFetch;
    if(originalToken===undefined)delete process.env.TEBEX_PUBLIC_TOKEN;else process.env.TEBEX_PUBLIC_TOKEN=originalToken;
  }
});

test("sale announcement reflects current catalog and fails without stale offers",async()=>{
  let products=[{isPromo:true},{isPromo:false}];
  const {GET}=loadTs("app/api/tebex/promotions/route.ts",{
    "next/server":{NextResponse:Response},
    "@/lib/tebex":{fetchCatalog:async()=>{if(products===null)throw new Error("Unavailable");return products;}},
  });
  const sale=await GET();
  assert.equal(sale.status,200);
  assert.deepEqual(await sale.json(),{onSale:true});
  assert.match(sale.headers.get("Cache-Control"),/s-maxage=60/);
  products=[{isPromo:false}];
  assert.deepEqual(await (await GET()).json(),{onSale:false});
  products=[];
  assert.deepEqual(await (await GET()).json(),{onSale:false});
  products=null;
  const error=await GET();
  assert.equal(error.status,503);
  assert.equal(error.headers.get("Cache-Control"),"no-store");
});
