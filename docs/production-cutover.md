# Production cutover: event app on beantradition.in

Goal: serve the **event ordering app** at `https://beantradition.in` and the **FastAPI
backend** at `https://api.beantradition.in`. The e-commerce store is paused on this domain
(its code stays in the repo root and can be restored anytime by reverting the one Vercel
setting in step F).

Order of work: deploy the backend first (A-C), then point the frontend at it (D-F).

## A. Backend host recommendation
Use **Render** (Web Service). It runs the always-on FastAPI process cleanly and has GitHub
auto-deploy + one-click rollback. IMPORTANT: do **not** use the free instance for the event
day. Free instances sleep after ~15 min idle and cold-start for 30-60s, which is bad mid
event. Use the **Starter** paid instance (about $7/month) so it stays warm. Railway is a fine
alternative with the same idea.

## B. Create the Render service
1. Render dashboard -> New -> Web Service -> connect the `BeanTradition/bean-tradition` repo.
2. Settings:
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance type: Starter (not Free).

## C. Backend environment variables (Render -> Environment)
Copy the values from your local `backend/.env`. Set at minimum:
```
GOOGLE_SHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...            # paste the full key with \n sequences, in quotes
EVENT_ADMIN_PASSWORD=<a strong event password, NOT change-me>
SESSION_SECRET=<long random string>
SHEET_WEBHOOK_SECRET=<long random string>
ENVIRONMENT=production
FRONTEND_URL=https://beantradition.in
BACKEND_URL=https://api.beantradition.in
CORS_ORIGINS=https://beantradition.in
WHATSAPP_SEND_ENABLED=false       # keep false until Meta templates are approved
PYTHON_VERSION=3.12.10
```
Add the `WHATSAPP_*` and `META_*` values when you do the Meta setup. Enter secrets directly
in Render; never commit them.

## D. Point api.beantradition.in at Render
1. Render service -> Settings -> Custom Domains -> add `api.beantradition.in`. Render shows a
   CNAME target.
2. At your DNS registrar, add a CNAME record: `api` -> that Render target. Wait for it to
   verify (HTTPS is issued automatically).
3. Test: `https://api.beantradition.in/api/health` should return JSON with
   `"google_sheets": "configured"`.

## E. Frontend env var (Vercel)
In the Vercel project that serves beantradition.in: Settings -> Environment Variables, add
(Production scope):
```
VITE_API_BASE_URL=https://api.beantradition.in
```
This is read at build time, so it must exist before the build in step F.

## F. Switch beantradition.in to the event app (the cutover)
In the same Vercel project: Settings -> Build & Development Settings:
- **Root Directory: `frontend`** (this is the whole switch; it currently builds the repo root
  e-commerce app).
- Framework Preset: Vite (auto-detected). Build Command `npm run build`, Output `dist`.
Then Deployments -> Redeploy (from `main`).

Deep links like `/track/<token>` work because `frontend/vercel.json` rewrites all routes to
`index.html`.

## G. Verify end to end
1. `https://beantradition.in` -> event login page.
2. Log in, place an order -> row appears in the Google Sheet Orders tab.
3. `https://beantradition.in/place-order`, `/orders`, `/track/<token>` all load (no 404).
4. `https://api.beantradition.in/api/health` -> ok.

## Reversibility
To restore the e-commerce store on beantradition.in: set the Vercel Root Directory back to
empty (repo root) and redeploy. Nothing in the repo is deleted by any of the above.

## Notes
- WhatsApp stays simulated until `WHATSAPP_SEND_ENABLED=true` AND the Meta templates are
  approved (see `docs/meta-whatsapp-setup.md`). Orders and tracking work regardless.
- Production serves the `main` branch. Ongoing development happens on `order-tracking-branch`;
  changes reach production only when that branch is merged into `main`.
- Deploy the Apps Script pieces (`apps-script/README.md`) for the manual-edit fallback and
  cross-instance order numbering, pointing `BACKEND_URL` at `https://api.beantradition.in`.
