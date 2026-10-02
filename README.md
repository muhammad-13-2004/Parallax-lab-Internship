# Northline

Northline is an e-commerce storefront for considered everyday goods. Shoppers can browse and filter the catalog, view product details, manage a persistent cart, and complete a four-step demonstration checkout. Checkout uses test data only; no payment is processed.

# Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- XState for cart and checkout state
- Zod for checkout validation
- Sonner for toast feedback
- Storybook 8
- MSW (Mock Service Worker) for Storybook, plus Next.js route handlers backed by `src/data/products.json`

# Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app is served on port 8080. Open the preview to browse the catalog.

# Commands

| Command                   | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Start the Next.js development server |
| `npm run build`           | Create a production build            |
| `npm run start`           | Serve the production build           |
| `npm run lint`            | Run ESLint                           |
| `npm run typecheck`       | Run the TypeScript compiler          |
| `npm test`                | Run script and TypeScript unit tests |
| `npm run test:ts`         | Run TypeScript unit tests            |
| `npm run storybook`       | Start Storybook                      |
| `npm run build-storybook` | Build a static Storybook site        |

# Project Structure

```text
src/
├── app/                 App Router pages, layout, and API routes
├── components/
│   ├── ui/              Reusable primitives (Button, Input, Skeleton, …)
│   ├── catalog/         Catalog, product details, quantity and view controls
│   ├── checkout/        Multi-step checkout interface
│   └── layout/          Header, footer, theme
├── data/products.json   Mock catalog dataset
├── lib/                 Cart and checkout machines, validation, data helpers
├── mocks/               MSW handlers used by Storybook
└── types/               Shared TypeScript types
```

Imports use the `@/*` path alias, for example `import { Button } from "@/components/ui/Button"`.

# Mock Data

`src/data/products.json` contains 58 realistic products across Electronics, Clothing, Shoes, Accessories, Home, Kitchen, Sports, and Beauty. Each product includes `id`, `title`, `description`, `price`, `category`, `image`, `variants`, and `stock`.

The catalog never hardcodes product objects. Data flows:

```text
Catalog → src/lib/api.ts → /api/products → src/lib/catalog.ts → products.json
```

Storybook uses the same catalog module through MSW handlers in `src/mocks/`.

# Store Features

- **Search** — case-insensitive partial match against title, description, and category. Empty queries show the full (filtered) set. No results show an empty state.
- **Category filtering** — categories are derived from the dataset. “All categories” plus each unique category. Search and category compose together.
- **Grid / list toggle** — one `ProductCard` component with a `layout` prop. The active view is indicated with `aria-pressed` and persists in `localStorage`.
- **Hydration-safe preference** — the catalog renders a deterministic Grid default on the server and restores the saved view in a client effect.
- **Skeleton loading** — while `/api/products` is in flight, skeleton cards mimic the image, title, category, and price of the finished card. Animation respects `prefers-reduced-motion`.
- **Product details** — product pages include images, variants, stock information, related products, and quantity-limited add-to-cart controls.
- **Cart** — XState owns cart contents and quantity limits; items persist in `localStorage`. Quantity updates and removals render optimistically, call `/api/cart`, and roll back on rejected requests. Pending actions for an item are guarded against rapid duplicate updates.
- **Checkout** — an XState machine governs Cart, Shipping, Payment, and Confirmation. Progression requires valid cart, shipping, and payment data. The demo validates card format, checksum, expiry, and security code, then retains only the cardholder name and last four digits. No payment is processed.
- **Feedback** — Sonner toasts report cart updates, rollback failures, validation issues, and checkout progress.

# Accessibility

- Semantic landmarks, headings, and lists
- Real `<button>` and labelled `<input>` elements
- Visible focus rings on interactive controls
- Keyboard-usable search, category radios, and view toggle
- Checkout progress is announced with a labelled navigation landmark and current step
- Checkout errors are associated with their inputs; form controls support keyboard navigation
- Meaningful `alt` text on product images
- Accessible names on icon-only buttons (theme, cart, quantity)
- Stock state is communicated with text, not color alone
- Skip-to-content link in the header

# Dark Mode

Light and dark themes are driven by a `.dark` class on `<html>`. A header toggle switches modes and stores the preference. Tokens in `src/app/globals.css` cover page chrome, cards, search, filters, buttons, inputs, skeletons, and empty states. Storybook stories can be viewed in both themes via the theme toolbar.

# Checkout Safety

The checkout is for demonstration only. Do not enter real payment details; no card data is sent to a payment processor or stored in browser persistence. Successful validation keeps only the cardholder name and last four digits in the in-memory checkout state.
