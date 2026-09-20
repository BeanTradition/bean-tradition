# WhatsApp message templates

The system sends exactly two WhatsApp messages, both as approved message templates: an order confirmation on order creation and an order ready message when the order status becomes READY. Both use a URL call-to-action button labelled TRACK ORDER that opens the customer's live tracking page.

Templates must be created and approved by Meta before the backend can send them. This guide covers creating both, the exact copy, the button configuration, how the backend fills them, and the approval wait.

## Where to create templates

1. Open the WhatsApp Manager, or in your app go to WhatsApp, then Manage templates (Message Templates).
2. Confirm you are in the correct WhatsApp Business Account (matching `WHATSAPP_BUSINESS_ACCOUNT_ID`).
3. Click Create template.

For both templates:

- Category: Utility. These are transactional order updates, not marketing. Utility templates approve faster and are the correct category.
- Language: English, matching `WHATSAPP_TEMPLATE_LANGUAGE` (default `en`).
- Button type: URL call-to-action (a dynamic URL button). Do not use Quick Reply. The backend fills a dynamic URL suffix, which only a URL button supports.

## Template 1: order confirmation

1. Name it `order_confirmation` (this must match `WHATSAPP_CONFIRMATION_TEMPLATE`).
2. Category: Utility. Language: English.
3. Body text (use `{{1}}` and `{{2}}` placeholders exactly):
   ```
   Thanks for ordering from Bean Tradition, {{1}} ☕
   Your order number is {{2}}.
   We're preparing your order.
   Track your order live using the button below.
   ```
4. Provide sample values when prompted, for example `{{1}}` = `Aditi`, `{{2}}` = `BT0001`.
5. Add a button of type URL call-to-action:
   - Button text: `TRACK ORDER`
   - URL type: Dynamic
   - Base URL: `https://beantradition.in/track/`
   - URL variable `{{1}}` sample: a tracking token, for example `sample-tracking-token`
   - The full button url is the base plus the dynamic suffix, so it resolves to `https://beantradition.in/track/<token>`.
6. Submit for review.

Placeholder mapping:

| Placeholder | Filled with |
| --- | --- |
| Body `{{1}}` | Customer name (falls back to "there" if empty) |
| Body `{{2}}` | Order number, for example BT0001 |
| Button URL `{{1}}` | Tracking token appended to `https://beantradition.in/track/` |

## Template 2: order ready

1. Name it `order_ready` (this must match `WHATSAPP_READY_TEMPLATE`).
2. Category: Utility. Language: English.
3. Body text (use one `{{1}}` placeholder):
   ```
   Your Bean Tradition order {{1}} is ready ☕
   Please collect it from the Bean Tradition counter.
   ```
4. Provide a sample value, for example `{{1}}` = `BT0001`.
5. Add the same URL call-to-action button:
   - Button text: `TRACK ORDER`
   - URL type: Dynamic
   - Base URL: `https://beantradition.in/track/`
   - URL variable `{{1}}` sample: a tracking token
6. Submit for review.

Placeholder mapping:

| Placeholder | Filled with |
| --- | --- |
| Body `{{1}}` | Order number, for example BT0001 |
| Button URL `{{1}}` | Tracking token appended to `https://beantradition.in/track/` |

## How the backend fills the templates

The backend sends body parameters and one URL button suffix per template. The base URL for the button lives in the template itself; the backend only supplies the dynamic suffix (the tracking token).

| Template | Env var | Body parameters (in order) | Button URL suffix |
| --- | --- | --- | --- |
| `order_confirmation` | `WHATSAPP_CONFIRMATION_TEMPLATE` | `[customer_name, order_number]` | tracking token |
| `order_ready` | `WHATSAPP_READY_TEMPLATE` | `[order_number]` | tracking token |

Important rules:

1. The parameter count must match exactly. The confirmation body has two parameters; the ready body has one. A mismatch causes a template error and the message will not send.
2. The button base url is `https://beantradition.in/track/` and the dynamic suffix is the tracking token, so the customer link is `https://beantradition.in/track/<token>`. This matches `FRONTEND_URL` plus `/track/`. If you change `FRONTEND_URL`, update the template base url to match.
3. Keep the template names in Meta identical to the env var values. If you rename a template in Meta, update `WHATSAPP_CONFIRMATION_TEMPLATE` or `WHATSAPP_READY_TEMPLATE`.
4. Keep the language code aligned with `WHATSAPP_TEMPLATE_LANGUAGE`.

## Waiting for approval

1. New templates go into an In review state. Approval is usually quick for Utility templates but can take up to about 24 hours, sometimes longer during busy periods.
2. Create and submit both templates several days before the event so there is time to fix any rejection.
3. You cannot send a template until it is Approved. If you try, the backend receives a template error (code 132001, template does not exist, or a related code) and staff see "WhatsApp template not approved or parameters mismatch."
4. If a template is rejected, read the reason in WhatsApp Manager, adjust the copy or category, and resubmit. Common rejection causes are wrong category (marketing instead of utility) or promotional language.
5. Test both approved templates end to end before the event with `WHATSAPP_SEND_ENABLED=true` and a real number.

## Quick verification

1. Both templates show Approved in WhatsApp Manager.
2. Template names match `WHATSAPP_CONFIRMATION_TEMPLATE` and `WHATSAPP_READY_TEMPLATE`.
3. Language matches `WHATSAPP_TEMPLATE_LANGUAGE`.
4. Each template has a URL call-to-action button labelled TRACK ORDER with base url `https://beantradition.in/track/`.
5. A test order produces a confirmation message, and moving it to READY produces a ready message, both with working TRACK ORDER buttons.
