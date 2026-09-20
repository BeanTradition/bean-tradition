# Production deployment

This guide deploys the two services to production:

1. Frontend (React build) served at `https://beantradition.in`.
2. Backend (FastAPI via Uvicorn behind a process manager or in a container) served at `https://api.beantradition.in`.

Complete the setup guides first: [google-cloud-setup.md](google-cloud-setup.md), [google-sheet-setup.md](google-sheet-setup.md), [meta-whatsapp-setup.md](meta-whatsapp-setup.md), and [whatsapp-templates.md](whatsapp-templates.md).

## 1. Domains and DNS

Point two hostnames at your hosting:

| Hostname | Serves | Typical DNS |
| --- | --- | --- |
| `beantradition.in` | Frontend static build | A or CNAME to the frontend host |
| `api.beantradition.in` | Backend API | A or CNAME to the backend host |

Enable HTTPS on both. Most static hosts and platforms issue certificates automatically. If you run the backend yourself, terminate TLS at a reverse proxy (for example Nginx or Caddy) with a certificate from a provider such as Let's Encrypt. The session cookie is marked Secure in production, so the API must be served over HTTPS or staff login will not persist.

## 2. Build and host the frontend

1. Set the frontend production env before building:
   ```
   VITE_API_BASE_URL=https://api.beantradition.in
   ```
   Vite inlines `VITE_` variables at build time, so this must be set before `npm run build`.
2. Build:
   ```
   npm install
   npm run build
   ```
3. Deploy the generated `dist/` output to your static host or CDN for `beantradition.in`.
4. Configure single-page-app routing so deep links such as `/track/<token>` and `/orders` serve `index.html` (a rewrite of all paths to `index.html`). Without this, refreshing a tracking link returns a 404.

## 3. Deploy the backend

Run Uvicorn behind a process manager or in a container. Do not run with `--reload` in production.

Example direct run:

```
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For resilience, run it under a process manager (systemd, supervisor, or a container orchestrator) so it restarts on crash and on reboot. Put a reverse proxy in front for TLS and to forward the real client IP.

If you use a reverse proxy, forward the `X-Forwarded-For` header. The rate limiter reads it to identify clients. Also forward the original host and scheme so redirects and cookies behave.

## 4. Production environment values

Set these in the backend production environment. Values not shown here follow the tables in the main [README](../README.md#backend-environment-variables).

| Variable | Production value | Why |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | Disables `/docs`, `/redoc`, and `/openapi.json`, and marks the session cookie Secure. |
| `WHATSAPP_SEND_ENABLED` | `true` | Enables real WhatsApp sends. If left false, no customer messages go out. |
| `FRONTEND_URL` | `https://beantradition.in` | Used to build the tracking link in messages. |
| `BACKEND_URL` | `https://api.beantradition.in` | Public API url. |
| `CORS_ORIGINS` | `https://beantradition.in` | Explicit allowed origin. Do not use a wildcard in production. |
| `EVENT_ADMIN_PASSWORD` | a strong shared password | Staff login. |
| `SESSION_SECRET` | a long random string | Signs session cookies. |
| `SHEET_WEBHOOK_SECRET` | a long random string | Authenticates the Apps Script status webhook. |
| `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | real values | Live Sheets datastore. |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` | real values | Sending on the production number. |
| `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET` | real values | Webhook verification and signature validation. |

Frontend production env:

| Variable | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://api.beantradition.in` |

### CORS in production

`CORS_ORIGINS` must be the exact site origin, `https://beantradition.in`. Do not use `*`. The API sends credentials (the session cookie), and a wildcard origin with credentials is both unsafe and rejected by browsers.

### Docs are off in production

With `ENVIRONMENT=production`, the interactive `/docs` and `/redoc` pages and `/openapi.json` are disabled. Confirm they return 404 after deploy. `GET /api/health` stays available and is a good uptime probe.

## 5. Point Meta and Apps Script at the API domain

1. In Meta, set the webhook callback url to:
   ```
   https://api.beantradition.in/api/webhooks/meta-whatsapp
   ```
   and use `META_WEBHOOK_VERIFY_TOKEN` to verify. See [meta-whatsapp-setup.md](meta-whatsapp-setup.md).
2. In the Apps Script project, set `BACKEND_URL` to `https://api.beantradition.in` so the `onEdit` trigger posts to production, and set its shared secret to match `SHEET_WEBHOOK_SECRET`.
3. If you use the Apps Script counter web app, set `ORDER_NUMBER_SCRIPT_URL` to its deployed `/exec` url and `ORDER_NUMBER_SCRIPT_SECRET` to its shared secret. See `apps-script/README.md`.

## 6. Post-deploy verification

1. `GET https://api.beantradition.in/api/health` returns `status: ok`, `environment: production`, `google_sheets: configured`, and `whatsapp_send_enabled: true`.
2. `https://api.beantradition.in/docs` returns 404.
3. Staff can log in at `https://beantradition.in` and the session persists across refresh.
4. A test order writes a row to the sheet, allocates the next order number, and sends a confirmation WhatsApp with a working TRACK ORDER button.
5. Moving the order to READY sends the ready WhatsApp. A manual Status change in the sheet does the same via the Apps Script trigger.
6. The tracking page loads over HTTPS and updates as the queue changes.

## 7. Multi-instance caveat

Two pieces of state are in-memory and per-process:

1. **Active-queue cache.** Each backend instance caches the active orders for a couple of seconds. With several instances, one instance may briefly serve slightly stale queue data until its cache expires.
2. **Rate limiting.** Limits are counted per process. With N instances behind a load balancer, the effective limit is roughly N times the configured value, because each instance counts independently.

For a single-instance event deployment this is fine and is the recommended setup. The order number allocation is still safe across instances only if you use the Apps Script `LockService` web app (`ORDER_NUMBER_SCRIPT_URL`); the locked counter-cell fallback is safe for a single instance only. If you must scale horizontally, use the Apps Script counter and be aware that the cache and rate limits are not shared. There is no Redis by design.

## Rolling back a bad deploy

1. Keep the previous frontend build and the previous backend image or release so you can restore quickly.
2. Frontend: redeploy the previous `dist/` build to `beantradition.in`.
3. Backend: restart the previous release or image, or point the process manager back to the last known-good version.
4. Because Google Sheets is the datastore, order data is not lost by a code rollback. Rows and statuses stay intact.
5. After rollback, re-run the post-deploy verification steps above. See also [event-day-runbook.md](event-day-runbook.md).
