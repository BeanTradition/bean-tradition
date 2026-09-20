# Event-day runbook

This is the operating guide for running Bean Tradition ordering during the event, plus the failure and recovery steps. Keep it open on a device at the counter.

## Before doors open

1. Confirm `GET https://api.beantradition.in/api/health` returns `status: ok`, `google_sheets: configured`, `whatsapp_send_enabled: true`.
2. Confirm both message templates are Approved in WhatsApp Manager.
3. Log in on each order-entry phone at `https://beantradition.in`.
4. Open the `/orders` board on the counter device.
5. Open the spreadsheet on a device as the fallback control surface.
6. Confirm the WhatsApp access token is the long-lived system-user token, not a 24-hour dev token.
7. Know who the on-call admin is and how to reach them.

## Normal operation

1. Take the order on a phone and submit. The customer gets a confirmation WhatsApp with a TRACK ORDER link.
2. Prepare the drink. When it is ready, move the order to READY on the board. The customer gets the ready WhatsApp.
3. When the customer collects, mark the order DELIVERED. It leaves the active board.

Customers watch their own order and the live queue on their tracking page. They only ever see order numbers of other orders, never names or numbers.

## The fallback: drive everything from the sheet

If the `/orders` board is slow or unreachable, the system still works from the spreadsheet. This is the single most important recovery path.

1. Open the Orders tab in Google Sheets.
2. Find the order row (search by Order Number in column B).
3. Change the Status cell (column M) using the dropdown, for example to READY.
4. The Apps Script `onEdit` trigger posts to the backend, which updates the order and sends the ready WhatsApp exactly as the board would have.

Flow of the fallback:

```
Staff change Status in Google Sheet  ->  Apps Script onEdit trigger
   ->  POST /api/internal/sheet-status-change (with SHEET_WEBHOOK_SECRET)
   ->  FastAPI updates the order  ->  Meta WhatsApp ready message still fires
```

So even with no working staff board, changing the Status dropdown in the sheet keeps customers informed. Orders can still be created from any working order-entry phone; if all order entry is down, capture orders on paper and enter them when a device recovers.

## Quick fixes for common issues

| Issue | What you see | Fix |
| --- | --- | --- |
| WhatsApp message FAILED | Order shows a FAILED message status and an error note | For a failed ready message use the resend ready action. For a failed confirmation use the retry confirmation action. Both re-attempt the send. |
| Token expired | Staff message: "WhatsApp access token invalid or expired. Notify admin." | Admin regenerates the system-user token, updates `WHATSAPP_ACCESS_TOKEN`, restarts the backend. Then retry or resend the affected messages. |
| Template error | Staff message: "WhatsApp template not approved or parameters mismatch." | Confirm both templates are Approved and names match `WHATSAPP_CONFIRMATION_TEMPLATE` and `WHATSAPP_READY_TEMPLATE`. Do not rename templates during the event. |
| Invalid number | Staff message: "Customer number is not reachable on WhatsApp." | Re-check the mobile number. The customer may not use WhatsApp; direct them to their order number and the counter. |
| Order not found | A staff action returns not found | Refresh the board. Confirm the order exists in the Orders tab. Use the Order Number to locate it. |
| Someone edited the sheet directly | An order row looks wrong after a manual edit | Only change the Status dropdown (column M). Do not edit Order ID, Order Number, Tracking Token, or the JSON columns. If a structural column was changed, fix it back from the value the row shows, or cancel and re-create the order. |
| Duplicate-looking orders | Two similar rows | Check the Idempotency Key column. True duplicates from a retry are prevented; two genuinely separate submissions are two orders. Cancel the extra one. |
| Rate limit messages | "WhatsApp rate limit hit. Will retry shortly." | The backend retries automatically. If persistent, slow the pace of new orders briefly. |
| Slow or dropped internet | Orders slow to submit | Orders are written to the sheet before success is claimed, so retrying is safe. The idempotency key prevents duplicates on retry. |

## Important rules during the event

1. Do not rename WhatsApp templates while live.
2. Do not change the Orders tab column order or headers.
3. In the sheet, change only the Status dropdown. Leave all other columns alone.
4. Do not set `WHATSAPP_SEND_ENABLED` to false during the event; that silently stops all customer messages.
5. Moving an order to READY twice will not double-message the customer; the ready send is protected against duplicates.

## Who to call

Fill these in before the event:

| Role | Name | Contact |
| --- | --- | --- |
| On-call admin (env, tokens, restart) | ______ | ______ |
| Counter lead (operations) | ______ | ______ |
| Meta or WhatsApp escalation | ______ | ______ |

## Rolling back a bad deploy

If a fresh deploy misbehaves during the event:

1. Restart the previous known-good backend release or image, or point the process manager back to it.
2. For a frontend problem, redeploy the previous `dist/` build to `beantradition.in`.
3. Order data is safe. Google Sheets is the datastore, so a code rollback does not lose rows or statuses.
4. After rollback, confirm `GET /api/health` is `ok`, then create one test order and move it to READY to confirm the full path works.
5. Full deployment and rollback detail is in [deployment.md](deployment.md).

## End of event

1. Mark any remaining active orders DELIVERED or CANCELLED so the board is clean.
2. The Orders tab is the record of the event; export or copy it if you need a report.
3. Consider setting `WHATSAPP_SEND_ENABLED=false` after the event if the backend stays running, to avoid accidental sends.
