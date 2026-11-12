# Folio — Worlds within

An immersive independent bookshop built from the supplied editorial hero, dimensional shelf, author page, and collector-club references. The site is deployed privately with an original fictional catalog, not live merchandise.

## Experience

- Seamless left-to-right dimensional book rail; hover and keyboard focus pause movement.
- Search by title, author, or genre; category, format, stock, and price sorting.
- Physical spine-to-cover shelf interaction.
- Eight separate interactive 3D pop-up books, each with its own model, color palette, three-step explanation, object selection, sliders, and scene controls.
- Orbit and zoom the models; expand the model view; open a dedicated experience at `/world/<book-id>`.
- Keyboard-operable controls, reduced-motion support, and interactive illustrated fallbacks when WebGL is unavailable.
- Opening book cover and animated reading-page turns; keyboard arrows and touch swipes.
- Original reading samples and author introduction spreads.
- Persistent browser cart with quantity limits, stock checks, and integer-cent delivery calculations.
- Local bookmarks plus authenticated account synchronization; free club membership.
- Scroll-triggered book physics with gravity, rotated-rectangle collision detection, dragging, and replay.
- Reduced-motion rendering and a global motion pause control.
- Owner studio at `/admin` for books, covers, authors, preview pages, categories, featured titles, stock, pricing, homepage copy, shipping, members, and orders.

## Stack and source

React 19, TypeScript, Vinext, CSS 3D transforms, Canvas 2D, lazily loaded Three.js, Cloudflare Workers, D1, and Stripe Checkout integration. Fonts and book cover images are served locally.

| Path | Purpose |
| --- | --- |
| `components/Storefront.tsx` | Storefront, filters, bag, club, and account shelf |
| `components/Reader.tsx` | Accessible modal book reader and author spread |
| `components/worlds/`, `lib/worlds/` | Unique pop-up models, controls, explanations, and illustrated fallbacks |
| `app/world/[id]/page.tsx` | Standalone route for each living edition |
| `components/BookObject.tsx` | Reusable dimensional cover/spine object |
| `components/FallingBooks.tsx` | Book-pile physics and interaction |
| `app/admin/page.tsx` | Owner catalog and order studio |
| `app/api/store/route.ts` | Validated authenticated data and checkout endpoints |
| `lib/catalog.ts` | Original demonstration catalog and sample texts |
| `lib/commerce.ts` | Cart validation, totals, webhook HMAC validation |
| `db/schema.ts`, `drizzle/` | Durable data model and versioned migrations |
| `public/covers/` | Eight optimized original WebP book covers |
| `public/fonts/` | Self-hosted typefaces |
| `tests/` | Interactive scene, commerce, inventory, and isolated API integration tests |

## Database

Books reference authors. Books hold original preview chapters, metadata, and collection flags; price and available stock have dedicated server columns. Orders reference account IDs and have immutable line-item snapshots. A database trigger checks and reserves inventory atomically when order items are created. Membership and shelf records are keyed by the Site-scoped authenticated user ID.

Schema migration: `drizzle/0000_famous_donald_blake.sql`. It contains the stock-reservation triggers as well as table definitions. Do not recreate tables during HTTP requests. The owner initializes the demonstration catalog from the studio; seed insertion is idempotent.

## Running locally

The installed project uses pnpm with a committed lockfile. Node 22.13+ is required by the framework; the API test harness uses Node's built-in SQLite (Node 24 is recommended for that harness).

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Run `pnpm build` to emit the local Worker configuration.
3. Apply the migration using the local D1 commands in the starter documentation (`.wrangler/state` is the persistence root).
4. Run `pnpm dev` for local development.

The Sites-managed workflow uses its project setup, build, preview, and publishing helpers. Source is tracked in the Site's Git repository. Do not publish environment files, `.wrangler`, `.sites-runtime`, or database contents.

## Payment activation — still required

The current deployment intentionally cannot collect money. All eight books are fictional demonstration titles. Stripe has not been connected or tested with a real account.

