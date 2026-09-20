# Google Sheet setup

This guide builds the spreadsheet that acts as the operational datastore. It has three tabs: Orders (the order log), Settings (runtime configuration), and Counters (the order-number counter). Do this before or right after [google-cloud-setup.md](google-cloud-setup.md), and remember to share the finished spreadsheet with the service account as Editor.

All timestamps in the Orders tab are ISO-8601 UTC strings written by the backend, for example `2026-09-20T10:15:30Z`. Do not reformat those columns as dates in the sheet, because the backend reads them back as text.

## 1. Create the spreadsheet

1. Go to https://sheets.google.com and create a blank spreadsheet.
2. Name it `Bean Tradition Event Orders`.
3. Copy the spreadsheet id from the url and set it as `GOOGLE_SHEET_ID` in the backend env.

## 2. Create the Orders tab

1. Rename the first tab to exactly `Orders`.
2. Put the following headers in row 1, columns A through Y, in this exact order. The backend appends data rows starting at row 2.

| Col | Header | Meaning |
| --- | --- | --- |
| A | Order ID | Internal UUID for the order. Primary key used by staff actions. |
| B | Order Number | Human-readable number, for example BT0001. Shown to customers and staff. |
| C | Tracking Token | 256-bit URL-safe secret. Used in the customer tracking link. Keep private. |
| D | Created At | ISO-8601 UTC timestamp when the order was created. |
| E | Customer Name | Customer name. Sanitised against formula injection on write. |
| F | Mobile | Normalised E.164 mobile number, for example +919876543210. |
| G | Items JSON | Machine-readable items as a JSON array of product and quantity. |
| H | Items Display | Human-readable items, for example "Cappuccino x2, Latte x1". |
| I | Quantity Total | Total number of items in the order. |
| J | Notes | Free-text order notes. Sanitised on write. |
| K | Amount | Order amount, or blank if not captured. |
| L | Payment Method | Payment method label, for example cash or upi. |
| M | Status | Order status: RECEIVED, PREPARING, READY, DELIVERED, or CANCELLED. |
| N | Confirmation Message Status | Confirmation WhatsApp status: NOT_SENT, SEND_PENDING, SENT, FAILED, DELIVERED, READ. |
| O | Confirmation Meta Message ID | Meta message id for the confirmation message. |
| P | Ready Message Status | Ready WhatsApp status, same value set as column N. |
| Q | Ready Meta Message ID | Meta message id for the ready message. |
| R | Created By | Staff identifier that created the order. |
| S | Updated At | ISO-8601 UTC timestamp of the last update. |
| T | Ready At | ISO-8601 UTC timestamp when the order became READY. |
| U | Delivered At | ISO-8601 UTC timestamp when the order became DELIVERED. |
| V | Idempotency Key | Client-generated key that prevents duplicate orders. |
| W | Confirmation Last Attempt | ISO-8601 UTC timestamp of the last confirmation send attempt. |
| X | Ready Message Last Attempt | ISO-8601 UTC timestamp of the last ready send attempt. |
| Y | Last Messaging Error | Last messaging error message, blank when the last send succeeded. |

Notes:

1. The column order is fixed. The backend maps columns by position (A..Y), not by header text, so do not insert, remove, or reorder columns.
2. Freeze row 1 (View, then Freeze, then 1 row) so the header stays visible.
3. Leave data rows to the backend. It appends new rows and updates existing rows in place.

## 3. Create the Settings tab

The Settings tab lets you change runtime behaviour without redeploying. The backend reads keys from column A and values from column B, starting at row 2.

1. Add a tab named exactly `Settings`.
2. Put `Key` in A1 and `Value` in B1.
3. Seed these keys and values:

| Key (A) | Value (B) | Meaning |
| --- | --- | --- |
| Brand Name | Bean Tradition | Brand name used in copy. |
| Event Name | Bean Tradition College Event | Event name used in copy. |
| Order Prefix | BT | Prefix for order numbers. |
| Default Country Code | +91 | Country code applied to bare local mobiles. |
| Initial Order Status | PREPARING | Status new orders start in. |
| Queue Display Limit | 20 | Maximum queue entries shown on the tracking page. |
| Tracking Poll Interval | 3000 | Tracking page poll interval in milliseconds. |
| WhatsApp Template Language | en | Template language code. |

The two keys the backend reads at request time are `Initial Order Status` and `Queue Display Limit`. The others document intent and match the environment defaults. When a Settings value is missing or invalid, the backend falls back to the matching environment variable.

## 4. Create the Counters tab

This tab holds the order-number counter used by the locked counter-cell allocation path (the fallback when the Apps Script `LockService` web app is not configured).

1. Add a tab named exactly `Counters`.
2. Put `0` in cell A1.

Each new order increments A1 under a lock and formats the result as an order number, so the first order becomes BT0001. Do not edit A1 during the event unless you are deliberately resetting numbering before it starts.

## 5. Status dropdown and colours

Make the Status column (M) a dropdown so staff can drive orders straight from the sheet as a fallback.

1. Select column M from row 2 down (for example M2:M1000).
2. Choose Data, then Data validation.
3. Add a rule of type "Dropdown" with these values: `RECEIVED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`.
4. Save.

Add colour with conditional formatting so the board is readable at a glance. Apply to the same range (M2:M1000), text-contains rules:

| Status | Suggested colour |
| --- | --- |
| RECEIVED | Light grey |
| PREPARING | Amber or yellow |
| READY | Green |
| DELIVERED | Blue |
| CANCELLED | Red |

Colours are cosmetic and do not affect the backend. Keep the text values exactly as listed so the backend and the Apps Script trigger recognise them.

## 6. Attach the Apps Script pieces

Two Apps Script components make the sheet a live part of the system:

1. **onEdit trigger.** When a staff member changes the Status cell in the Orders tab, the trigger posts the order number and new status to `POST /api/internal/sheet-status-change` with the shared `SHEET_WEBHOOK_SECRET`. The backend then updates the order and, for READY, sends the ready WhatsApp message. This is the event-day fallback if the staff board is unreachable.
2. **Order-number counter web app (optional).** A `LockService`-based web app allocates order numbers safely across multiple backend instances. If configured, set `ORDER_NUMBER_SCRIPT_URL` and `ORDER_NUMBER_SCRIPT_SECRET`. If not configured, the backend uses the locked `Counters!A1` cell instead.

For the exact script code, deployment steps, trigger installation, and the secret values, see `apps-script/README.md` in the repository. Point the Apps Script `BACKEND_URL` at `https://api.beantradition.in` in production and set its shared secret to match `SHEET_WEBHOOK_SECRET`.

## 7. Final checks

1. The spreadsheet is shared with `GOOGLE_SERVICE_ACCOUNT_EMAIL` as Editor.
2. `GOOGLE_SHEET_ID` matches this spreadsheet.
3. Orders row 1 has all 25 headers (A..Y) in order.
4. Settings has the seed keys and values.
5. Counters A1 is `0`.
6. The Status dropdown lists all five statuses.
7. Create a test order and confirm a row appears, the counter increments, and a manual Status change to READY triggers the ready message (with `WHATSAPP_SEND_ENABLED=false` this will be a simulated send in the logs).
