/**
 * Wedding RSVPs → Google Sheet
 *
 * Paste this whole file into your Sheet: Extensions → Apps Script → replace Code.gs → Save.
 * Then Deploy → New deployment → type "Web app":
 *   Execute as: Me      Who has access: Anyone
 * Copy the Web app URL (ends in /exec) and put it in assets/couple.js → rsvpEndpoint.
 *
 * Each event gets its own tab (Mehndi, Baraat, Walima) plus a "Summary" tab with totals.
 */

const TABS = { mehndi: "Mehndi", baraat: "Baraat", walima: "Walima" };
const HEADERS = ["Time", "Name", "Attending", "Guests", "Phone", "Message", "Invite link name", "Seats reserved"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    if (p.company) return ok(); // honeypot: bots fill this, people don't
    const tab = TABS[p.event];
    if (!tab) return ok();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ensureTab(ss, tab);
    sheet.appendRow([
      new Date(),
      clean(p.name),
      p.attending === "yes" ? "Yes" : "No",
      p.attending === "yes" ? Math.max(1, Math.min(50, Number(p.guests) || 1)) : 0,
      clean(p.phone),
      clean(p.message),
      clean(p.invited),
      clean(p.seats)
    ]);
    ensureSummary(ss);
    return ok();
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to check it's deployed.
function doGet() { return ContentService.createTextOutput("RSVP endpoint is running."); }

function ok() { return ContentService.createTextOutput("ok"); }

// Stops a guest's text from being run as a spreadsheet formula, and caps length.
function clean(v) {
  const s = String(v == null ? "" : v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function ensureTab(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sh.getRange("A:A").setNumberFormat("d mmm yyyy, h:mm am/pm");
  }
  return sh;
}

function ensureSummary(ss) {
  if (ss.getSheetByName("Summary")) return;
  const sh = ss.insertSheet("Summary", 0);
  sh.appendRow(["Event", "Replies", "Coming (families)", "Guests coming", "Not coming"]);
  Object.keys(TABS).forEach(function (k, i) {
    const t = TABS[k], r = i + 2;
    sh.getRange(r, 1, 1, 5).setFormulas([[
      '="' + t + '"',
      "=IFERROR(COUNTA('" + t + "'!B2:B),0)",
      "=IFERROR(COUNTIF('" + t + "'!C2:C,\"Yes\"),0)",
      "=IFERROR(SUMIF('" + t + "'!C2:C,\"Yes\",'" + t + "'!D2:D),0)",
      "=IFERROR(COUNTIF('" + t + "'!C2:C,\"No\"),0)"
    ]]);
  });
  sh.getRange(1, 1, 1, 5).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.getRange(6, 1).setValue("Note: if someone changes their reply, both rows appear. Use the latest one.");
}

// Optional: run once from the editor (▶ Run → setup) to create all tabs up front.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (k) { ensureTab(ss, TABS[k]); });
  ensureSummary(ss);
}
