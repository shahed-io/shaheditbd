# Persistent Cart + Multi-Select Checkout

বর্তমান cart শুধু `localStorage`-এ থাকে এবং payment success-এ পুরোটাই clear হয়ে যায়। নতুন behavior:

- Login করা user-এর cart Supabase-এ save হবে (device-এ device-এ sync, payment-এর পরেও থাকবে)।
- প্রতিটা item-এ checkbox থাকবে → user যেগুলো select করবে শুধু সেগুলোই checkout/pay হবে।
- Payment success হলে শুধু **paid items** cart থেকে remove হবে, বাকিগুলো DB-তে save থাকবে পরে কেনার জন্য।

## কী কী হবে

1. **নতুন table `user_cart_items`** (RLS-protected, user নিজের cart-ই manage করতে পারবে):
   - `product_id`, `name`, `category`, `price`, `original_price`, `image`, `variant`, `quantity`, `created_at`
   - Unique `(user_id, product_id, variant)` যাতে duplicate না হয়।

2. **`useCart` hook upgrade:**
   - Login হলে: localStorage cart → DB-তে merge upsert, তারপর DB থেকে load।
   - Logout/guest: আগের মতই localStorage।
   - নতুন state: `selectedIds: Set<string>`; helpers — `toggleSelected`, `selectAll`, `clearSelected`, `selectedItems`, `selectedSubtotal`, `selectedFinalTotal`।
   - নতুন `removeItems(ids[])` — purchase success-এ শুধু paid items মুছবে (localStorage + DB)।
   - `clearCart()` শুধু explicit "Clear all" button-এ ব্যবহার হবে।

3. **`CartDrawer` UI update:**
   - প্রতিটা item-এর বাঁয়ে checkbox; header-এ "Select all" checkbox।
   - Footer-এ Subtotal/Total **selected items**-এর হিসাবে দেখাবে (badge: "3 of 5 selected")।
   - Button: কিছু select থাকলে "Pay Selected (৳X)", না থাকলে disabled অথবা "Select items to checkout"।

4. **`Checkout.tsx` update:**
   - URL/state থেকে selected ids আসবে; render-এ শুধু সেগুলো দেখাবে।
   - Order place হওয়ার পর `clearCart()`-এর বদলে `removeItems(paidIds)` কল হবে — বাকি items cart-এ থাকবে।
   - Abandoned-cart save logic একই থাকবে।

5. **Realtime sync (optional, light):** একই account দুই tab-এ খুললে cart sync থাকবে (`postgres_changes` subscription on `user_cart_items`)।

## Technical details

```text
user_cart_items
├── id (uuid, PK)
├── user_id (uuid, NOT NULL)
├── product_id (text)         ← keep text because legacy cart uses number|string
├── name, category, image, variant (text)
├── price, original_price (numeric)
├── quantity (int, default 1)
└── created_at / updated_at

RLS:
- SELECT/INSERT/UPDATE/DELETE: auth.uid() = user_id
UNIQUE INDEX (user_id, product_id, coalesce(variant,''))
```

`useCart` flow:
```
mount → load localStorage
if user logs in → upsert local items to DB → fetch DB items → setItems(dbItems) → clear local
if user logs out → keep last items in localStorage only
addToCart / updateQty / remove → optimistic local update + DB write (debounced for qty)
purchase success → removeItems(paidIds) → DB delete those rows
```

কোনো existing feature (coupon, wishlist, abandoned cart, buyNow) ভাঙবে না — শুধু cart-items এর storage এবং checkout selection যোগ হবে।
