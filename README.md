# Payment Checkout — Frontend

Single Page Application (SPA) that implements the 5-step checkout flow for a
single product paid by credit card: product page → card & delivery form →
payment summary → transaction result → back to the product page with stock
updated.

Built with **Vue 3** + **Vuex** (Flux architecture) + **Vue Router**, mobile-first,
consuming the [backend API](../backend) for products, transactions and
payment confirmation.

## Table of Contents

- [Checkout Flow](#checkout-flow)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [State Management & Resilience](#state-management--resilience)
- [Testing & Coverage](#testing--coverage)
- [Responsive Design](#responsive-design)
- [Security](#security)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Checkout Flow

```
1. ProductView   →   2. PaymentView          →   3. SummaryView   →   4. ResultView   →   5. ProductView
   (stock/price)      (card + delivery form)      (totals + pay)       (approved/         (stock updated)
                                                                         declined)
```

- **ProductView** (`/product/:productId`): shows product name, description,
  price and remaining stock, with a "Pay with credit card" button.
- **PaymentView** (`/checkout/:productId/payment`): modal-style form for card
  data (number, expiry, CVC, cardholder — with Luhn validation and Visa /
  Mastercard brand detection) and delivery data (customer info + shipping
  address).
- **SummaryView** (`/checkout/:productId/summary`): itemized total (product +
  base fee + delivery fee) in a backdrop-style confirmation screen with the
  final "Confirm and pay" action.
- **ResultView** (`/checkout/:productId/result`): shows the transaction
  outcome (`APPROVED` / `DECLINED` / `ERROR`) returned by the backend.
- Back to **ProductView**: stock reflects the just-completed purchase.

## Tech Stack

- **Framework:** Vue 3 (`<script>` Options API)
- **State management:** Vuex 4 (Flux architecture — `state` / `getters` /
  `mutations` / `actions` per module)
- **Routing:** Vue Router 4
- **HTTP client:** Axios
- **Styling:** SCSS with shared `_variables.scss` / `_mixins.scss`, flexbox/grid
  layouts, mobile-first breakpoints
- **Testing:** Vitest + `@vue/test-utils` (Vite-native equivalent of Jest,
  same `describe`/`it`/`expect` API)
- **Build tool:** Vite

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm
- The [backend API](../backend) running locally (or the deployed AWS URL)

### Installation

```bash
npm install
```

## Environment Variables

```bash
cp .env.local.example .env
```

| Variable        | Description                          | Example                                                        |
|-----------------|---------------------------------------|------------------------------------------------------------------|
| `VITE_API_URL`  | Base URL of the backend API            | `http://localhost:3000` (local) or the deployed API Gateway URL |

## Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default. Make sure
`VITE_API_URL` points at a running instance of the backend (local or AWS) and
that the product you land on (`/product/prod-002` by default) exists in the
seeded database.

Build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## State Management & Resilience

All checkout progress (`product`, `customer`, `delivery`, `transaction`) is
kept in a single Vuex module and mirrored to `localStorage` on every mutation,
so a page refresh mid-checkout doesn't lose the customer's progress.

**Card data is the one exception, by design:** it's kept only in memory
(Vuex state, never written to `localStorage`) and is lost on refresh — the
customer simply re-enters it. This avoids ever persisting sensitive card data
on the client.

## Testing & Coverage

```bash
npm run test        # unit tests (Vitest)
npm run test:cov    # unit tests with coverage report
```

Coverage target of **≥ 80%** is met across services, the Vuex store
(`state` / `mutations` / `actions`) and all 4 views (`ProductView`,
`PaymentView`, `SummaryView`, `ResultView`).

What's covered:
- `card-validators.js` — Luhn checksum, Visa/Mastercard brand detection,
  expiry validation, card number formatting
- Vuex module — state hydration from `localStorage`, all mutations, all
  actions (including the approved/declined/error branches of `confirmPayment`)
- All 4 views — rendering, form validation, navigation guards, and the
  approved/declined/error result states

> Run `npm run test:cov` and check the terminal / `coverage/index.html`
> report locally before submitting — coverage numbers should be confirmed
> against your own environment.

## Responsive Design

Mobile-first layout verified with no overflow or contrast issues at the
reference viewport (iPhone SE, 375×667) and scales up via flexbox/grid for
larger screens.

## Security

- `autocomplete="off"` on all card fields, so the browser never offers to
  save the test card.
- Card data is never written to `localStorage` or any persistent client-side
  storage (see [State Management & Resilience](#state-management--resilience)).
- Served over HTTPS in production, behind CloudFront with AWS's
  `SECURITY_HEADERS` managed response headers policy (HSTS,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.) — see
  the [infrastructure repo](../infraestructure).

## Deployment

Static build (`dist/`) deployed to a private S3 bucket, served through
CloudFront (HTTPS only, SPA history-mode fallback to `index.html`). Defined
as code in the [infrastructure repo](../infraestructure) (`FrontendStack`).

```bash
npm run build
cd ../infraestructure
npx cdk deploy FrontendStack-dev
```

**Live URL:** `<add-your-cloudfront-url-here>`

## Project Structure

```
src/
├── views/                    # ProductView, PaymentView, SummaryView, ResultView
├── store/
│   └── modules/checkout/     # state, getters, mutations, actions (Flux)
├── services/                 # api.js (Axios client), checkout.service.js, card-validators.js
├── router/                   # Vue Router routes for the 5-step flow
└── assets/styles/             # SCSS variables, mixins and per-view stylesheets
```

## Related Repositories

- **Backend (NestJS + Hexagonal + ROP API):** https://github.com/johancamilo/checkout-backend
- **Infrastructure (AWS CDK):** https://github.com/johancamilo/checkout-infraestructure