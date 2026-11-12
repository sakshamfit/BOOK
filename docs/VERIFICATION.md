# Verification — 29 October 2026

The desktop/mobile browser results below apply to the original storefront and reading-page version. The new 3D living-edition update has the separate verification scope at the end.

Story: A reader discovers a title, opens the book, turns sample pages, meets its author, saves it or adds it to a persistent bag; an authenticated owner manages durable catalog records; sale-ready products can enter a server-calculated, inventory-reserving Stripe Checkout flow after credentials are connected.

| Boundary | Result | Evidence |
| --- | --- | --- |
| Production compilation | Pass | Vinext built client, RSC, SSR, API, and Worker output successfully |
| TypeScript | Pass | `tsc --noEmit` |
| Cart and shipping | Pass | Four Node test cases cover invalid/duplicate quantities, cents-only totals, delivery threshold, valid/invalid/replayed webhook signatures |
| Inventory | Pass | SQLite tests cover reservation, oversell rejection, multi-line rollback, and idempotent expiration release |
| API integration | Pass in isolation | Real route handlers with a fresh SQLite/D1 adapter and mocked Stripe: owner authorization, CSRF origin rejection, catalog and author writes, member/shelf persistence, account isolation, missing-payment gate, server price authority, checkout idempotency, verified payment, and owner-only fulfillment |
| Desktop storefront | Pass in Chromium | Hero, art assets, navigation, author search, book opening, page turning, author spread, bookmarks, cart quantities and totals inspected |
| Mobile layout | Pass at 390 px viewport | Hero and open reader inspected through a same-origin responsive iframe; body width and scroll width both 390 px |
| Asset loading / overflow | Pass | Browser DOM inspection reported zero broken images and no desktop horizontal overflow |
| Falling books | Pass visually | Triggered on scroll, staggered falling covers and the collision pile inspected |
| Browser errors | No app errors observed | Captured warnings/errors were browser-extension metadata errors, not storefront JavaScript exceptions |
| Actual payment provider | Not tested | No Stripe credentials supplied; no live or test-mode external charge attempted |
| Deployed owner mutations | Not exercised before handoff | Owner authentication is deployment-provided; isolated route tests cover authorization and persistence |
| Safari / Firefox / physical mobile | Not tested | This environment supplied Chromium only |

The preview's HTTP listener is on a managed browser surface and is not directly reachable from the execution container. The storefront rendered and fetched catalog data through that browser surface; protected API write paths were exercised with the isolated test harness instead. These results do not claim a live Stripe end-to-end verification.

The source tests remain in `tests/`. Do not run the fake runtime adapter in production. The generated test bundle lives in ignored `.sites-runtime`.

## Living editions update

- All eight catalog titles map to distinct concept configurations with three valid guided steps and control presets.
- GPU-independent model checks construct all eight actual Three.js scenes, exercise selection and controls, and verify finite geometry transforms.
- The one-object gallery retains the selected form. Train and walker movement are frame-rate independent at 30 and 120 update steps; a frozen reduced-motion clock produces no travel.
- All eight illustrated fallback components render distinct, accessible SVG output without invalid numeric values.
- TypeScript and the production Worker/client build pass for the updated reader, standalone routes, controls, and engine.
- The managed preview daemon remains available at its declared URL. The browser-control service timed out on documentation recovery and session reset. No alternative browser driver was used. Consequently the update's GPU rendering, actual opening/camera motion, touch interaction, and responsive layout are **not browser-verified**. The earlier storefront checks should not be read as verification of these new features.
- Native deployment status is used to verify publication. No actual Stripe provider flow was added or exercised.
