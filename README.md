# Northline

Northline is an e-commerce catalog frontend for considered everyday goods. Shoppers can browse a full product catalog, search and filter results, switch between grid and list layouts, open product details, and run a lightweight cart and checkout flow.

The catalog is the primary surface. Product details, cart, and checkout exist as routes so the project structure matches the broader store concept. Wireframes for those pages are maintained separately in Figma.

# Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Storybook 8
- MSW (Mock Service Worker) for Storybook, plus Next.js route handlers that read `src/data/products.json`

# Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app is served on port 8080. Open the preview to browse the catalog.

# Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm run storybook` | Start Storybook |
| `npm run build-storybook` | Build a static Storybook site |

# Project Structure

```text
src/
├── app/                 App Router pages, layout, and API routes
├── components/
│   ├── ui/              Reusable primitives (Button, Input, Skeleton, …)
│   ├── catalog/         Catalog, toolbar, product card
│   └── layout/          Header, footer, theme
├── data/products.json   Mock catalog dataset
├── lib/                 Data layer, cart store, formatting helpers
├── mocks/               MSW handlers used by Storybook
└── types/               Shared TypeScript types
```

Imports use the `@/*` path alias, for example `import { Button } from "@/components/ui/Button"`.

# Mock Data

`src/data/products.json` contains 58 realistic products across Electronics, Clothing, Shoes, Accessories, Home, Kitchen, Sports, and Beauty. Each product includes `id`, `title`, `description`, `price`, `category`, `image`, `variants`, and `stock`.

The Catalog never hardcodes product objects. Data flows:

```text
Catalog → src/lib/api.ts → /api/products → src/lib/catalog.ts → products.json
```

Storybook uses the same catalog module through MSW handlers in `src/mocks/`.

# Catalog Features

- **Search** — case-insensitive partial match against title, description, and category. Empty queries show the full (filtered) set. No results show an empty state.
- **Category filtering** — categories are derived from the dataset. “All categories” plus each unique category. Search and category compose together.
- **Grid / list toggle** — one `ProductCard` component with a `layout` prop. The active view is indicated with `aria-pressed` and persists in `localStorage`.
- **Skeleton loading** — while `/api/products` is in flight, skeleton cards mimic the image, title, category, and price of the finished card. Animation respects `prefers-reduced-motion`.

# Accessibility

- Semantic landmarks, headings, and lists
- Real `<button>` and labelled `<input>` elements
- Visible focus rings on interactive controls
- Keyboard-usable search, category radios, and view toggle
- Meaningful `alt` text on product images
- Accessible names on icon-only buttons (theme, cart, quantity)
- Stock state is communicated with text, not color alone
- Skip-to-content link in the header

# Dark Mode

Light and dark themes are driven by a `.dark` class on `<html>`. A header toggle switches modes and stores the preference. Tokens in `src/app/globals.css` cover page chrome, cards, search, filters, buttons, inputs, skeletons, and empty states. Storybook stories can be viewed in both themes via the theme toolbar.

# Wireframes

Catalog, product details, cart, and checkout wireframes are maintained separately in Figma. This repository implements the catalog in full and provides working routes for the remaining core pages without a production payment integration.