1. Supply a genuine catalog, licensed cover imagery and previews, real stock, business identity/contact, tax treatment, delivery timeframes, returns policy, and privacy retention information.
2. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as server-side secrets, initially using Stripe test mode. Never put secrets in the browser or hosting manifest.
3. Expose the signed webhook endpoint to Stripe at `/api/store?action=webhook`. The current owner-private access gate is not reachable by Stripe; a public commerce launch or supported separate ingress is needed before enabling payment processing.
4. Subscribe to `checkout.session.completed`, `checkout.session.expired`, and `checkout.session.async_payment_succeeded`. The current checkout is card-only. Paid state requires a valid signature, matching EUR amount, and Stripe's paid state. Fulfillment is idempotent and allowed only for verified paid orders.
5. Configure explicit admin user IDs as below before changing Site audience. The Site-scoped user ID comes from trusted platform authentication, not client input.
6. Mark real titles as non-demo and enable checkout in Store settings. Demo products are always rejected by the server, even if payments are enabled.
7. Exercise Stripe test-mode payment, cancel, expiration, retry, stock contention, webhook replay, shipping address, and order fulfillment flows before using live keys.

Checkout uses server prices and integer cents, not submitted prices. Sessions expire after 30 minutes. Reservations are restored only after verified expiration. An ambiguous provider/network failure marks the order `needs_review` and retains its reservation; inspect the Stripe request using its order-ID idempotency key before manually reconciling it. This avoids releasing inventory after a possibly successful payment. Taxes and refund automation are not implemented; refunds must be managed in Stripe with stock reconciled by the owner.

## Owner authentication

The initial Site audience is owner-private. `OWNER_PRIVATE_ADMIN=true` permits its authenticated owner to use the studio by relying on that platform boundary. **Before sharing or publishing publicly, set `OWNER_PRIVATE_ADMIN=false`, set `ADMIN_USER_IDS` to the comma-separated Site-scoped owner/admin IDs, and redeploy.** Do not use the private-owner shortcut on a public or shared audience. API mutations check authentication, ownership/role, input schemas, and same-origin requests. Webhooks use signed payload verification instead of session identity.

The browser cannot choose its authenticated user headers. The platform supplies them. Tests simulate these headers only in an isolated test database.

## Verification

See `docs/VERIFICATION.md` for the actual checks and limits. No live payment, real customer order, email, or external purchase has been made.

## Assets and content

All eight titles and authors are fictional. The sample writing was created for this project. The AI-generated cover collection is integrated as eight optimized WebP assets. No provided reference image or video is presented as original merchandise. Font licensing is included in `docs/FONT-LICENSE.txt`; visual direction and generation prompt details are in `docs/ART-DIRECTION.md`.

## Living editions

| Book | Interactive concept |
| --- | --- |
| The Art of Noticing | Move afternoon light through a room; select a cup, window, or plant; reveal details |
| Forms of Silence | Remove gallery objects and change spacing to explore negative space |
| A Field Guide to Wonder | Unfold a paper fern from seed to leaves; change the sunlight |
| The World in Between | Open three different doors and trace the paths of imagined choices |
| After the Last Train | Visit the platform, bakery, and river; play the train and bring up dawn |
| The Shape of Everyday | Separate a chair into structure, seat, and back; change its material colors |
| Wild Atlas | Follow river, woodland, and ridge paths with a miniature traveler; change season |
| Small Hours | Select different original poems; change the window light and candle |

These scenes interpret the eight original fictional sample texts. They do not claim to summarize unrelated published books. Newly added catalog titles retain their reading previews; a custom concept definition and model must be authored to give each additional title a bespoke living edition.

The 3D engine is loaded only when opening an interactive experience. It releases geometry, materials, textures, observers, event listeners, and the WebGL context when closed. Animation pauses when hidden and obeys reduced-motion preferences. Text explanations and HTML controls remain accessible outside the canvas.

Run `pnpm test:worlds` for configuration, model geometry, scene controls, frame-rate independence, reduced-motion clock, and fallback checks.
