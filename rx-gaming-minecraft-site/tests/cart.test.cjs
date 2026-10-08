const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const { sanitizeCart } = loadTs("lib/cart-validation.ts");
const { validateCheckoutItems, trustedTebexUrl } = loadTs("lib/validation.ts");
const product = { id: "123", name: "Example rank", price: 5, currency: "GBP", mode: "all", category: "ranks", img: "/1.png", isPromo: false, color: "#000" };
test("corrupt and stale local carts cannot become purchasable items", () => {
  for (const input of [null, {}, "oops", [null], [{ product: null, quantity: 1 }], [{ product: {...product, id: "demo-pack"}, quantity: 1 }], [{ product: {...product, price: -1}, quantity: 1 }], [{ product, quantity: Infinity }]]) assert.deepEqual(sanitizeCart(input), []);
  const clean = sanitizeCart([{ product, quantity: 2 }, { product, quantity: 3 }]);
  assert.equal(clean.length, 1); assert.equal(clean[0].quantity, 2);
});
test("single-quantity packages remain single after hydration", () => {
  assert.equal(sanitizeCart([{ product: { ...product, disableQuantity: true }, quantity: 20 }])[0].quantity, 1);
});
test("checkout rejects duplicate IDs, demo IDs and invalid quantities", () => {
  for (const items of [[], [{packageId:"123",quantity:-1}], [{packageId:"123",quantity:1.5}], [{packageId:"123",quantity:100}], [{packageId:"demo",quantity:1}], [{packageId:"123",quantity:1},{packageId:"123",quantity:1}]]) assert.equal(validateCheckoutItems(items), null);
  assert.deepEqual(validateCheckoutItems([{packageId:"123",quantity:2,price:0}]), [{packageId:"123",quantity:2}]);
});
test("checkout redirects reject lookalike hosts, credentials and insecure protocols", () => {
  for (const url of ["https://tebex.io.evil.test/", "https://eviltebex.io/", "http://pay.tebex.io/a", "javascript:alert(1)", "https://user:pass@pay.tebex.io/a", "https://pay.tebex.io:8000/a"]) assert.equal(trustedTebexUrl(url), null);
  assert.equal(trustedTebexUrl("https://pay.tebex.io/basket"), "https://pay.tebex.io/basket");
});
test("cart actions enforce quantity limits and currency consistency", () => {
  const { useCartStore } = loadTs("store/cart.ts");
  const store = useCartStore.getState();
  assert.equal(store.addItem(product), null);
  store.updateQuantity("123", 99); store.addItem(product);
  assert.equal(useCartStore.getState().items[0].quantity, 99);
  store.updateQuantity("123", NaN);
  assert.equal(useCartStore.getState().items[0].quantity, 99);
  assert.match(store.addItem({...product,id:"124",currency:"USD"}), /currency/);
  store.updateQuantity("123",0); assert.equal(useCartStore.getState().items.length,0);
});

test("cart refresh uses current prices and quantity rules without discarding unavailable items", () => {
  const { useCartStore } = loadTs("store/cart.ts");
  const store = useCartStore.getState();
  store.addItem(product);
  store.updateQuantity(product.id, 3);
  store.addItem({ ...product, id: "124" });
  const unavailable = store.refreshProducts([{ ...product, price: 4, disableQuantity: true, img: "/new-image.png" }]);
  assert.deepEqual(unavailable, ["124"]);
  const items = useCartStore.getState().items;
  assert.equal(items.length, 2);
  assert.equal(items[0].product.price, 4);
  assert.equal(items[0].quantity, 1);
  assert.equal(items[0].product.disableQuantity, true);
  assert.equal(items[0].product.img, product.img, "preserves realm-specific artwork");
  assert.equal(items[1].product.price, 5, "keeps unavailable item until customer removes it");
});

test("adding an already capped rank refreshes its price without increasing quantity", () => {
  const { useCartStore } = loadTs("store/cart.ts");
  const store = useCartStore.getState();
  store.addItem({ ...product, disableQuantity: true });
  assert.match(store.addItem({ ...product, disableQuantity: true, price: 4 }), /maximum quantity/);
  assert.equal(useCartStore.getState().items[0].product.price, 4);
  assert.equal(useCartStore.getState().items[0].quantity, 1);
});

