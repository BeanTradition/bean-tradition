# Pre-event testing checklist

Run this checklist end to end a day or two before the event, on the real production setup, with real approved templates and `WHATSAPP_SEND_ENABLED=true`. Use test phone numbers you control. Tick each item as it passes.

Reset order numbering only if needed, before the event starts, by setting `Counters!A1` back to `0` (this only applies to the counter-cell path).

## Environment and access

- [ ] `GET https://api.beantradition.in/api/health` returns `status: ok`, `environment: production`.
- [ ] Health shows `google_sheets: configured` and `whatsapp_send_enabled: true`.
- [ ] `https://api.beantradition.in/docs` returns 404 (docs disabled in production).
- [ ] Staff can log in at `https://beantradition.in` with the event password.
- [ ] Session persists across a page refresh (HttpOnly cookie working over HTTPS).
- [ ] The spreadsheet is shared with the service account as Editor.

## Load test: 100 simulated orders

- [ ] Run a script or repeated submissions to create 100 orders against the API.
- [ ] All 100 orders appear as rows in the Orders tab.
- [ ] Order numbers are sequential with no gaps and no duplicates (BT0001 upward).
- [ ] The backend stays responsive throughout (no timeouts, no 500s).
- [ ] Confirmation message status columns fill in (SENT, or a categorised failure with a retry).
- [ ] The active board and tracking pages still load quickly under this volume.

## Multiple devices

- [ ] Two or more order-entry phones can each log in and submit orders at the same time.
- [ ] Two or more devices open the `/orders` board and all see the same orders update.
- [ ] Multiple customer phones open different tracking links at the same time and each sees only their own order details.

## Concurrency and numbering

- [ ] Two staff submit orders at the exact same moment; both get distinct sequential order numbers.
- [ ] Rapid repeated submissions do not produce duplicate order numbers.
- [ ] If using the Apps Script counter web app, numbering stays correct across concurrent submits.
- [ ] Each order row has a unique Order ID, Order Number, and Tracking Token.

## Data integrity in the sheet

- [ ] Items JSON, Items Display, and Quantity Total match what was ordered.
- [ ] Customer name, notes, and payment method are written correctly.
- [ ] A name or note starting with `=`, `+`, `-`, or `@` is stored as text (formula-injection guard) and displays correctly.
- [ ] Mobile numbers are normalised to E.164 (for example +91...).
- [ ] Timestamps are ISO-8601 UTC strings.

## Confirmation WhatsApp

- [ ] A new order triggers a confirmation WhatsApp to the customer.
- [ ] The message body shows the correct name and order number.
- [ ] The TRACK ORDER button opens the correct tracking page for that order.
- [ ] Confirmation Message Status updates to SENT, then DELIVERED or READ via the webhook.

## Tracking page

- [ ] The tracking url loads and shows the customer's own order number, status, and items.
- [ ] The queue shows other orders as order numbers only, with no other customer's name, mobile, or items.
- [ ] The page updates on the poll interval as the queue changes.
- [ ] Reopening the same tracking url later still works and shows the current status.
- [ ] An invalid or tampered token returns a clean "invalid tracking link" result, not the app crashing.

## Status flow: PREPARING to READY

- [ ] Moving an order to READY on the board succeeds.
- [ ] The order's Ready At timestamp is set.
- [ ] The customer receives the ready WhatsApp message.
- [ ] The ready message shows the correct order number and a working TRACK ORDER button.
- [ ] Ready Message Status updates to SENT, then DELIVERED or READ.
- [ ] Moving an already-READY order to READY again does not send a duplicate ready message.

## Delivered cleanup

- [ ] Marking an order DELIVERED removes it from the active board.
- [ ] The Delivered At timestamp is set.
- [ ] The order appears under recent delivered orders.

## Sheet-driven fallback

- [ ] Changing the Status cell in the Orders tab to READY triggers the Apps Script onEdit.
- [ ] The backend receives `POST /api/internal/sheet-status-change` and updates the order.
- [ ] The customer still receives the ready WhatsApp from a sheet-driven change.
- [ ] A sheet change with the wrong or missing secret is rejected (401).

## Network resilience

- [ ] With slow venue internet, order creation still completes and the row is written before success is claimed.
- [ ] An interrupted request that is retried by the client does not create a duplicate order (idempotency key).
- [ ] Submitting the same order twice (double tap or retry) results in one order, not two.
- [ ] A transient WhatsApp failure is retried automatically with backoff.

## Failure handling

- [ ] A forced WhatsApp failure (for example a bad number) shows staff a clear message and marks the message FAILED.
- [ ] The retry confirmation action re-sends a failed confirmation.
- [ ] The resend ready action re-sends the ready message.
- [ ] Last Messaging Error is recorded on failure and cleared on a later success.

## Customer experience extras

- [ ] Browser notifications on the tracking page work if enabled (permission prompt, then an update notification).
- [ ] The tracking page is readable and usable on a small phone screen.
- [ ] The order-entry and board screens are usable on staff phones.

## Final go or no-go

- [ ] All above items pass.
- [ ] `WHATSAPP_SEND_ENABLED=true` confirmed on the production backend.
- [ ] Counter reset to a clean starting point if required.
- [ ] The event-day runbook is printed or open on a device. See [event-day-runbook.md](event-day-runbook.md).
