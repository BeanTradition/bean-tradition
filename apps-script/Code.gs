/**
 * Bean Tradition Event Ordering System
 * ------------------------------------
 * Bound Apps Script (V8 runtime) for the Google Sheet
 * "Bean Tradition Event Orders".
 *
 * This file contains TWO independent capabilities:
 *
 *   (a) ORDER NUMBER COUNTER web app  -> doPost(e)
 *       A concurrency-safe sequence generator the FastAPI backend calls
 *       to obtain the next order number. Protected by a shared secret.
 *
 *   (b) onEdit STATUS LISTENER        -> onStatusEdit(e)
 *       An installable "On edit" trigger that watches the Status column
 *       (col M) on the Orders tab and forwards real status changes to the
 *       FastAPI internal webhook. This is the emergency fallback path so
 *       staff can move an order forward straight from the Sheet dropdown.
 *
 * Script Properties used (File > Project Settings > Script Properties):
 *   ORDER_NUMBER_SECRET   Shared secret for the counter web app (doPost).
 *                         Must equal FastAPI env ORDER_NUMBER_SCRIPT_SECRET.
 *   BACKEND_URL           Base URL of the FastAPI backend, no trailing slash,
 *                         e.g. https://api.example.com
 *   SHEET_WEBHOOK_SECRET  Shared secret for the status webhook.
 *                         Must equal FastAPI env SHEET_WEBHOOK_SECRET.
 *
 * Sheet layout (Orders tab, columns A..Y):
 *   A Order ID              N Confirmation Message Status
 *   B Order Number          O Confirmation Meta Message ID
 *   C Tracking Token        P Ready Message Status
 *   D Created At            Q Ready Meta Message ID
 *   E Customer Name         R Created By
 *   F Mobile               S Updated At
 *   G Items JSON            T Ready At
 *   H Items Display         U Delivered At
 *   I Quantity Total        V Idempotency Key
 *   J Notes                 W Confirmation Last Attempt
 *   K Amount                X Ready Message Last Attempt
 *   L Payment Method        Y Last Messaging Error
 *   M Status
 */

/* =========================================================================
 * Shared constants
 * =======================================================================*/

/** Name of the tab that stores order rows. */
var ORDERS_SHEET_NAME = 'Orders';

/** Name of the tab whose A1 cell holds the integer sequence. */
var COUNTERS_SHEET_NAME = 'Counters';

/** 1-based index of the Status column (M). */
var STATUS_COLUMN = 13; // M

/** 1-based index of the Order Number column (B). */
var ORDER_NUMBER_COLUMN = 2; // B

/** 1-based index of the Updated At column (S). */
var UPDATED_AT_COLUMN = 19; // S

/** Lock timeout for the counter, in milliseconds. */
var LOCK_TIMEOUT_MS = 20000; // 20s

/** Timeout for the outbound webhook call, in milliseconds. */
var WEBHOOK_TIMEOUT_MS = 10000; // 10s


/* =========================================================================
 * (a) ORDER NUMBER COUNTER web app
 * =======================================================================*/

/**
 * Web App entry point. Deployed as a Web App (Execute as: me,
 * Who has access: Anyone). The FastAPI backend POSTs a JSON body:
 *
 *   { "secret": "<ORDER_NUMBER_SECRET>" }
 *
 * On success it returns:
 *
 *   { "sequence": <int> }
 *
 * Concurrency safety is guaranteed by LockService.getScriptLock(): only one
 * execution can read-modify-write Counters!A1 at a time, so two simultaneous
 * orders can never receive the same number.
 *
 * @param {GoogleAppsScript.Events.DoPost} e The POST event.
 * @return {GoogleAppsScript.Content.TextOutput} JSON response.
 */
