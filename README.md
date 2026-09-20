# Bean Tradition Event Ordering and Live Tracking

Bean Tradition is a mobile-first coffee ordering and live order-tracking system built for a high-volume event counter. Staff take orders on their phones, customers get a WhatsApp confirmation with a live tracking link, and both staff and customers watch the queue update in real time. When the drink is ready, the customer gets a second WhatsApp message telling them to collect it.

The system is designed to keep working under event conditions: many concurrent orders, flaky venue Wi-Fi, and multiple devices in use at once. Google Sheets is the operational datastore, so any staff member can also read and drive the system straight from the spreadsheet as a fallback.

## Contents

1. [What it does](#what-it-does)
2. [Architecture](#architecture)
3. [Order and tracking flow](#order-and-tracking-flow)
4. [Tech stack](#tech-stack)
5. [Repository layout](#repository-layout)
6. [Documentation guides](#documentation-guides)
7. [Local development](#local-development)
8. [Backend environment variables](#backend-environment-variables)
9. [Frontend environment variable](#frontend-environment-variable)
10. [Security and privacy](#security-and-privacy)

## What it does

1. Staff sign in with a shared event password and enter orders on a mobile-first screen.
2. Each order gets a sequential order number (BT0001, BT0002, ...) and a private 256-bit tracking token.
3. The order is written to Google Sheets, then a WhatsApp confirmation template is sent to the customer with a TRACK ORDER button.
4. Customers open the tracking link and watch the live queue: which orders are preparing and which are ready.
5. Staff move an order from PREPARING to READY. That fires a WhatsApp "order ready" template.
6. Staff mark the order DELIVERED, which removes it from the active board.

WhatsApp is the only messaging channel. There is no SMS, email, Twilio, or wa.me link. There is no Postgres, Supabase, Firebase, or Redis. The datastore is Google Sheets.

## Architecture

```
                          Customers                         Staff (phones)
                              |                                   |
                    open tracking link                    order entry + board
                              |                                   |
                              v                                   v
        +---------------------------------------------------------------------+
        |            Frontend  (React + Vite + TS + Tailwind)                 |
        |                    https://beantradition.in                         |
        |     /            order entry           /orders board                |
        |     /track/:token   live customer tracking view                     |
        +---------------------------------------------------------------------+
                              |  HTTPS (JSON, HttpOnly session cookie)
                              v
        +---------------------------------------------------------------------+
        |               Backend  (Python 3.12 + FastAPI)                      |
        |                   https://api.beantradition.in                      |
        |                                                                     |
        |   api/auth      api/orders     api/track     api/webhooks           |
        |   api/internal  api/health                                          |
        |                                                                     |
        |   order_service  messaging_service  google_sheets  security         |
        +---------------------------------------------------------------------+
             |                        |                        ^
             | read / write           | send templates         | status events
             v                        v                        | + verification
      +---------------+     +--------------------+     +----------------------+
      | Google Sheets |     |  Meta WhatsApp     |     |  Meta webhook (POST) |
      | Orders/       |     |  Business Cloud    |     |  message + status    |
      | Settings/     |     |  API (graph)       |     |  events -> backend   |
      | Counters      |     +--------------------+     +----------------------+
             ^
             | onEdit trigger (staff change Status in the sheet)
             |
      +------------------------+
      | Google Apps Script     |  POST /api/internal/sheet-status-change
      | (onEdit + counter)     |  -> backend -> Meta WhatsApp still fires
      +------------------------+
```

Key points:

1. Secrets and all outbound WhatsApp traffic live only in the backend. The React app never holds a token.
2. Google Sheets is the source of truth. The backend converts rows to and from a typed order model at the boundary; raw rows never travel through the app.
3. A Google Apps Script `onEdit` trigger means a manual Status change inside the spreadsheet still calls the backend, which still sends the WhatsApp message. This is the event-day fallback if the staff board is unreachable.

## Order and tracking flow

Order creation:

1. Staff submit the order form. The frontend sends `POST /api/orders` with the items, mobile, and a client-generated `idempotency_key`.
2. The backend checks the idempotency key. If the same key already exists, it returns the existing order instead of creating a duplicate.
3. A concurrency-safe order number is allocated (Apps Script `LockService` web app if configured, otherwise a locked `Counters!A1` cell).
4. A unique order id (UUID) and a 256-bit tracking token are generated. The mobile number is normalised to E.164.
5. The order row is written to the Orders tab **before** success is claimed, with confirmation status `SEND_PENDING`.
6. The WhatsApp confirmation template is sent (with retry and backoff). The row is updated to `SENT` or `FAILED`, and the tracking url is returned to staff.

Tracking:

1. The customer opens `https://beantradition.in/track/<token>`.
2. The frontend polls `GET /api/track/<token>` on an interval (default 3000 ms).
3. The response contains the customer's own order (number, status, items) plus the public queue: order numbers that are preparing and order numbers that are ready. No other customer's name, mobile, or items are ever returned.

Ready and delivery:

1. Staff move the order to READY on the board (`PATCH /api/orders/<id>/status`) or by changing the Status cell in the sheet.
2. The backend sets `ready_at`, then sends the WhatsApp "order ready" template unless it has already been sent successfully (duplicate-send protection).
3. Staff mark the order DELIVERED. It leaves the active board and appears under recent delivered orders.

Message status feedback:

1. Meta calls `POST /api/webhooks/meta-whatsapp` with delivery and read events.
2. The backend validates the signature, deduplicates the event, and updates the order's confirmation or ready message status (SENT, DELIVERED, READ, FAILED).

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router |
| Backend | Python 3.12, FastAPI, Uvicorn, Pydantic v2, pydantic-settings |
| Datastore | Google Sheets (via `google-api-python-client` and a service account) |
| Messaging | Meta WhatsApp Business Cloud API (templates only) |
| Automation | Google Apps Script (`onEdit` trigger, order-number `LockService` web app) |
| Auth | Shared event password, signed HttpOnly session cookie (`itsdangerous`) |
| Phone parsing | `phonenumbers` (E.164 normalisation) |
| HTTP client | `httpx` (backend to Meta and to Apps Script) |

## Repository layout

```
bean-tradition-order-tracking/
  README.md                 <- this file
  docs/                     <- setup and operations guides
  backend/                  <- FastAPI service
    app/
      main.py               <- app factory, CORS, /api/health
      api/                  <- auth, orders, tracking, webhooks, internal, deps
      core/                 <- config, security, logging
      services/             <- order_service, google_sheets, messaging/
      models/order.py       <- order model, Sheet columns A..Y, statuses
      schemas/              <- request and response models
      utils/                <- order_numbers, tokens, phone
      middleware/           <- in-memory rate limiting
      tests/                <- pytest suite
    requirements.txt
    .env.example
  frontend/                 <- React (Vite + TS + Tailwind + React Router)
  apps-script/              <- Google Apps Script (onEdit + counter web app)
```

## Documentation guides

Follow these in order for a first-time setup.

| Guide | Purpose |
| --- | --- |
| [docs/google-cloud-setup.md](docs/google-cloud-setup.md) | Create the GCP project, enable the Sheets API, create a service account and JSON key, wire the credentials into the backend. |
| [docs/google-sheet-setup.md](docs/google-sheet-setup.md) | Build the spreadsheet: Orders (A..Y), Settings, Counters, the Status dropdown and colours, and the Apps Script hookup. |
| [docs/meta-whatsapp-setup.md](docs/meta-whatsapp-setup.md) | Create the Meta app, register the phone number, get the production token, and configure the webhook and signature validation. |
| [docs/whatsapp-templates.md](docs/whatsapp-templates.md) | Create the two approved utility templates with the TRACK ORDER URL button and map them to env vars. |
| [docs/deployment.md](docs/deployment.md) | Deploy the frontend and backend to production, set domains, DNS, HTTPS, and production env values. |
| [docs/event-testing-checklist.md](docs/event-testing-checklist.md) | Pre-event load and functional test checklist, including a 100-order simulation. |
| [docs/event-day-runbook.md](docs/event-day-runbook.md) | Operating during the event, the sheet fallback, quick fixes, and rollback. |

## Local development

The backend starts with zero configuration. Until Google credentials are set it uses an in-memory datastore, and until WhatsApp is configured (or with `WHATSAPP_SEND_ENABLED=false`) it simulates sends. You can run and test the whole flow locally without any external account.

### Backend

Run these from `backend/`.

1. Create a virtual environment with Python 3.12:
   ```
   py -3.12 -m venv .venv
   ```
2. Activate it:
   - Windows (PowerShell): `.venv\Scripts\Activate.ps1`
   - Windows (Git Bash): `source .venv/Scripts/activate`
   - macOS / Linux: `source .venv/bin/activate`
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Create your local env file:
   ```
   cp .env.example .env
   ```
   (On Windows PowerShell: `Copy-Item .env.example .env`.)
5. Run the server:
   ```
   uvicorn app.main:app --reload
   ```
6. Open http://localhost:8000. Interactive API docs are at http://localhost:8000/docs in development. Health is at http://localhost:8000/api/health.

The health endpoint reports whether Google Sheets and WhatsApp are configured or running in fallback mode, which is a quick way to confirm your `.env`.

### Frontend

Run these from `frontend/`.

1. Install dependencies:
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
3. Open http://localhost:5173. Set `VITE_API_BASE_URL=http://localhost:8000` in the frontend `.env` so the app talks to your local backend.

### Testing

Backend (from `backend/`, with the virtual environment active):

```
pytest
```

The suite has 42 tests covering utilities, models, the order service, messaging retry and duplicate protection, and the API. No test ever writes to a real spreadsheet or sends a real WhatsApp message.

Frontend (from `frontend/`):

```
npm run lint
npx tsc --noEmit
npm run build
```

## Backend environment variables

All values are read by `app/core/config.py`. Copy `backend/.env.example` to `backend/.env` and fill in the ones you need. Blank or defaulted values keep the local fallbacks working.

### Google Sheets

| Name | Purpose | Example |
| --- | --- | --- |
| `GOOGLE_SHEET_ID` | Spreadsheet id from the sheet url. If blank, the in-memory datastore is used. | `1AbCdEfGhIJklMNOpQrStUvWxYz0123456789` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email the sheet is shared with. | `bean-tradition@my-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Service account private key. Literal `\n` sequences are converted to real newlines at load. | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n` |

### Auth and sessions

| Name | Purpose | Example |
| --- | --- | --- |
| `EVENT_ADMIN_PASSWORD` | Shared staff login password for the event. | `beans-2026-strong` |
| `SESSION_SECRET` | Secret used to sign session cookies. Use a long random string. | `a-long-random-64-char-string` |
| `SESSION_COOKIE_NAME` | Session cookie name (optional). | `bt_session` |
| `SESSION_MAX_AGE_SECONDS` | Session lifetime in seconds (optional, default 57600 = 16 hours). | `57600` |

### URLs

| Name | Purpose | Example |
| --- | --- | --- |
| `FRONTEND_URL` | Public site url. Used to build the tracking link in WhatsApp. | `https://beantradition.in` |
| `BACKEND_URL` | Public API url. | `https://api.beantradition.in` |

### Meta WhatsApp Cloud API

| Name | Purpose | Example |
| --- | --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | System-user access token for the Cloud API. | `EAAG...` |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID of the sender number. | `123456789012345` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp Business Account (WABA) id. | `987654321098765` |
| `WHATSAPP_CONFIRMATION_TEMPLATE` | Name of the approved confirmation template. | `order_confirmation` |
| `WHATSAPP_READY_TEMPLATE` | Name of the approved ready template. | `order_ready` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template language code. | `en` |
| `WHATSAPP_API_VERSION` | Graph API version. | `v21.0` |
| `META_WEBHOOK_VERIFY_TOKEN` | Verify token you set when subscribing the webhook. | `a-random-verify-token` |
| `META_APP_SECRET` | Meta app secret used to validate `X-Hub-Signature-256`. | `0123456789abcdef0123456789abcdef` |
| `WHATSAPP_SEND_ENABLED` | Master send switch. Must be `true` in production. `false` simulates sends. | `true` |

### Internal webhook and order numbering

| Name | Purpose | Example |
| --- | --- | --- |
| `SHEET_WEBHOOK_SECRET` | Shared secret the Apps Script `onEdit` trigger sends to `/api/internal/sheet-status-change`. | `a-long-random-string` |
| `ORDER_NUMBER_SCRIPT_URL` | Optional Apps Script `LockService` counter web-app url. If blank, a locked `Counters!A1` cell is used. | `https://script.google.com/macros/s/AKfy.../exec` |
| `ORDER_NUMBER_SCRIPT_SECRET` | Shared secret sent to the counter web app. | `a-long-random-string` |

### Business configuration

These can also be overridden from the Settings tab in the spreadsheet.

| Name | Purpose | Example |
| --- | --- | --- |
| `DEFAULT_COUNTRY_CODE` | Country code applied to bare local mobile numbers. | `+91` |
| `ORDER_PREFIX` | Order number prefix. | `BT` |
| `INITIAL_ORDER_STATUS` | Status new orders start in. | `PREPARING` |
| `TRACKING_POLL_INTERVAL_MS` | How often the tracking page polls, in milliseconds. | `3000` |
| `QUEUE_DISPLAY_LIMIT` | Maximum queue entries shown on the tracking page. | `20` |
| `BRAND_NAME` | Brand name used in copy. | `Bean Tradition` |
| `EVENT_NAME` | Event name used in copy. | `Bean Tradition College Event` |

### Runtime

| Name | Purpose | Example |
| --- | --- | --- |
| `ENVIRONMENT` | `development` or `production`. `production` disables `/docs`. | `production` |
| `ENABLE_DOCS` | Enable interactive docs. Ignored in production. | `true` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins. Production must be explicit, no wildcard. | `https://beantradition.in` |
| `ACTIVE_CACHE_TTL_SECONDS` | Cache lifetime for the active-queue read (optional). | `2.0` |
| `TRACK_RATE_LIMIT_PER_MIN` | Per-client rate limit on the tracking endpoint (optional). | `60` |
| `LOGIN_RATE_LIMIT_PER_MIN` | Per-client rate limit on login (optional). | `10` |

## Frontend environment variable

| Name | Purpose | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base url of the backend API the React app calls. | `https://api.beantradition.in` (local: `http://localhost:8000`) |

Only variables prefixed with `VITE_` are exposed to the browser bundle. Never put a secret in a `VITE_` variable. Secrets belong in the backend only.

## Security and privacy

1. **Secrets stay in the backend.** WhatsApp tokens, the Meta app secret, the session secret, and the Google private key exist only in backend environment variables. They are never sent to or stored in the React app.
2. **No secrets in React.** The frontend holds only `VITE_API_BASE_URL`. Everything sensitive is called server-side.
3. **HttpOnly session cookie.** Staff auth uses a signed, timestamped cookie that is HttpOnly and `SameSite=Lax`. It is marked `Secure` automatically in production. JavaScript cannot read it.
4. **Tracking privacy.** The tracking response returns the requester's own order details (number, status, items) but only the **order numbers** of other orders in the queue. No other customer's name, mobile, or items are exposed. Tracking tokens are 256-bit, unguessable, and contain no personal data.
5. **Formula-injection sanitisation.** User-supplied text written to the sheet (name, notes, payment method, and similar) is checked for leading formula characters (`=`, `+`, `-`, `@`) and prefixed with a quote so Google Sheets treats it as text. This is applied at the row-serialisation boundary so no writer can bypass it.
6. **Webhook and internal authentication.** The Meta webhook validates the `X-Hub-Signature-256` HMAC using `META_APP_SECRET`, and verification uses `META_WEBHOOK_VERIFY_TOKEN`. The internal sheet-status endpoint requires the `SHEET_WEBHOOK_SECRET` (via the `X-Sheet-Secret` header or request body). All comparisons are constant-time.
7. **Rate limiting caveat.** Rate limiting is in-memory and per-process. With multiple backend instances behind a load balancer, each instance limits independently, so the effective limit is multiplied by the instance count. For a single-instance event this is fine. See [docs/deployment.md](docs/deployment.md).
8. **Disable docs in production.** Set `ENVIRONMENT=production` so `/docs`, `/redoc`, and `/openapi.json` are turned off.
