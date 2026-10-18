# Implementation progress

## Phase 1: real-time inventory

### Completed
- Audited the existing storefront, product data flow, cart/checkout orchestration, and test setup.
- Confirmed the app is a Next.js storefront with static product data served from `src/data/products.json`, cart machine state in `src/lib/cart-machine.ts`, and checkout validation in `src/lib/checkout-validation.ts`.
- Added a server-backed inventory source of truth with a dedicated WebSocket service and a file-backed snapshot model so stock changes can be shared across tabs without a forced page refresh.
- Added automatic reconnection, backoff, and explicit connected/reconnecting/offline status handling for the inventory client.
- Added checkout-side revalidation so order confirmation fails when current stock no longer covers the cart.
- Added automated tests for inventory sync, malformed messages, reconnect behavior, and checkout revalidation failures.

### Completed for the next milestone
- Added an interactive product media viewer to the product detail page with thumbnail switching, keyboard navigation, previous/next controls, and zoom on demand.
- Implemented a hover-driven lens magnifier plus a click-to-toggle zoom state so the gallery supports a more product-detail-oriented inspection flow without changing the cart or checkout behavior.

### Remaining
- The inventory state is intentionally file-backed for the local dev environment and resets when the inventory server process restarts; this is documented and acceptable for the assignment scope.

### Files changed
- `scripts/inventory-server.mjs`
- `src/lib/inventory-store.ts`
- `src/lib/inventory-client.ts`
- `src/app/api/inventory/route.ts`
- `src/app/api/cart/route.ts`
- `src/components/catalog/AddToCart.tsx`
- `src/components/catalog/Catalog.tsx`
- `src/components/catalog/ProductCard.tsx`
- `src/app/products/[id]/page.tsx`
- `src/components/checkout/CheckoutFlow.tsx`
- `startup.sh`
- `scripts/inventory-server.test.mjs`

### Tests run
- `npm test` — passed
- `npm run typecheck` — passed

### Known issues and limitations
- The live inventory service is local-only and persists as a file-backed snapshot in the workspace.
- The app does not yet include a dedicated admin surface for inventory management outside the server script and API route.
- The WebSocket server is intentionally lightweight and is started separately from the Next.js dev server in the local workspace configuration.

### Decisions affecting later phases
- The app continues to use the existing product JSON as the seeded catalog model while the live stock snapshot is kept authoritative in a dedicated inventory service.
- Phase 2 will build on the same product detail page and media gallery with a live-stock-aware UI, rather than replacing the catalog or cart architecture.
