/* ============================================================
   Wedding invitation renderer.
   Reads window.COUPLE (assets/couple.js) and the event's own
   <script id="event-data" type="application/json"> block, then
   builds the page. Personal links: ?to=Guest%20Name&n=4
   ============================================================ */
(function () {
  "use strict";

  const COUPLE = window.COUPLE;
  const EVENT = JSON.parse(document.getElementById("event-data").textContent);
  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || "").trim().slice(0, 80);
  const seats = clampInt(params.get("n"), 1, 50, 0); // 0 = not specified
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Storage (never required for the page to work) ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  let lang = params.get("lang") === "ur" || params.get("lang") === "en"
    ? params.get("lang")
    : (store.get("invite.lang") || EVENT.defaultLang || "en");

  // ---------- UI strings ----------
  const STR = {
    en: {
      dear: "Dear",
      invited: "You are cordially invited to the",
      ayahTrans: "“And We created you in pairs.” · An-Naba 78:8",
      tap: "Tap the seal to open",
      openInvite: "Open invitation",
      rsvp: "RSVP",
      reply: "Reply now",
      map: "Directions",
      openMap: "Open in Google Maps",
      googleCal: "Google Calendar",
      appleCal: "Apple / Outlook",
      date: "Date", time: "Time", venue: "Venue",
      onwards: "onwards",
      details: "When & where",
      countdownTitle: "Counting the days",
      days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
      today: "The day has arrived. Alhamdulillah.",
      past: "Jazakallah khair for celebrating with us.",
      schedule: "Programme",
      dress: "Dress code",
      rsvpTitle: "Kindly reply",
      rsvpBy: "Kindly respond by",
      reserved: (n) => `We have reserved ${n} ${n === 1 ? "seat" : "seats"} in your honour`,
      name: "Your name", namePh: "Full name", nameErr: "Please enter your name.",
      attend: "Will you be joining us?",
      yes: "Yes, In sha Allah", no: "Regretfully, no",
      attendErr: "Please choose one.",
      guests: "Number of guests (including you)",
      guestsMax: (n) => `Up to ${n} for your invitation`,
      phone: "Phone number", phonePh: "Optional, e.g. 0300 1234567",
      message: "Duas & message", messagePh: "Optional",
      send: "Send reply", sending: "Sending…",
      thanks: "Jazakallah khair",
      thanksYes: "Your reply has been received. We look forward to welcoming you, In sha Allah.",
      thanksNo: "Your reply has been received. You will be missed. Please keep us in your duas.",
      change: "Change my reply",
      notReady: "Replies aren't open yet. Please contact the family directly.",
      failed: "Couldn't send your reply. Please check your connection and try again.",
      viaWhatsApp: "Your reply will open in WhatsApp. Please press send there.",
      dua: "May Allah bless them both and unite them in goodness.",
      privateNote: "This invitation is personal. Please don't forward it.",
      lang: "Language"
    },
    ur: {
      dear: "محترم",
      invited: "آپ کو دلی محبت کے ساتھ مدعو کیا جاتا ہے",
      ayahTrans: "اور ہم نے تمہیں جوڑوں کی صورت میں پیدا کیا۔ · سورۃ النبا ۷۸:۸",
      tap: "کھولنے کے لیے مہر کو چھوئیں",
      openInvite: "دعوت نامہ کھولیں",
      rsvp: "جواب",
      reply: "جواب دیں",
      map: "راستہ",
      openMap: "گوگل میپس میں کھولیں",
      googleCal: "گوگل کیلنڈر",
      appleCal: "ایپل / آؤٹ لک",
      date: "تاریخ", time: "وقت", venue: "مقام",
      onwards: "سے آغاز",
      details: "کب اور کہاں",
      countdownTitle: "دن گنے جا رہے ہیں",
      days: "دن", hours: "گھنٹے", minutes: "منٹ", seconds: "سیکنڈ",
      today: "الحمدللہ، آج وہ مبارک دن ہے۔",
      past: "ہمارے ساتھ خوشیوں میں شریک ہونے کا شکریہ۔ جزاک اللہ خیر",
      schedule: "پروگرام",
      dress: "لباس",
      rsvpTitle: "براہِ کرم جواب دیں",
      rsvpBy: "براہِ کرم جواب دیں، آخری تاریخ",
      reserved: (n) => `آپ کے لیے ${fmtNum(n)} نشستیں مخصوص ہیں`,
      name: "آپ کا نام", namePh: "پورا نام", nameErr: "براہِ کرم اپنا نام لکھیں۔",
      attend: "کیا آپ تشریف لائیں گے؟",
      yes: "جی ہاں، ان شاء اللہ", no: "معذرت، نہیں",
      attendErr: "براہِ کرم ایک انتخاب کریں۔",
      guests: "مہمانوں کی تعداد (آپ سمیت)",
      guestsMax: (n) => `آپ کی دعوت میں زیادہ سے زیادہ ${fmtNum(n)}`,
      phone: "فون نمبر", phonePh: "اختیاری",
      message: "دعائیں اور پیغام", messagePh: "اختیاری",
      send: "جواب بھیجیں", sending: "بھیجا جا رہا ہے…",
      thanks: "جزاک اللہ خیر",
      thanksYes: "آپ کا جواب موصول ہو گیا۔ ان شاء اللہ آپ کا انتظار رہے گا۔",
      thanksNo: "آپ کا جواب موصول ہو گیا۔ آپ کی کمی محسوس ہو گی، اپنی دعاؤں میں یاد رکھیے گا۔",
      change: "جواب تبدیل کریں",
      notReady: "جوابات ابھی شروع نہیں ہوئے۔ براہِ کرم اہلِ خانہ سے رابطہ کریں۔",
      failed: "جواب نہیں بھیجا جا سکا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔",
      viaWhatsApp: "آپ کا جواب واٹس ایپ میں کھلے گا، وہاں بھیجیں دبائیں۔",
      dua: "اللہ تعالیٰ دونوں کو برکت دے اور خیر کے ساتھ جمع رکھے۔",
      privateNote: "یہ دعوت نامہ ذاتی ہے، براہِ کرم آگے نہ بھیجیں۔",
      lang: "زبان"
    }
  };
  const t = (k, ...a) => { const v = STR[lang][k]; return typeof v === "function" ? v(...a) : v; };
  const L = (v) => (v && typeof v === "object" ? (v[lang] || v.en || "") : (v || ""));

  // ---------- Helpers ----------
  function clampInt(v, min, max, dflt) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const locale = () => (lang === "ur" ? "ur-PK-u-nu-arabext" : "en-GB");
  function fmtNum(n) { return new Intl.NumberFormat(locale()).format(n); }
  const start = new Date(`${EVENT.start}${COUPLE.utcOffset}`);
  const end = new Date(`${EVENT.end || EVENT.start}${COUPLE.utcOffset}`);
  function fmtDate(d, opts) { return new Intl.DateTimeFormat(locale(), { timeZone: COUPLE.timeZone, ...opts }).format(d); }
  const longDate = (d) => fmtDate(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const shortDate = (d) => fmtDate(d, { day: "numeric", month: "long", year: "numeric" });
  function timeOf(d) {
    if (lang !== "ur") return fmtDate(d, { hour: "numeric", minute: "2-digit", hour12: true });
    // Urdu reads naturally as "شام ۷ بجے" rather than "PM 7:00"
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: COUPLE.timeZone, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(d);
    const h = +parts.find((p) => p.type === "hour").value, m = +parts.find((p) => p.type === "minute").value;
    const period = h < 5 ? "رات" : h < 12 ? "صبح" : h < 16 ? "دوپہر" : h < 19 ? "شام" : "رات";
    const h12 = h % 12 || 12;
    return `${period} ${fmtNum(h12)}${m ? `:${fmtNum(String(m).padStart(2, "0")).padStart(2, "۰")}` : ""} بجے`;
  }
  function timeFromHHMM(hhmm) { return timeOf(new Date(`${EVENT.start.slice(0, 10)}T${hhmm}:00${COUPLE.utcOffset}`)); }

  const venue = EVENT.venue || {};
  const venueText = () => `${venue.name.en}, ${venue.address?.en || venue.city?.en || ""}`;
  // Google's official cross-platform Maps URL: opens the app on phones and the named place on desktop.
  // ("mapQuery" overrides the name if Google ever resolves it to the wrong place.)
  function mapLink() {
    const q = venue.mapQuery || `${venue.name.en}, ${venue.city?.en || ""}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  function mapEmbed() {
    // Search by venue name so Google shows its marker; the coordinates keep the view centred on the right spot
    const q = venue.mapQuery || `${venue.name.en}, ${venue.city?.en || ""}`;
    const ll = venue.lat && venue.lng ? `&ll=${venue.lat},${venue.lng}` : "";
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}${ll}&z=16&output=embed`;
  }
  const couplePlain = () => `${COUPLE.bride.en} & ${COUPLE.groom.en}`;
  const eventTitleEn = () => `${EVENT.title.en} of ${couplePlain()}`;

  function calUTC(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function googleCal() {
    const q = new URLSearchParams({
      action: "TEMPLATE", text: eventTitleEn(),
      dates: `${calUTC(start)}/${calUTC(end)}`,
      details: `${location.href.split("?")[0]}\n${mapLink()}`,
      location: venueText()
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  }
  function downloadICS() {
    const icsEsc = (s) => String(s).replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invite//EN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${EVENT.id}-${calUTC(start)}@invite`,
      `DTSTAMP:${calUTC(new Date())}`,
      `DTSTART:${calUTC(start)}`, `DTEND:${calUTC(end)}`,
      `SUMMARY:${icsEsc(eventTitleEn())}`,
      `LOCATION:${icsEsc(venueText())}`,
      `URL:${location.href.split("?")[0]}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(eventTitleEn())}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${EVENT.id}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------- Artwork (original SVG) ----------
  const ICON = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>',
    check: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="25"/><path class="check" d="M21 33l7 7 15-15"/></svg>',
    // Ornamental divider: 8-point star flanked by tapering lines and dots
    ornament: '<svg class="ornament" viewBox="0 0 240 24" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<path d="M4 12h84M152 12h84" stroke-width=".8"/><path d="M60 12h40M140 12h40" stroke-width="1.6"/>' +
      '<circle cx="104" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="136" cy="12" r="1.8" fill="currentColor" stroke="none"/>' +
      '<g transform="translate(120 12)" stroke-width="1"><rect x="-7" y="-7" width="14" height="14"/><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)"/><circle r="2.2" fill="currentColor" stroke="none"/></g></svg>',
    // Mughal arch frame; the outer line draws itself on entry
    arch: '<svg class="frame" viewBox="0 0 400 560" preserveAspectRatio="none" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<path class="draw" pathLength="1" vector-effect="non-scaling-stroke" stroke-width="1.4" d="M8 552V214C8 128 116 76 200 10c84 66 192 118 192 204v338z"/>' +
      '<path vector-effect="non-scaling-stroke" stroke-width=".7" opacity=".55" d="M22 538V220c0-78 100-124 178-186 78 62 178 108 178 186v318z"/>' +
      // Dome finial: stem, bead and a small crescent
      '<g opacity=".85"><path vector-effect="non-scaling-stroke" stroke-width="1" d="M200 10V-6"/><circle cx="200" cy="-9" r="3" fill="currentColor" stroke="none"/>' +
      '<path vector-effect="non-scaling-stroke" stroke-width="1.1" d="M196 -22a6 6 0 1 0 8 0a4.6 4.6 0 1 1 -8 0z" fill="currentColor"/></g>' +
      '</svg>',
    lantern: '<svg class="lantern" viewBox="0 0 40 150" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true">' +
      '<defs><radialGradient id="lg" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".95"/><stop offset=".6" stop-color="#f3b64a" stop-opacity=".35"/><stop offset="1" stop-color="#f3b64a" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="M20 0v56"/><circle cx="20" cy="58" r="2"/>' +
      '<path d="M13 66h14l-3-6h-8z"/><path d="M11 66c-5 12-5 34 0 48h18c5-14 5-36 0-48z"/>' +
      '<ellipse class="flame" cx="20" cy="90" rx="13" ry="20" fill="url(#lg)" stroke="none"/>' +
      '<path d="M20 66v48M15 68c-2 14-2 30 0 44M25 68c2 14 2 30 0 44" stroke-width=".7"/>' +
      '<path d="M12 114h16l-3 7h-10z"/><path d="M20 121v10"/><path d="M17 131h6l-3 12z" fill="currentColor"/>' +
      '</svg>',
    doorL: '<svg viewBox="0 0 200 800" preserveAspectRatio="none" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<path vector-effect="non-scaling-stroke" stroke-width="1.2" d="M14 14H200M14 14V786H200"/>' +
      '<path vector-effect="non-scaling-stroke" stroke-width="1" d="M34 770V260C34 170 110 120 186 70V770z"/>' +
      '<path vector-effect="non-scaling-stroke" stroke-width=".6" opacity=".6" d="M46 758V266C46 186 114 140 176 96V758z"/>' +
      '</svg>',
    doorR: '<svg viewBox="0 0 200 800" preserveAspectRatio="none" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<path vector-effect="non-scaling-stroke" stroke-width="1.2" d="M186 14H0M186 14V786H0"/>' +
      '<path vector-effect="non-scaling-stroke" stroke-width="1" d="M166 770V260C166 170 90 120 14 70V770z"/>' +
      '<path vector-effect="non-scaling-stroke" stroke-width=".6" opacity=".6" d="M154 758V266C154 186 86 140 24 96V758z"/>' +
      '</svg>'
  };

  // Islamic rosette: rings of petals and interlaced squares, generated so it stays crisp at any size
  function rosette() {
    const g = [];
    for (let i = 0; i < 16; i++) g.push(`<ellipse cx="100" cy="46" rx="9" ry="30" transform="rotate(${i * 22.5} 100 100)"/>`);
    for (let i = 0; i < 4; i++) g.push(`<rect x="52" y="52" width="96" height="96" transform="rotate(${i * 22.5} 100 100)"/>`);
    for (let i = 0; i < 32; i++) g.push(`<circle cx="100" cy="6" r="1.6" fill="currentColor" transform="rotate(${i * 11.25} 100 100)"/>`);
    return `<svg class="rosette" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width=".6" aria-hidden="true">
      <circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="88" stroke-dasharray="2 3"/>
      <circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="22"/>${g.join("")}</svg>`;
  }
  // Marigold garland strand (genda lari): alternating orange/yellow blooms with green leaves
  function garland(len) {
    const blooms = [];
    for (let i = 0; i < len; i++) {
      const y = 10 + i * 17, c = i % 2 ? "#f6b324" : "#e8741a";
      blooms.push(`<circle cx="9" cy="${y}" r="7.2" fill="${c}"/><circle cx="9" cy="${y}" r="7.2" fill="none" stroke="#a84f08" stroke-width=".6" stroke-dasharray="1.5 1.5"/><circle cx="9" cy="${y}" r="2.2" fill="#a84f08" opacity=".55"/>`);
      if (i % 3 === 2) blooms.push(`<path d="M9 ${y + 8} q8 2 9 8 q-8 0 -9 -8z" fill="#0e5135"/>`);
    }
    const h = 20 + len * 17;
    return `<svg class="garland" viewBox="0 0 18 ${h}" style="height:${h * 1.1}px" aria-hidden="true"><path d="M9 0V${h}" stroke="#0e5135" stroke-width=".8"/>${blooms.join("")}<path d="M5 ${h - 8}h8l-4 10z" fill="#0e5135"/></svg>`;
  }
  const frieze = '<div class="frieze" aria-hidden="true"></div>';
  // Gold ring around the medallion: a circle that draws itself, an outer ring of dots and petals
  function medallionRing() {
    const dots = [], petals = [];
    for (let i = 0; i < 48; i++) dots.push(`<circle cx="100" cy="3" r="1.3" transform="rotate(${i * 7.5} 100 100)"/>`);
    for (let i = 0; i < 24; i++) petals.push(`<path d="M100 9q4 5 0 10q-4-5 0-10z" transform="rotate(${i * 15} 100 100)"/>`);
    return `<svg class="m-ring" viewBox="0 0 200 200" aria-hidden="true">
      <g class="m-spin" fill="currentColor">${dots.join("")}${petals.join("")}</g>
      <circle class="m-draw" cx="100" cy="100" r="85" pathLength="1" fill="none" stroke="currentColor" stroke-width=".8"/>
      <circle cx="100" cy="100" r="81" fill="none" stroke="currentColor" stroke-width=".4" opacity=".6"/></svg>`;
  }
  function hangings() {
    if (EVENT.id === "mehndi") {
      const left = [10, 6, 8, 4, 6], right = [6, 4, 8, 6, 10];
      return `<div class="garlands" aria-hidden="true"><div class="g-side">${left.map(garland).join("")}</div><div class="g-side">${right.map(garland).join("")}</div></div>`;
    }
    return `<div class="lanterns" aria-hidden="true">${ICON.lantern.repeat(4)}</div>`;
  }

  // ---------- Render ----------
  let opened = !!store.sget(`invite.opened.${EVENT.id}`) || location.hash === "#rsvp";

  function render() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.title = lang === "ur"
      ? `${EVENT.title.ur} | ${COUPLE.bride.ur} و ${COUPLE.groom.ur}`
      : `${EVENT.title.en} | ${couplePlain()}`;

    const groom = esc(L(COUPLE.groom)), bride = esc(L(COUPLE.bride));
    const amp = lang === "ur" ? "و" : "&amp;";
    const title = esc(L(EVENT.title));

    document.getElementById("app").innerHTML = `
      ${opened ? "" : coverHTML(groom, bride, amp, title)}
      <header class="bar">
        <div class="wrap bar-inner">
          <a class="mono" href="#top" aria-label="${title}">${esc(COUPLE.initials)}</a>
          <div class="bar-actions">
            ${musicButtonHTML()}
            <div class="seg" role="group" aria-label="${t("lang")}">
              <button type="button" data-lang="en" aria-pressed="${lang === "en"}">EN</button>
              <button type="button" class="ur" data-lang="ur" aria-pressed="${lang === "ur"}">اردو</button>
            </div>
            <a class="btn small" href="#rsvp">${t("rsvp")}</a>
          </div>
        </div>
      </header>

      <main id="top">
        <section class="hero">
          ${hangings()}
          <div class="wrap">
            <div class="arch">
              ${rosette()}
              ${ICON.arch}
              <p class="arabic bismillah write" lang="ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              ${EVENT.heroImage ? `<figure class="hero-art rise" style="--i:1"><img src="${esc(EVENT.heroImage.src)}" alt="${esc(L(EVENT.heroImage.alt))}" width="900" height="1200" decoding="async" fetchpriority="high"></figure>` : ""}
              <p class="eyebrow rise" style="--i:1">${title}</p>
              <h1 class="names rise" style="--i:2"><span class="foil shine">${bride}</span><span class="amp">${amp}</span><span class="foil shine">${groom}</span></h1>
              <p class="event-name rise" style="--i:3">${esc(L(EVENT.tagline))}</p>
            </div>
            <p class="when rise" style="--i:4"><span>${esc(longDate(start))}<span class="sep" aria-hidden="true">${lang === "ur" ? "|" : "·"}</span>${esc(timeOf(start))}</span><span class="city">${esc(L(venue.name))}</span><span class="addr">${esc(L(venue.address) || L(venue.city))}</span></p>
            ${seats ? `<p class="reserved rise" style="--i:5">${esc(t("reserved", seats))}</p>` : ""}
            <div class="btn-row rise" style="--i:5">
              <a class="btn" href="#rsvp">${ICON.mail}${t("reply")}</a>
            </div>
          </div>
        </section>

        ${frieze}
        <section class="invite center">
          <div class="wrap reveal">
            ${ICON.ornament}
            ${invitationHTML(EVENT.invitation)}
            ${EVENT.verse ? verseHTML(EVENT.verse) : ""}
          </div>
        </section>
        ${frieze}

        <section class="details" aria-labelledby="details-h">
          <div class="wrap">
            <div class="sec-head reveal">
              ${ICON.ornament}
              <p class="eyebrow">${t("details")}</p>
              <h2 class="display" id="details-h">${esc(L(venue.name))}</h2>
            </div>
            <div class="facts reveal">
              <div class="card fact corners" style="--k:0">${ICON.cal.replace("<svg", '<svg class="ico"')}<p class="label">${t("date")}</p><p class="value">${esc(shortDate(start))}</p><p class="sub">${esc(fmtDate(start, { weekday: "long" }))}</p></div>
              <div class="card fact corners" style="--k:1">${ICON.clock.replace("<svg", '<svg class="ico"')}<p class="label">${t("time")}</p><p class="value">${esc(timeOf(start))}</p><p class="sub">${EVENT.timeNote ? esc(L(EVENT.timeNote)) : t("onwards")}</p></div>
              <div class="card fact corners" style="--k:2">${ICON.pin.replace("<svg", '<svg class="ico"')}<p class="label">${t("venue")}</p><p class="value">${esc(L(venue.name))}</p><p class="sub">${esc(L(venue.address) || L(venue.city))}</p></div>
            </div>
            <div class="reveal">
              <div class="map"><iframe title="${esc(L(venue.name))}" src="${esc(mapEmbed())}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
              <div class="btn-row actions">
                <a class="btn ghost" href="${esc(mapLink())}" target="_blank" rel="noopener">${ICON.pin}${t("openMap")}</a>
                <a class="btn ghost" href="${esc(googleCal())}" target="_blank" rel="noopener">${ICON.cal}${t("googleCal")}</a>
                <button class="btn ghost" type="button" data-action="ics">${ICON.cal}${t("appleCal")}</button>
              </div>
            </div>
          </div>
        </section>

        ${frieze}
        <section class="center reveal" aria-labelledby="cd-h">
          <h2 class="display" id="cd-h">${t("countdownTitle")}</h2>
          <div class="wrap" id="countdown"></div>
        </section>
        ${frieze}

        ${EVENT.schedule && EVENT.schedule.length ? `
        <section aria-labelledby="sch-h">
          <div class="wrap">
            <div class="sec-head reveal">${ICON.ornament}<h2 class="display" id="sch-h">${t("schedule")}</h2></div>
            <ol class="timeline reveal">
              ${EVENT.schedule.map((s) => `
                <li><time>${esc(timeFromHHMM(s.time))}</time>
                  <div><h3>${esc(L(s.title))}</h3>${s.note ? `<p>${esc(L(s.note))}</p>` : ""}</div></li>`).join("")}
            </ol>
          </div>
        </section>` : ""}

        ${EVENT.dressCode ? `
        <section class="center" aria-labelledby="dress-h">
          <div class="wrap">
            <div class="sec-head reveal">${ICON.ornament}<h2 class="display" id="dress-h">${t("dress")}</h2></div>
            <div class="reveal">
              <p class="lead">${esc(L(EVENT.dressCode.text))}</p>
              ${EVENT.dressCode.colors ? `<div class="swatches">${EVENT.dressCode.colors.map((c) =>
                `<span class="swatch"><i style="background:${esc(c.hex)}"></i>${esc(L(c.name))}</span>`).join("")}</div>` : ""}
            </div>
          </div>
        </section>` : ""}

        <section class="rsvp" id="rsvp" aria-labelledby="rsvp-h">
          <div class="wrap">
            <div class="sec-head reveal">
              ${ICON.ornament}
              <h2 class="display" id="rsvp-h">${t("rsvpTitle")}</h2>
              ${EVENT.rsvpBy ? `<p class="muted" style="margin:0">${t("rsvpBy")} ${esc(shortDate(new Date(`${EVENT.rsvpBy}T12:00:00${COUPLE.utcOffset}`)))}</p>` : ""}
            </div>
            <div class="reveal"><div class="card corners" id="rsvp-card"></div></div>
          </div>
        </section>
      </main>

      <footer>
        ${ICON.ornament}
        <p class="arabic dua" lang="ar">بَارَكَ اللَّهُ لَهُمَا وَبَارَكَ عَلَيْهِمَا وَجَمَعَ بَيْنَهُمَا فِي خَيْرٍ</p>
        <p>${t("dua")}</p>
        <span class="mono">${esc(COUPLE.initials)}</span>
        <p>${t("privateNote")}</p>
      </footer>`;

    renderRSVP();
    startCountdown();
    wire();
  }

  function coverHTML(groom, bride, amp, title) {
    return `
      <div class="cover" id="cover" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="glow"></div>
        <div class="door l">${ICON.doorL}<i class="knob"></i></div>
        <div class="door r">${ICON.doorR}<i class="knob"></i></div>
        <div class="cover-inner">
          <p class="arabic bism dim" lang="ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p class="arabic ayah dim" lang="ar">وَخَلَقْنَاكُمْ أَزْوَاجًا</p>
          <p class="trans dim">${t("ayahTrans")}</p>
          ${guest ? `<p class="dear dim">${t("dear")} ${esc(guest)},</p>` : ""}
          <div class="seal-stage">
            <span class="ripple" aria-hidden="true"></span><span class="ripple r2" aria-hidden="true"></span>
            <button class="seal" type="button" data-action="open" aria-label="${t("openInvite")}"><span>${esc(COUPLE.initials.replace(/\s/g, ""))}</span></button>
            <div class="medallion" aria-live="polite">
              ${medallionRing()}
              <p class="m-item eyebrow" style="--d:0">${title}</p>
              <p class="m-item m-names" style="--d:1"><span>${bride}</span><span class="amp">${amp}</span><span>${groom}</span></p>
              <p class="m-item m-date" style="--d:2">${esc(shortDate(start))}</p>
            </div>
          </div>
          <button class="tap-pill dim" type="button" data-action="open">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>${t("tap")}
          </button>
          <p class="eyebrow dim">${t("invited")} ${title}</p>
        </div>
      </div>`;
  }

  // **Name** in the wording becomes a bold, unbreakable name in the theme colour
  // {{couple}} becomes "Bride with Groom" on a line of its own that never wraps
  const coupleLine = () => lang === "ur"
    ? `<strong class="couple-line">${esc(COUPLE.bride.ur)} ہمراہ ${esc(COUPLE.groom.ur)}</strong>`
    : `<strong class="couple-line">${esc(COUPLE.bride.en)} <em>with</em> ${esc(COUPLE.groom.en)}</strong>`;
  const rich = (s) => esc(s)
    .replace(/\s*\{\{couple\}\}\s*/g, () => coupleLine())
    .replace(/\*\*(.+?)\*\*/g, '<strong class="nm">$1</strong>');
  function invitationHTML(inv) {
    if (!inv.hosts) return `<p class="lead inv-body">${rich(L(inv))}</p>`;
    return `<div class="invitation">
      <p class="inv-intro">${esc(L(inv.intro))}</p>
      <p class="inv-hosts">${esc(L(inv.hosts))}</p>
      <p class="lead inv-body">${rich(L(inv.body))}</p>
    </div>`;
  }

  function verseHTML(v) {
    return `<div class="verse-card"><div class="verse">
      <p class="arabic" lang="ar">${esc(v.arabic)}</p>
      <p class="translation">${esc(L(v.translation))}</p>
      <p class="ref">${esc(L(v.ref))}</p>
    </div></div>`;
  }

  // ---------- Countdown ----------
  let cdTimer;
  function startCountdown() {
    clearInterval(cdTimer);
    const el = document.getElementById("countdown");
    const tick = () => {
      const now = Date.now();
      if (now >= end.getTime()) { el.innerHTML = `<p class="lead">${t("past")}</p>`; clearInterval(cdTimer); return; }
      if (now >= start.getTime() - 12 * 3600e3) { el.innerHTML = `<p class="lead">${t("today")}</p>`; return; }
      let s = Math.max(0, Math.floor((start.getTime() - now) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      el.innerHTML = `<div class="countdown" role="timer">
        ${[[d, "days"], [h, "hours"], [m, "minutes"], [s, "seconds"]].map(([v, k]) =>
          `<div class="card"><b>${fmtNum(v)}</b><small>${t(k)}</small></div>`).join("")}
      </div>`;
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  // ---------- RSVP ----------
  const draft = { name: guest, attending: "", guests: seats || 1, phone: "", message: "" };
  const doneKey = `invite.rsvp.${EVENT.id}`;

  function renderRSVP() {
    const card = document.getElementById("rsvp-card");
    const prev = store.get(doneKey);
    if (prev) {
      let p = {};
      try { p = JSON.parse(prev); } catch (e) {}
      card.innerHTML = `<div class="done" aria-live="polite">${ICON.check}
        <h3>${t("thanks")}</h3>
        <p class="muted">${p.attending === "yes" ? t("thanksYes") : t("thanksNo")}</p>
        <button class="linkish" type="button" data-action="change">${t("change")}</button></div>`;
      return;
    }
    const maxGuests = seats || EVENT.rsvp?.maxGuests || 10;
    card.innerHTML = `
      <form id="rsvp-form" novalidate>
        <div class="hp" aria-hidden="true"><label>Leave empty <input name="company" tabindex="-1" autocomplete="off"></label></div>
        <label class="field" data-f="name">
          <span>${t("name")}</span>
          <input class="input" name="name" autocomplete="name" placeholder="${t("namePh")}" value="${esc(draft.name)}" enterkeyhint="next" required>
          <small class="err">${t("nameErr")}</small>
        </label>
        <fieldset class="field" data-f="attending">
          <legend>${t("attend")}</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="attending" value="yes" ${draft.attending === "yes" ? "checked" : ""}>${t("yes")}</label>
            <label class="choice"><input type="radio" name="attending" value="no" ${draft.attending === "no" ? "checked" : ""}>${t("no")}</label>
          </div>
          <small class="err">${t("attendErr")}</small>
        </fieldset>
        <div class="collapse" id="yes-only" ${draft.attending === "no" ? "hidden" : ""}><div>
          <div class="field">
            <span id="g-label">${t("guests")}</span>
            <div class="stepper" role="group" aria-labelledby="g-label">
              <button type="button" data-step="-1" aria-label="−">−</button>
              <output id="g-out" aria-live="polite">${fmtNum(draft.guests)}</output>
              <button type="button" data-step="1" aria-label="+">+</button>
            </div>
            ${seats ? `<p class="hint">${t("guestsMax", maxGuests)}</p>` : ""}
          </div>
        </div></div>
        <label class="field">
          <span>${t("phone")}</span>
          <input class="input" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${t("phonePh")}" value="${esc(draft.phone)}" dir="ltr">
        </label>
        <label class="field">
          <span>${t("message")}</span>
          <textarea class="input" name="message" placeholder="${t("messagePh")}" rows="3">${esc(draft.message)}</textarea>
        </label>
        <button class="btn submit" type="submit">${t("send")}</button>
        <p class="form-error" id="form-error" role="alert" hidden></p>
      </form>`;

    const form = card.querySelector("form");
    const out = card.querySelector("#g-out");
    const syncStepper = () => {
      out.textContent = fmtNum(draft.guests);
      card.querySelector('[data-step="-1"]').disabled = draft.guests <= 1;
      card.querySelector('[data-step="1"]').disabled = draft.guests >= maxGuests;
    };
    syncStepper();
    card.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
      draft.guests = Math.min(maxGuests, Math.max(1, draft.guests + Number(b.dataset.step)));
      syncStepper();
    }));
    form.addEventListener("input", (e) => {
      const f = e.target;
      if (f.name in draft) draft[f.name] = f.value;
      if (f.name === "attending") card.querySelector("#yes-only").hidden = f.value === "no";
      f.closest(".field")?.classList.remove("invalid");
    });
    form.addEventListener("submit", onSubmit);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const errEl = form.querySelector("#form-error");
    errEl.hidden = true;
    if (form.company.value) return; // bot

    let ok = true;
    if (!draft.name.trim()) { form.querySelector('[data-f="name"]').classList.add("invalid"); ok = false; }
    if (!draft.attending) { form.querySelector('[data-f="attending"]').classList.add("invalid"); ok = false; }
    if (!ok) { form.querySelector(".invalid input")?.focus(); return; }

    const cfg = EVENT.rsvp || {};
    const answer = {
      name: draft.name.trim(),
      attending: draft.attending,
      guests: draft.attending === "yes" ? draft.guests : 0,
      phone: draft.phone.trim(),
      message: draft.message.trim()
    };
    const btn = form.querySelector(".submit");
    btn.disabled = true; btn.textContent = t("sending");

    try {
      if (COUPLE.rsvpEndpoint) {
        // Google Apps Script web app; it sends no CORS headers, so the response is opaque but the row is written.
        const body = new URLSearchParams({
          event: EVENT.id, name: answer.name, attending: answer.attending,
          guests: String(answer.guests), phone: answer.phone, message: answer.message,
          invited: guest, seats: seats ? String(seats) : "", company: form.company.value
        });
        // Apps Script often takes 3–6 s to answer. keepalive lets the request finish even if the guest
        // leaves the page, so show the thank-you once it's under way (an offline failure still rejects fast).
        const req = fetch(COUPLE.rsvpEndpoint, { method: "POST", mode: "no-cors", body, keepalive: true });
        await Promise.race([req, new Promise((r) => setTimeout(r, 1800))]);
      } else if (cfg.googleForm && cfg.googleForm.action && !/XXXX/.test(cfg.googleForm.action)) {
        const gf = cfg.googleForm, f = gf.fields, body = new URLSearchParams();
        body.append(f.name, answer.name);
        body.append(f.attending, answer.attending === "yes" ? gf.yesValue : gf.noValue);
        if (f.guests) body.append(f.guests, String(answer.guests));
        if (f.phone) body.append(f.phone, answer.phone);
        if (f.message) body.append(f.message, answer.message);
        if (f.invitedAs) body.append(f.invitedAs, guest ? `${guest}${seats ? ` (${seats})` : ""}` : "");
        // Google Forms sends no CORS headers; an opaque response still means it was received.
        await fetch(gf.action, { method: "POST", mode: "no-cors", body });
      } else if (cfg.whatsapp) {
        const lines = [
          `RSVP: ${eventTitleEn()}`,
          `Name: ${answer.name}`,
          `Attending: ${answer.attending === "yes" ? `Yes (${answer.guests})` : "No"}`,
          answer.phone && `Phone: ${answer.phone}`,
          answer.message && `Message: ${answer.message}`
        ].filter(Boolean).join("\n");
        window.open(`https://wa.me/${cfg.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(lines)}`, "_blank", "noopener");
      } else {
        throw new Error("not-configured");
      }
      store.set(doneKey, JSON.stringify(answer));
      renderRSVP();
    } catch (err) {
      errEl.textContent = err.message === "not-configured" ? t("notReady") : t("failed");
      errEl.hidden = false;
      btn.disabled = false; btn.textContent = t("send");
    }
  }

  // ---------- Wiring ----------
  function wire() {
    const app = document.getElementById("app");
    if (document.getElementById("cover")) {
      document.body.classList.add("locked");
      document.querySelector(".seal").focus({ preventScroll: true });
    } else {
      document.body.classList.add("entered");
    }

    app.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.lang === lang) return;
      lang = b.dataset.lang;
      store.set("invite.lang", lang);
      const y = scrollY;
      render();
      scrollTo(0, y);
      app.querySelectorAll(".reveal, .frieze").forEach((r) => r.classList.add("in"));
    }));

    // Scroll reveal: once, never blocks content
    const items = app.querySelectorAll(".reveal, .frieze");
    if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    items.forEach((i) => io.observe(i));
  }

  document.getElementById("app").addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]");
    if (!a) return;
    if (a.dataset.action === "open") openCover();
    if (a.dataset.action === "ics") downloadICS();
    if (a.dataset.action === "music") (music.playing || music.wantPlay ? pauseMusic() : playMusic());
    if (a.dataset.action === "change") {
      try { Object.assign(draft, JSON.parse(store.get(doneKey))); draft.guests = draft.guests || 1; } catch (er) {}
      store.del(doneKey);
      renderRSVP();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("cover")) { revealSeal(); openDoors(); }
  });

  // ---------- Music ----------
  // Two sources: an mp3 ("src") or a YouTube clip ("youtube" + "start"/"end" seconds).
  // It starts on the seal tap (browsers only allow sound after a tap); the bar button toggles it.
  const M = EVENT.music || {};
  const hasMusic = !!(M.src || M.youtube);
  const music = { playing: false, ready: false, wantPlay: false, vol: 0, fadeId: 0 };
  let audio, yt;

  function musicButtonHTML() {
    if (!hasMusic) return "";
    return `<button class="snd${music.playing ? " playing" : ""}" type="button" data-action="music" aria-label="${music.playing ? "Mute music" : "Play music"}" aria-pressed="${music.playing}">
      <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`;
  }
  function syncMusicButton() {
    const b = document.querySelector(".snd");
    if (!b) return;
    b.classList.toggle("playing", music.playing);
    b.setAttribute("aria-pressed", music.playing);
    b.setAttribute("aria-label", music.playing ? "Mute music" : "Play music");
  }
  const target = () => Math.round((M.volume ?? 0.6) * 100);
  function setVol(v) {
    music.vol = v;
    if (audio) audio.volume = v / 100;
    if (yt && yt.setVolume) yt.setVolume(v);
  }
  function fadeTo(to, ms, done) {
    const id = ++music.fadeId, from = music.vol, t0 = performance.now();
    const step = (now) => {
      if (id !== music.fadeId) return;
      const k = Math.min(1, (now - t0) / ms);
      setVol(from + (to - from) * k);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  }

  function setupMusic() {
    if (!hasMusic) return;
    if (M.src) {
      audio = new Audio(M.src);
      audio.loop = true; audio.preload = "auto"; audio.volume = 0;
      audio.addEventListener("play", () => { music.playing = true; syncMusicButton(); });
      audio.addEventListener("pause", () => { music.playing = false; syncMusicButton(); });
      music.ready = true;
      return;
    }
    // YouTube IFrame API: the player is created on page load so it's ready the moment the seal is tapped
    const holder = document.createElement("div");
    holder.className = "yt-holder";
    holder.setAttribute("aria-hidden", "true");
    holder.innerHTML = '<div id="yt-player"></div>';
    document.body.appendChild(holder);
    const start = M.start || 0, end = M.end || undefined;
    window.onYouTubeIframeAPIReady = () => {
      yt = new YT.Player("yt-player", {
        width: 200, height: 200, videoId: M.youtube,
        host: "https://www.youtube-nocookie.com",
        playerVars: { start, end, autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3 },
        events: {
          onReady: () => { music.ready = true; setVol(0); if (music.wantPlay) playMusic(); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) { music.playing = true; syncMusicButton(); }
            if (e.data === YT.PlayerState.PAUSED) { music.playing = false; syncMusicButton(); }
            if (e.data === YT.PlayerState.ENDED) { yt.seekTo(start, true); yt.playVideo(); } // loop the clip
          }
        }
      });
      const f = yt.getIframe && yt.getIframe();
      if (f) f.setAttribute("allow", "autoplay; encrypted-media");
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }
  function playMusic() {
    store.sset("invite.music", "on");
    music.wantPlay = true;
    if (!music.ready) return;
    if (audio) audio.play().catch(() => {});
    if (yt) { yt.unMute(); yt.playVideo(); }
    fadeTo(target(), 2000);
  }
  function pauseMusic() {
    store.sset("invite.music", "off");
    music.wantPlay = false;
    music.playing = false; syncMusicButton();
    fadeTo(0, 450, () => { if (audio) audio.pause(); if (yt) yt.pauseVideo(); });
  }

  // Opening sequence: tap the seal → it bursts into a gold medallion with the couple's names →
  // after a pause (or another tap) the doors swing open and the page animates in.
  let revealTimer;
  function openCover() {
    const cover = document.getElementById("cover");
    if (!cover) return;
    if (cover.classList.contains("revealing")) { openDoors(); return; }
    revealSeal();
    revealTimer = setTimeout(openDoors, reduceMotion ? 2200 : 3800);
  }
  function revealSeal() {
    const cover = document.getElementById("cover");
    if (!cover || cover.classList.contains("revealing")) return;
    if (store.sget("invite.music") !== "off") playMusic();
    cover.classList.add("revealing");
    // Any further tap on the cover skips straight to the doors
    setTimeout(() => cover.addEventListener("click", openDoors, { once: true }), 500);
  }
  function openDoors() {
    clearTimeout(revealTimer);
    const cover = document.getElementById("cover");
    if (!cover || cover.classList.contains("opening")) return;
    opened = true;
    store.sset(`invite.opened.${EVENT.id}`, "1");
    cover.classList.add("opening");
    const doorTime = reduceMotion ? 400 : 1500;
    setTimeout(() => {
      document.body.classList.remove("locked");
      document.body.classList.add("entered");
      cover.classList.add("gone");
      if (!reduceMotion) petals();
    }, doorTime * 0.75);
    setTimeout(() => cover.remove(), doorTime + 800);
  }

  // ---------- Petals: a short, gentle shower after the doors open ----------
  const PETALS = {
    mehndi: ["#f2a21b", "#f7c548", "#e8771a", "#ffd76b", "#1d7a50"],
    baraat: ["#9e1b32", "#c2304a", "#7a1022", "#e3c07a"],
    walima: ["#ffffff", "#f3ead6", "#e6cf98", "#c9d3ea"]
  };
  function petals() {
    const colors = PETALS[EVENT.id] || PETALS.walima;
    const c = document.createElement("canvas");
    c.id = "petals";
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    size(); addEventListener("resize", size);
    const count = innerWidth < 600 ? 26 : 44;
    const ps = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.9,
      r: 5 + Math.random() * 6,
      vy: 0.9 + Math.random() * 1.2,
      sway: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.04,
      color: colors[i % colors.length]
    }));
    let t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = 0;
      for (const p of ps) {
        p.y += p.vy;
        p.x += Math.sin(t * p.sway + p.phase) * 0.7;
        p.rot += p.vr;
        if (p.y > innerHeight + 20) continue;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 1.6 + p.phase))); // tumbling
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.8, p.r * 0.7, 0, p.r);
        ctx.bezierCurveTo(-p.r * 0.8, p.r * 0.7, -p.r, -p.r * 0.6, 0, -p.r);
        ctx.fill();
        ctx.restore();
      }
      if (alive) requestAnimationFrame(frame);
      else { removeEventListener("resize", size); c.remove(); }
    }
    requestAnimationFrame(frame);
  }

  render();
  setupMusic();
})();
