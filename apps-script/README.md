# Bean Tradition Event Ordering: Apps Script Deployment

This folder holds the Google Apps Script (V8) that backs the "Bean Tradition Event Orders" Google Sheet. It provides two independent mechanisms the FastAPI backend relies on:

1. **Order Number Counter web app** (`doPost`): a concurrency-safe sequence generator that hands out unique, gap-free order numbers.
2. **onEdit Status Listener** (`onStatusEdit`): an installable trigger that forwards staff status changes from the Sheet to the FastAPI backend. This is the emergency fallback path for advancing orders and triggering the Ready WhatsApp message.

Files:

- `Code.gs` — both runtime capabilities (`doPost` counter, `onStatusEdit` listener).
- `setup_sheet.gs` — one-time `setupSpreadsheet()` helper that builds the tabs, headers, seed settings, counter, and the Status dropdown.
- `README.md` — this file.

---

## 1. Open the Apps Script project from the Sheet

1. Open the Google Sheet named **Bean Tradition Event Orders**.
2. Menu: **Extensions > Apps Script**. This opens the bound script project.
3. Add the two script files if they are not already present:
   - Create a file named `Code.gs` and paste the contents of `Code.gs`.
   - Create a file named `setup_sheet.gs` (New > Script) and paste the contents of `setup_sheet.gs`.
4. **Save** the project.

---

## 2. Set the four Script Properties

Menu in the Apps Script editor: **Project Settings** (gear icon) > **Script Properties** > **Add script property**. Add:

| Property | Value | Notes |
| --- | --- | --- |
| `ORDER_NUMBER_SECRET` | a long random string | Shared secret for the counter web app. Must equal the FastAPI env var `ORDER_NUMBER_SCRIPT_SECRET`. |
| `BACKEND_URL` | e.g. `https://api.example.com` | Base URL of the FastAPI backend. No trailing slash. |
| `SHEET_WEBHOOK_SECRET` | a long random string | Shared secret for the status webhook. Must equal the FastAPI env var `SHEET_WEBHOOK_SECRET`. |

> Note the naming: the Apps Script property `ORDER_NUMBER_SECRET` must match the FastAPI env var `ORDER_NUMBER_SCRIPT_SECRET`, and the Apps Script property `SHEET_WEBHOOK_SECRET` must match the FastAPI env var `SHEET_WEBHOOK_SECRET`. If the values do not match on both sides, requests are rejected as unauthorized.

Generate secrets with any secure method, for example:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 3. Run `setupSpreadsheet()` once

1. In the Apps Script editor, open `setup_sheet.gs`.
2. In the function dropdown at the top, select **setupSpreadsheet**.
3. Click **Run**.
4. On first run Google prompts for authorization. Review and **Allow** (the script needs access to the spreadsheet and, for the status listener, external requests).

This creates or ensures:

- **Orders** tab with the exact A..Y header row (bold, frozen).
- **Settings** tab with the seed rows (Brand Name, Order Prefix, Default Country Code, Initial Order Status, Queue Display Limit, Tracking Poll Interval, WhatsApp Template Language, Event Name).
- **Counters** tab with `A1 = 0`.
- A dropdown on column M (Status) with values RECEIVED, PREPARING, READY, DELIVERED, CANCELLED, plus decorative colours.

The helper is idempotent: re-running it never wipes existing order rows and never resets an already-advanced counter.

---

## 4. Deploy `doPost` as a Web App (the Order Number Counter)

1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Configure:
   - **Description**: `Bean Tradition order number counter`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Click **Deploy**, authorize if prompted, and copy the **Web app URL**. It ends in `/exec`.
5. Set this `/exec` URL as the FastAPI env var **`ORDER_NUMBER_SCRIPT_URL`**.

Quick sanity checks:

```bash
# Health check (GET). Should return JSON with "ok": true.
curl -L "https://script.google.com/.../exec"

# Increment (POST). Should return {"sequence": <int>}.
curl -L -X POST "https://script.google.com/.../exec" \
  -H "Content-Type: application/json" \
  -d '{"secret":"<ORDER_NUMBER_SECRET>"}'
```

A wrong or missing `secret` returns `{"error":"unauthorized"}` and does **not** increment the counter.

> Whenever you change `Code.gs`, create a **new version** of the deployment (Deploy > Manage deployments > edit > New version) or the live `/exec` URL keeps serving the old code.

---

## 5. Install the onEdit Status Listener as an INSTALLABLE trigger

The status listener must be an **installable** trigger, not a simple `onEdit`. Simple triggers run in a restricted context and **cannot call external URLs** with `UrlFetchApp`, which this listener needs.

1. In the Apps Script editor, open **Triggers** (clock icon in the left sidebar).
2. Click **Add Trigger** (bottom right).
3. Configure:
   - **Choose which function to run**: `onStatusEdit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: **From spreadsheet**
   - **Select event type**: **On edit**
4. Click **Save** and authorize if prompted.

Do **not** rename the function to `onEdit`, and do not rely on a simple trigger. Only the installable trigger above can reach the backend.

---

## 6. How the two mechanisms work

**Order Number Counter (`doPost`).** When the backend creates an order it POSTs `{"secret": "..."}` to the `/exec` URL. The script verifies the secret against `ORDER_NUMBER_SECRET` (constant-time compare) and rejects mismatches without incrementing. It then acquires `LockService.getScriptLock()` (20s timeout), reads `Counters!A1` (default 0), increments, writes it back, flushes, releases the lock in a `finally` block, and returns `{"sequence": <int>}`. The lock guarantees two simultaneous orders can never receive the same number.

**Status Listener (`onStatusEdit`).** When a staff member changes the Status dropdown in column M on the Orders tab, the installable On edit trigger fires. The handler acts only for the Orders tab, column M, non-header rows, and only when the value actually changed (no-op re-entries are ignored). It stamps column S (Updated At) with an ISO-8601 timestamp, reads the Order Number from column B, and POSTs `{order_number, status, secret}` to `${BACKEND_URL}/api/internal/sheet-status-change`, also sending the secret as the header `X-Sheet-Secret`. The call uses `muteHttpExceptions` and a short timeout, and every failure is logged rather than thrown so the staff edit is never blocked. The backend decides whether to send the Ready WhatsApp message and dedupes on its side.

---

## 7. Emergency fallback flow

If the normal app flow is unavailable, staff can advance an order directly:

1. Staff open the Sheet and change the order's **Status** dropdown in column M (for example PREPARING -> READY).
2. `onStatusEdit` fires, timestamps Updated At, and forwards the change to FastAPI.
3. FastAPI processes the status change and, when appropriate, calls the **Meta WhatsApp** API to notify the customer.

Flow: **staff change Status in the Sheet dropdown -> `onStatusEdit` -> FastAPI (`/api/internal/sheet-status-change`) -> Meta WhatsApp**.

---

## Troubleshooting

- **Counter returns `unauthorized`**: `ORDER_NUMBER_SECRET` (Apps Script) does not match `ORDER_NUMBER_SCRIPT_SECRET` (FastAPI).
- **Counter returns `busy`**: another request held the lock past 20s. The backend should retry.
- **Status changes not reaching the backend**: confirm the trigger is **installable** (Triggers list shows `onStatusEdit`, event "On edit"), and check **Executions** in the editor for logged errors. Verify `BACKEND_URL` has no trailing slash and `SHEET_WEBHOOK_SECRET` matches the FastAPI env var.
- **Code changes not taking effect on `/exec`**: create a new deployment version.
