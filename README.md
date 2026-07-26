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
- **Testing:** Jest + `@vue/vue3-jest` + `@vue/test-utils`
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
npm run test        # unit tests (Jest)
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

> Run `npm run test:cov` and check the terminal / `coverage/lcov-report/index.html`
> report locally before submitting — coverage numbers should be confirmed
> against your own environment.

------------------------|---------|----------|---------|---------|---------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s   
------------------------|---------|----------|---------|---------|---------------------
All files               |   98.18 |    96.05 |   97.64 |   98.11 |                     
 components             |     100 |    86.36 |     100 |     100 |                     
  CardPreview.vue       |     100 |    86.36 |     100 |     100 | 110                 
 services               |     100 |      100 |     100 |     100 |                     
  card-validators.js    |     100 |      100 |     100 |     100 |                     
  checkout.service.js   |     100 |      100 |     100 |     100 |                     
 store/modules/checkout |     100 |      100 |     100 |     100 |                     
  actions.js            |     100 |      100 |     100 |     100 |                     
  getters.js            |     100 |      100 |     100 |     100 |                     
  mutations.js          |     100 |      100 |     100 |     100 |                     
  state.js              |     100 |      100 |     100 |     100 |                     
 utils                  |     100 |      100 |     100 |     100 |                     
  format.js             |     100 |      100 |     100 |     100 |                     
 views                  |   96.85 |    96.12 |   96.29 |    96.8 |                     
  PaymentView.vue       |   96.12 |    96.87 |   97.82 |   96.03 | 115,120,125,136,339 
  ProductView.vue       |     100 |      100 |     100 |     100 |                     
  ResultView.vue        |   94.44 |    85.71 |   66.66 |   94.44 | 111                 
  SummaryView.vue       |     100 |    94.11 |     100 |     100 | 148,152             
------------------------|---------|----------|---------|---------|---------------------

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

**Live URL:** https://d30cgmsiz5yhgs.cloudfront.net

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