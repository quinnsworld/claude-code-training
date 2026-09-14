# NWP-201: Issue virtual cards — implementation spec

## Goal
Enable ops to issue fictional virtual cards in the merchant console, inspect issued cards, and view spend against the limit without persistence or real network calls.

## Existing code to reuse
- `build-battle/merchant-console/src/data/store.ts` — global in-memory store pattern
- `build-battle/merchant-console/src/data/types.ts` — `Currency` and domain type conventions
- `build-battle/merchant-console/src/data/merchants.ts` — merchant options and lookup
- `build-battle/merchant-console/src/lib/money.ts` — parse and format integer minor units
- Existing `Table`, `Button`, and `Input` components for UI consistency

## Data model and invariants
Add `VirtualCard` and status types. Store only a generated reference and `last4`; never store a full PAN. Card fields include id, nickname, merchantId, limitMinorUnits, currency, status, createdAt, spendMinorUnits (initially zero), last4, and cardReference. Allowed transitions are active↔frozen and active/frozen→cancelled; cancelled is terminal.

## Server-side functions and routes
- Add a server-only Luhn generator using the `4242` test BIN and deterministic random digits, with tests covering the BIN and check digit.
- Add `POST /api/cards` to validate nickname, merchant, integer minor-unit limit (positive and <= 5,000,000), and USD/EUR/GBP currency. It creates a card, stores only safe fields, and returns the full generated number only in that response.
- Add `GET /api/cards` returning safe card records.
- Add `GET /api/cards/:id` returning one safe card record.
- Add `PATCH /api/cards/:id/status` validating the state machine and returning the safe card.
- Use consistent JSON `{ message }` errors and appropriate 4xx statuses.

## UI
- Add `/cards` with an accessible issue-card form, deliberate loading/error/empty states, and a table containing nickname, merchant, masked number, limit, status, and created date.
- Add a client issue form that posts to the route and displays the full number in an in-memory success panel exactly once; closing it clears the number.
- Add `/cards/:id` with safe record fields and a spend progress bar; use amber styling above 80%.
- Add freeze/unfreeze/cancel controls without a full page reload.
- Add Cards to the sidebar.

## Verification
Run `npm test`, `npm run build`, and manually exercise POST validation, card creation, safe list/detail responses, one-time reveal, and status transitions against the running app. Do not push or open a PR without explicit approval.
