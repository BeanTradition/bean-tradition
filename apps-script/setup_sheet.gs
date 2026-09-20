/**
 * Bean Tradition Event Ordering System
 * ------------------------------------
 * One-time spreadsheet setup helper.
 *
 * Run setupSpreadsheet() ONCE from the Apps Script editor after opening the
 * script from the "Bean Tradition Event Orders" Sheet. It is idempotent:
 * running it again ensures structure without wiping existing order rows.
 *
 * It:
 *   1. Ensures the Orders tab exists with the exact A..Y header row
 *      (bold + frozen).
 *   2. Ensures the Settings tab exists with the seed key/value rows.
 *   3. Ensures the Counters tab exists with A1 = 0.
 *   4. Applies a Data Validation dropdown to Orders col M (Status).
 *   5. Applies optional conditional-format colours to col M.
 *
 * IMPORTANT: Business logic never depends on the cell COLOURS. The colours
 * are purely a visual aid for staff; the backend and the status webhook key
 * on the text value in col M only.
 */

/** Exact Orders header row, columns A..Y, in order. */
var ORDERS_HEADERS = [
  'Order ID',                    // A
  'Order Number',                // B
  'Tracking Token',              // C
  'Created At',                  // D
  'Customer Name',              // E
  'Mobile',                      // F
  'Items JSON',                  // G
  'Items Display',              // H
  'Quantity Total',              // I
  'Notes',                       // J
  'Amount',                      // K
  'Payment Method',              // L
  'Status',                      // M
  'Confirmation Message Status', // N
  'Confirmation Meta Message ID',// O
  'Ready Message Status',        // P
  'Ready Meta Message ID',       // Q
  'Created By',                  // R
  'Updated At',                  // S
  'Ready At',                    // T
  'Delivered At',                // U
  'Idempotency Key',             // V
  'Confirmation Last Attempt',   // W
  'Ready Message Last Attempt',  // X
  'Last Messaging Error'         // Y
];

/** Allowed status values (drive the col M dropdown). */
var STATUS_VALUES = ['RECEIVED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

/** Seed rows for the Settings tab: [key, value]. */
var SETTINGS_SEED = [
  ['Brand Name', 'Bean Tradition'],
  ['Order Prefix', 'BT'],
  ['Default Country Code', '+91'],
  ['Initial Order Status', 'PREPARING'],
  ['Queue Display Limit', 20],
  ['Tracking Poll Interval', 3000],
  ['WhatsApp Template Language', 'en'],
  ['Event Name', 'Bean Tradition College Event']
];

/** 1-based index of the Status column (M). */
var SETUP_STATUS_COLUMN = 13;


/**
 * Entry point. Run this once.
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var orders = ensureOrdersSheet_(ss);
  ensureSettingsSheet_(ss);
  ensureCountersSheet_(ss);
  applyStatusValidation_(orders);
  applyStatusConditionalFormats_(orders);

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Bean Tradition setup complete.', 'Setup', 5);
  Logger.log('setupSpreadsheet: done.');
}


/* =========================================================================
 * Orders tab
 * =======================================================================*/

/**
 * Ensures the Orders tab exists with the exact A..Y header row, bold and
 * frozen. Existing data rows are left untouched.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss The spreadsheet.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The Orders sheet.
 */
function ensureOrdersSheet_(ss) {
  var sheet = ss.getSheetByName('Orders');
  if (!sheet) {
    sheet = ss.insertSheet('Orders');
  }

  // Write the header row (A1:Y1) exactly.
  var headerRange = sheet.getRange(1, 1, 1, ORDERS_HEADERS.length);
  headerRange.setValues([ORDERS_HEADERS]);
  headerRange.setFontWeight('bold');

  // Freeze the header row.
  sheet.setFrozenRows(1);

  return sheet;
}


/* =========================================================================
 * Settings tab
 * =======================================================================*/

/**
 * Ensures the Settings tab exists with key in col A and value in col B.
 * Existing keys are preserved; only missing seed keys are added.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss The spreadsheet.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The Settings sheet.
 */
function ensureSettingsSheet_(ss) {
  var sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
  }

  // Collect existing keys already present in column A.
  var existingKeys = {};
  var lastRow = sheet.getLastRow();
  if (lastRow >= 1) {
    var keyCol = sheet.getRange(1, 1, lastRow, 1).getValues();
    for (var r = 0; r < keyCol.length; r++) {
      var k = keyCol[r][0];
      if (k !== '' && k !== null && k !== undefined) {
        existingKeys[String(k).trim()] = true;
      }
    }
  }

  // Append any seed keys that are not present yet.
  var toAppend = [];
  for (var i = 0; i < SETTINGS_SEED.length; i++) {
    var key = SETTINGS_SEED[i][0];
    if (!existingKeys[key]) {
      toAppend.push(SETTINGS_SEED[i]);
    }
  }

  if (toAppend.length > 0) {
    var start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, toAppend.length, 2).setValues(toAppend);
  }

  return sheet;
}


