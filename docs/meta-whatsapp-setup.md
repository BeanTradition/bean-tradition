# Meta WhatsApp setup

This guide connects the backend to the Meta WhatsApp Business Cloud API. WhatsApp is the only messaging channel. The backend sends two approved templates (order confirmation and order ready) and receives delivery and read events on a webhook.

All WhatsApp credentials live in backend environment variables only. They are never sent to the React app.

Do this in order:

1. Meta Business account.
2. Meta Developer app with the WhatsApp product.
3. Register and verify a sender phone number.
4. Collect the Phone Number ID and WhatsApp Business Account ID.
5. Create a production system-user access token.
6. Set the WhatsApp env vars.
7. Configure the webhook and signature validation.

The two message templates are created separately in [whatsapp-templates.md](whatsapp-templates.md).

## 1. Meta Business account

1. Go to https://business.facebook.com and sign in or create a Meta Business account.
2. Complete the business details. A verified business is required to move beyond test limits and to raise messaging limits.

## 2. Meta Developer app

1. Go to https://developers.facebook.com/apps and click Create App.
2. Choose the Business app type.
3. Name the app, for example `Bean Tradition Ordering`, and link it to your Business account.
4. On the app dashboard, find WhatsApp and click Set up. This adds the WhatsApp product.

## 3. Register and verify a phone number

1. In the app, open WhatsApp, then API Setup (or Getting Started).
2. Add the phone number you will send from. It must not already be active on the WhatsApp consumer or Business app.
3. Verify the number by the code Meta sends.
4. Set the display name and complete any business verification steps Meta requires.

During early testing Meta provides a test number and lets you add a small list of allowed recipient numbers. Add your own test phones there. To message any customer you need an approved, registered production number.

## 4. Phone Number ID and WhatsApp Business Account ID

From WhatsApp, then API Setup, copy these two ids. They are not the phone number itself.

| Value | Env var | Notes |
| --- | --- | --- |
| Phone Number ID | `WHATSAPP_PHONE_NUMBER_ID` | Identifies the sender number in Graph API calls. |
| WhatsApp Business Account ID (WABA) | `WHATSAPP_BUSINESS_ACCOUNT_ID` | The account that owns the templates and number. |

The backend calls `https://graph.facebook.com/<WHATSAPP_API_VERSION>/<WHATSAPP_PHONE_NUMBER_ID>/messages` to send. The default `WHATSAPP_API_VERSION` is `v21.0`.

## 5. Production system-user access token

Do not use the temporary token shown on the API Setup page for production. That token expires in about 24 hours, which means WhatsApp will silently stop working during the event. Use a long-lived system-user token instead.

1. Go to Business Settings, then Users, then System Users.
2. Create a system user (for example `bean-tradition-system`) with the Admin role, or assign it to the app and the WABA.
3. Assign assets: give the system user access to the app and to the WhatsApp Business Account.
4. Click Generate New Token, select the app, and choose these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Generate the token and copy it once. Store it only in the backend env as `WHATSAPP_ACCESS_TOKEN`.

Why a system-user token:

1. It does not expire on the 24-hour dev cycle, so it survives the event.
2. It is tied to the business, not a personal login.
3. It lives only in backend environment variables. It is never exposed to the browser.

Rotate the token if it is ever leaked, and keep a note of who holds admin access so it can be regenerated quickly on event day.

## 6. Set the WhatsApp env vars

Set these in `backend/.env` (local) and in your production environment:

```
WHATSAPP_ACCESS_TOKEN=EAAG...            # system-user token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_CONFIRMATION_TEMPLATE=order_confirmation
WHATSAPP_READY_TEMPLATE=order_ready
WHATSAPP_TEMPLATE_LANGUAGE=en
WHATSAPP_API_VERSION=v21.0
META_WEBHOOK_VERIFY_TOKEN=a-random-verify-token
META_APP_SECRET=your-app-secret
WHATSAPP_SEND_ENABLED=false              # set true only in production
```

`WHATSAPP_SEND_ENABLED` is the master switch. When it is `false`, no real Meta call is made and the backend logs and returns a simulated success. Keep it `false` for local development and set it `true` in production. See [deployment.md](deployment.md).

Find `META_APP_SECRET` under App settings, then Basic, in the App Secret field.

## 7. Webhook setup

The webhook lets Meta report delivery and read status back to the backend.

1. In the app, open WhatsApp, then Configuration (Webhooks).
2. Set the Callback URL to:
   ```
   https://api.beantradition.in/api/webhooks/meta-whatsapp
   ```
3. Set the Verify Token to the exact value of `META_WEBHOOK_VERIFY_TOKEN`.
4. Click Verify and Save. Meta sends a GET request; the backend echoes the challenge only when the verify token matches.
5. Under Webhook fields, subscribe to:
   - `messages` (covers inbound messages and message status events such as sent, delivered, read, failed)

The backend uses status events to update the confirmation and ready message status columns. Inbound customer messages are logged and ignored, because there is no chatbot.

### App-secret signature validation

Every webhook POST from Meta includes an `X-Hub-Signature-256` header. When `META_APP_SECRET` is set, the backend recomputes the HMAC SHA-256 of the raw request body and rejects the request with 403 if it does not match. This stops forged webhook calls. Always set `META_APP_SECRET` in production.

The backend also deduplicates status events, so repeated deliveries of the same event do not double-update an order. It always returns 200 quickly to stop Meta retry storms.

## Meta API error reference

The backend categorises Meta errors and shows staff a safe, generic message. Raw Meta text (which can contain ids or tokens) is never shown in the staff UI. The table below maps the cause to what staff see and what to do.

| Cause | Meta signal | What staff see | Action |
| --- | --- | --- | --- |
| Auth or token expired | code 190 | "WhatsApp access token invalid or expired. Notify admin." | Regenerate the system-user token, update `WHATSAPP_ACCESS_TOKEN`, restart the backend. |
| Template not approved or parameter mismatch | codes 100, 132000, 132001, 132005 | "WhatsApp template not approved or parameters mismatch." | Confirm the template is approved and the names and parameter counts match. See [whatsapp-templates.md](whatsapp-templates.md). |
| Invalid or unreachable number | codes 131026, 131047 | "Customer number is not reachable on WhatsApp." | Re-check the mobile number. The customer may not use WhatsApp. |
| Rate limit | codes 4, 80007, 130429, 131048, or HTTP 429 | "WhatsApp rate limit hit. Will retry shortly." | The backend retries with backoff. If persistent, slow down sends or raise limits with Meta. |
| Server error | HTTP 5xx | "WhatsApp service temporarily unavailable. Will retry." | Transient. The backend retries automatically. |
| Network error | no response | "Network error contacting WhatsApp. Will retry." | Check the venue internet. The backend retries automatically. |
| Malformed response | unexpected body | "Unexpected WhatsApp response." | Rare. Check logs and Meta status. |

Retry behaviour: rate limit, server, network, and unknown errors are retried with exponential backoff (roughly 0.5s, 1.5s, then 3s, up to four attempts total). Auth, template, and invalid-number errors are permanent and are not retried, because retrying cannot fix them.

## Verify end to end

1. Set `WHATSAPP_SEND_ENABLED=true` and the token, ids, and templates.
2. Create a test order to a number allowed by Meta (or any number once the production number is approved).
3. Confirm the confirmation message arrives with a working TRACK ORDER button.
4. Move the order to READY and confirm the ready message arrives.
5. Open Configuration in Meta and confirm the webhook shows recent successful deliveries, and the order's message status columns update to DELIVERED or READ.
