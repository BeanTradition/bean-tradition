# Google Cloud setup

This guide creates the Google Cloud project and service account the backend uses to read and write the Bean Tradition spreadsheet. The backend authenticates as a service account, so no human Google login is needed at runtime.

You need a Google account with permission to create a project (or an existing project you can use). This is a one-time setup.

## Overview

1. Create or pick a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a service account.
4. Generate a JSON key.
5. Copy `client_email` and `private_key` into the backend env.
6. Share the spreadsheet with the service account as Editor.
7. Set `GOOGLE_SHEET_ID`.
8. Test access.

## 1. Create or pick a project

1. Go to https://console.cloud.google.com/.
2. Open the project picker in the top bar, then select New Project.
3. Name it, for example `bean-tradition`, and create it.
4. Make sure the new project is selected in the top bar before continuing.

## 2. Enable the Google Sheets API

1. Go to APIs and Services, then Library.
2. Search for "Google Sheets API".
3. Open it and click Enable.

You do not need the Google Drive API for this system. The backend addresses the spreadsheet by id and does not list or search Drive.

## 3. Create a service account

1. Go to APIs and Services, then Credentials.
2. Click Create Credentials, then Service account.
3. Give it a name, for example `bean-tradition-sheets`.
4. Skip the optional role and access steps (project roles are not needed; access is granted by sharing the spreadsheet directly).
5. Click Done.

The service account now has an email that looks like:

```
bean-tradition-sheets@bean-tradition.iam.gserviceaccount.com
```

This is the value for `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

## 4. Generate a JSON key

1. In Credentials, click the service account you just created.
2. Open the Keys tab.
3. Click Add Key, then Create new key.
4. Choose JSON and click Create. A `.json` file downloads.

Treat this file as a secret. It grants write access to any spreadsheet the service account can reach. Do not commit it to git and do not paste it into the frontend.

The JSON looks like this (trimmed):

```json
{
  "type": "service_account",
  "project_id": "bean-tradition",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN...\n-----END PRIVATE KEY-----\n",
  "client_email": "bean-tradition-sheets@bean-tradition.iam.gserviceaccount.com",
  "client_id": "...",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## 5. Extract client_email and private_key into the backend env

The backend does not read the JSON file directly. It reads two values from environment variables:

| JSON field | Backend env var |
| --- | --- |
| `client_email` | `GOOGLE_SERVICE_ACCOUNT_EMAIL` |
| `private_key` | `GOOGLE_PRIVATE_KEY` |

Set the email exactly as it appears:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=bean-tradition-sheets@bean-tradition.iam.gserviceaccount.com
```

### Newline handling for the private key

The `private_key` value in the JSON contains real newlines. In a `.env` file you have two safe options:

1. **Keep the literal `\n` escapes on a single line.** This is the format that appears inside the JSON string. The backend converts every literal `\n` back into a real newline at load time, so this works directly:
   ```
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN...\n-----END PRIVATE KEY-----\n
   ```
2. **Use real newlines wrapped in double quotes.** Some hosting dashboards prefer this. Paste the multi-line key inside quotes:
   ```
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
   MIIEvQIBADAN...
   -----END PRIVATE KEY-----
   "
   ```

Common mistakes to avoid:

1. Do not double-escape. If your platform already stores real newlines, do not also add literal `\n`.
2. Keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines intact.
3. Keep the trailing newline after the END line.

## 6. Share the spreadsheet with the service account

The service account can only reach spreadsheets that are shared with it.

1. Build or open the spreadsheet (see [google-sheet-setup.md](google-sheet-setup.md)).
2. Click Share.
3. Paste the service account email (`GOOGLE_SERVICE_ACCOUNT_EMAIL`).
4. Set the role to Editor.
5. Turn off "Notify people" and share.

Editor is required because the backend writes new order rows, updates message statuses, and increments the counter cell.

## 7. Set the spreadsheet id

The spreadsheet id is the long segment in the sheet url:

```
https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit#gid=0
```

Set it in the backend env:

```
GOOGLE_SHEET_ID=1AbCdEfGhIJklMNOpQrStUvWxYz0123456789
```

## 8. Test access

1. Set all three values in `backend/.env`:
   ```
   GOOGLE_SHEET_ID=...
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...
   ```
2. Start the backend:
   ```
   uvicorn app.main:app --reload
   ```
3. Check health at http://localhost:8000/api/health. When credentials are valid you will see:
   ```json
   { "dependencies": { "google_sheets": "configured" } }
   ```
   If it shows `in-memory-fallback`, one of the three values is missing or blank.
4. Confirm a real read and write. Create a test order from the app, or call `POST /api/orders` from the docs page, and verify a new row appears in the Orders tab and the Counters cell increments.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Health shows `in-memory-fallback` | One of the three Google env vars is blank | Set `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` |
| Permission or 403 error in logs | Spreadsheet not shared with the service account | Share it as Editor with the service account email |
| Key parse or padding error | Broken newlines in `GOOGLE_PRIVATE_KEY` | Re-copy the key, keep `\n` escapes or use quoted real newlines |
| Sheets API disabled error | API not enabled on the project | Enable the Google Sheets API in the Library |
| Reads work but the wrong data appears | Wrong `GOOGLE_SHEET_ID` | Copy the id from the target spreadsheet url |

## Next steps

Continue to [google-sheet-setup.md](google-sheet-setup.md) to build the Orders, Settings, and Counters tabs.
