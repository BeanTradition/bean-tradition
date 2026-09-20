# Vercel-only deploy (free, no Render, no repo-root changes)

Runs the whole event system on Vercel's free Hobby tier as **two projects** from the
`bean-tradition` repo, deploying the **`order-tracking-branch`** branch. Neither project uses
the repo root, so your existing e-commerce Vercel setup and `main` are untouched. No merge to
`main` is required.

- **backend** project  -> Root Directory `backend`  -> FastAPI as a Python serverless function
- **frontend** project -> Root Directory `frontend` -> static Vite build

## Required first: the Apps Script order-number counter
Serverless instances do not share memory, so the in-process lock cannot prevent duplicate
order numbers across concurrent requests. You MUST deploy the Apps Script LockService counter
(free, runs on Google) and set `ORDER_NUMBER_SCRIPT_URL` + `ORDER_NUMBER_SCRIPT_SECRET` on the
backend project. Steps: `apps-script/README.md`. Without it, two simultaneous orders can get
the same `BT####`.

## 1. Backend project (Vercel)
1. New Project -> import `BeanTradition/bean-tradition`.
2. Settings:
   - Production Branch: `order-tracking-branch`
   - Root Directory: `backend`
   - Framework Preset: Other (Vercel auto-detects the Python function at `api/index.py`;
     `backend/vercel.json` rewrites all paths to it). Python 3.12 is Vercel's current default.
3. Environment Variables (copy secrets from your local `backend/.env`):
   ```
   GOOGLE_SHEET_ID=...
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...              # full key, \n sequences, in quotes
   EVENT_ADMIN_PASSWORD=<strong>
   SESSION_SECRET=<random>
   SHEET_WEBHOOK_SECRET=<random>
   ORDER_NUMBER_SCRIPT_URL=<Apps Script /exec URL>
   ORDER_NUMBER_SCRIPT_SECRET=<matches Apps Script>
   ENVIRONMENT=production
   COOKIE_SAMESITE=none               # required: frontend and backend are different domains
   WHATSAPP_SEND_ENABLED=false        # until Meta templates are approved
   CORS_ORIGINS=<frontend URL, filled after step 2>
   FRONTEND_URL=<frontend URL, filled after step 2>
   ```
4. Deploy. Note the URL, e.g. `https://bean-tradition-api.vercel.app`.
5. Test: `https://<backend>.vercel.app/api/health` -> `"google_sheets": "configured"`.

## 2. Frontend project (Vercel)
1. New Project -> import the same repo again.
2. Settings: Production Branch `order-tracking-branch`, Root Directory `frontend`
   (Vercel detects Vite; `frontend/vercel.json` handles SPA deep links).
3. Environment Variable: `VITE_API_BASE_URL=https://<backend>.vercel.app`
4. Deploy. Note the URL, e.g. `https://bean-tradition-order.vercel.app`.

## 3. Link them (CORS + tracking URL)
Back on the **backend** project, set `CORS_ORIGINS` and `FRONTEND_URL` to the frontend URL
from step 2, then redeploy the backend. Cross-domain login works because the session cookie is
issued `SameSite=None; Secure` (via `COOKIE_SAMESITE=none`) and CORS runs with credentials and
an explicit origin.

## 4. Verify
- `https://<frontend>.vercel.app` -> event login (password = `EVENT_ADMIN_PASSWORD`).
- Place an order -> row in the Google Sheet; order number from the Apps Script counter.
- `/place-order`, `/orders`, `/track/<token>` all load.

## Custom domain (optional, later)
Add a domain/subdomain to the frontend project (e.g. `order.beantradition.in`) and to the
backend project (e.g. `api.beantradition.in`), then update `VITE_API_BASE_URL`, `CORS_ORIGINS`,
and `FRONTEND_URL` accordingly and redeploy. Pointing `beantradition.in` itself is the only
step that would disturb the existing store.

## Caveats (free serverless)
- In-memory cache, rate limiting, and webhook de-dup reset between invocations. Acceptable for
  the MVP; correctness of orders/numbering does not depend on them (numbering uses the Apps
  Script counter; webhook status writes are idempotent).
- Vercel Hobby is officially for non-commercial use. A paid event tool may fall outside that;
  review Vercel's terms.
- Keep the WhatsApp retry backoff modest so a send stays within the function time limit.