/* =========================================================================
 * Counters tab
 * =======================================================================*/

/**
 * Ensures the Counters tab exists and A1 holds an integer. If A1 is empty or
 * non-numeric it is initialised to 0. An existing numeric sequence is left
 * as-is so a re-run never resets order numbering.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss The spreadsheet.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The Counters sheet.
 */
function ensureCountersSheet_(ss) {
  var sheet = ss.getSheetByName('Counters');
  if (!sheet) {
    sheet = ss.insertSheet('Counters');
  }

  var cell = sheet.getRange('A1');
  var current = parseInt(cell.getValue(), 10);
  if (isNaN(current)) {
    cell.setValue(0);
  }

  return sheet;
}


/* =========================================================================
 * Status column: validation + colours
 * =======================================================================*/

/**
 * Applies a dropdown Data Validation to col M (Status) for the data rows.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} orders The Orders sheet.
 */
function applyStatusValidation_(orders) {
  var maxRows = orders.getMaxRows();
  // Rows 2..end (skip header).
  var numRows = Math.max(0, maxRows - 1);
  if (numRows === 0) {
    return;
  }

  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_VALUES, true) // true => show dropdown
    .setAllowInvalid(false)
    .setHelpText('Choose a status: ' + STATUS_VALUES.join(', '))
    .build();

  orders.getRange(2, SETUP_STATUS_COLUMN, numRows, 1).setDataValidation(rule);
}

/**
 * Applies optional conditional-format colours to col M so staff can scan the
 * queue quickly. Colours are decorative only; logic keys on the text value.
 *
 *   RECEIVED  -> neutral (light grey-blue)
 *   PREPARING -> yellow
 *   READY     -> green
 *   DELIVERED -> grey
 *   CANCELLED -> red
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} orders The Orders sheet.
 */
function applyStatusConditionalFormats_(orders) {
  var maxRows = orders.getMaxRows();
  var numRows = Math.max(0, maxRows - 1);
  if (numRows === 0) {
    return;
  }

  var range = orders.getRange(2, SETUP_STATUS_COLUMN, numRows, 1);

  // Map of status -> {background, fontColor}.
  var colourMap = [
    { value: 'RECEIVED',  bg: '#E8EAED', fg: '#202124' }, // neutral grey
    { value: 'PREPARING', bg: '#FFF2CC', fg: '#7F6000' }, // yellow
    { value: 'READY',     bg: '#D9EAD3', fg: '#274E13' }, // green
    { value: 'DELIVERED', bg: '#CCCCCC', fg: '#333333' }, // grey
    { value: 'CANCELLED', bg: '#F4CCCC', fg: '#990000' }  // red
  ];

  // Rebuild the col M conditional-format rules, preserving rules that target
  // other ranges.
  var existing = orders.getConditionalFormatRules();
  var kept = [];
  var thisA1 = range.getA1Notation();
  for (var i = 0; i < existing.length; i++) {
    var ranges = existing[i].getRanges();
    var touchesStatus = false;
    for (var j = 0; j < ranges.length; j++) {
      if (ranges[j].getColumn() === SETUP_STATUS_COLUMN) {
        touchesStatus = true;
        break;
      }
    }
    if (!touchesStatus) {
      kept.push(existing[i]);
    }
  }

  for (var k = 0; k < colourMap.length; k++) {
    var c = colourMap[k];
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(c.value)
      .setBackground(c.bg)
      .setFontColor(c.fg)
      .setRanges([range])
      .build();
    kept.push(rule);
  }

  orders.setConditionalFormatRules(kept);
}