function doPost(e) {
  // ---- Parse the JSON body defensively. ----
  var body;
  try {
    body = (e && e.postData && e.postData.contents)
      ? JSON.parse(e.postData.contents)
      : {};
  } catch (parseErr) {
    return jsonOutput({ error: 'invalid_json' });
  }

  // ---- Verify the shared secret BEFORE touching the counter. ----
  var expectedSecret = PropertiesService
    .getScriptProperties()
    .getProperty('ORDER_NUMBER_SECRET');

  var providedSecret = (body && typeof body.secret === 'string')
    ? body.secret
    : '';

  if (!expectedSecret || !constantTimeEquals(providedSecret, expectedSecret)) {
    // Reject without incrementing.
    return jsonOutput({ error: 'unauthorized' });
  }

  // ---- Acquire the script lock and do a safe read-modify-write. ----
  var lock = LockService.getScriptLock();
  var haveLock = false;
  try {
    haveLock = lock.tryLock(LOCK_TIMEOUT_MS);
    if (!haveLock) {
      return jsonOutput({ error: 'busy' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var counters = ss.getSheetByName(COUNTERS_SHEET_NAME);
    if (!counters) {
      return jsonOutput({ error: 'counters_sheet_missing' });
    }

    var cell = counters.getRange('A1');
    var current = parseInt(cell.getValue(), 10);
    if (isNaN(current)) {
      current = 0; // default when empty / non-numeric
    }

    var next = current + 1;
    cell.setValue(next);
    // Flush so the write is committed before the lock is released.
    SpreadsheetApp.flush();

    return jsonOutput({ sequence: next });
  } catch (err) {
    return jsonOutput({ error: 'internal_error', detail: String(err) });
  } finally {
    // Always release the lock, even on error, so the app never wedges.
    if (haveLock) {
      lock.releaseLock();
    }
  }
}

/**
 * Simple GET handler so the deployment URL can be health-checked in a
 * browser without exposing the counter. Never increments.
 *
 * @param {GoogleAppsScript.Events.DoGet} e The GET event.
 * @return {GoogleAppsScript.Content.TextOutput} JSON response.
 */
function doGet(e) {
  return jsonOutput({ ok: true, service: 'bean-tradition-order-number-counter' });
}


/* =========================================================================
 * (b) onEdit STATUS LISTENER (installable trigger)
 * =======================================================================*/

/**
 * Installable "On edit" trigger handler.
 *
 * IMPORTANT: This must be installed as an INSTALLABLE trigger
 * (Triggers > Add Trigger > onStatusEdit > From spreadsheet > On edit),
 * NOT a simple onEdit(e) function, because simple triggers cannot call
 * external URLs with UrlFetchApp.
 *
 * Behaviour:
 *   - Acts only on the Orders tab, column M (Status), non-header rows.
 *   - Ignores no-op edits where the value did not actually change.
 *   - Stamps col S (Updated At) with an ISO-8601 timestamp.
 *   - POSTs { order_number, status, secret } to
 *       ${BACKEND_URL}/api/internal/sheet-status-change
 *     with the secret ALSO sent as header X-Sheet-Secret.
 *   - Never throws: any failure is logged so the staff member's edit
 *     is never blocked. The backend owns the decision to send the Ready
 *     WhatsApp message and dedupes on its side.
 *
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e The edit event.
 */
function onStatusEdit(e) {
  try {
    if (!e || !e.range) {
      return;
    }

    var range = e.range;
    var sheet = range.getSheet();

    // Only the Orders tab.
    if (sheet.getName() !== ORDERS_SHEET_NAME) {
      return;
    }

    // Only the Status column (M).
    if (range.getColumn() !== STATUS_COLUMN) {
      return;
    }

    // Skip the header row.
    var row = range.getRow();
    if (row <= 1) {
      return;
    }

    // Only forward real changes. e.value is the new value; e.oldValue the
    // previous one. If they are equal, there is nothing to forward.
    var newStatus = (e.value !== undefined && e.value !== null)
      ? String(e.value).trim()
      : '';
    var oldStatus = (e.oldValue !== undefined && e.oldValue !== null)
      ? String(e.oldValue).trim()
      : '';

    if (newStatus === '') {
      return; // status cleared, nothing meaningful to forward
    }
    if (newStatus === oldStatus) {
      return; // no-op edit (same value re-entered)
    }

    // Read the order number for this row (col B).
    var orderNumber = sheet
      .getRange(row, ORDER_NUMBER_COLUMN)
      .getValue();
    orderNumber = (orderNumber === null || orderNumber === undefined)
      ? ''
      : String(orderNumber).trim();

    // Stamp Updated At (col S) with an ISO-8601 timestamp.
    var nowIso = new Date().toISOString();
    sheet.getRange(row, UPDATED_AT_COLUMN).setValue(nowIso);

    if (orderNumber === '') {
      // No order number to key on; the timestamp is still written, but we
      // cannot usefully notify the backend.
      Logger.log('onStatusEdit: row %s has empty Order Number; skipping webhook.', row);
      return;
    }

    // Forward to the FastAPI internal webhook.
    forwardStatusChange(orderNumber, newStatus);
  } catch (err) {
    // Never rethrow: keep the staff edit unblocked.
    Logger.log('onStatusEdit error: %s', err);
  }
}

/**
 * POSTs a status change to the FastAPI internal webhook.
 * All errors are logged, never thrown.
 *
 * @param {string} orderNumber The order number (col B).
 * @param {string} status The new status value (col M).
 */
function forwardStatusChange(orderNumber, status) {
  var props = PropertiesService.getScriptProperties();
  var backendUrl = props.getProperty('BACKEND_URL');
  var secret = props.getProperty('SHEET_WEBHOOK_SECRET');

  if (!backendUrl || !secret) {
    Logger.log('forwardStatusChange: missing BACKEND_URL or SHEET_WEBHOOK_SECRET script property.');
    return;
  }

  // Normalise: strip any trailing slash on the base URL.
  var base = backendUrl.replace(/\/+$/, '');
  var url = base + '/api/internal/sheet-status-change';

  var payload = {
    order_number: orderNumber,
    status: status,
    secret: secret
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    // Send the secret in a header too, so the backend can verify either way.
    headers: { 'X-Sheet-Secret': secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true, // do not throw on non-2xx
    followRedirects: true,
    validateHttpsCertificates: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      Logger.log(
        'forwardStatusChange: webhook returned %s for order %s -> %s. Body: %s',
        code, orderNumber, status, response.getContentText()
      );
    }
  } catch (err) {
    // Network / timeout failure. Log and move on; edit stays unblocked.
    Logger.log('forwardStatusChange: fetch failed for order %s -> %s: %s',
      orderNumber, status, err);
  }
}


/* =========================================================================
 * Helpers
 * =======================================================================*/

/**
 * Builds a JSON TextOutput response.
 *
 * @param {Object} obj The object to serialize.
 * @return {GoogleAppsScript.Content.TextOutput} JSON output.
 */
function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Constant-time-ish string comparison to reduce timing-attack signal on the
 * shared secret. Compares every character regardless of early mismatch.
 * Length differences short-circuit (their timing leak is not meaningful for
 * a fixed-length secret).
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @return {boolean} True if equal.
 */
function constantTimeEquals(a, b) {
  a = String(a);
  b = String(b);
  if (a.length !== b.length) {
    return false;
  }
  var mismatch = 0;
  for (var i = 0; i < a.length; i++) {
    mismatch |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  }
  return mismatch === 0;
}
