// Shared details used on every event page.
// Event-specific details (date, venue, RSVP form) live inside each event's own
// index.html, so a guest invited to one event never downloads another event's details.
window.COUPLE = {
  groom: { en: "M. Zaid Tahir", ur: "محمد زید طاہر" },
  bride: { en: "Fizza Pervez", ur: "فضہ پرویز" },
  initials: "Z & F",
  // Shown in the footer. Leave "" to hide.
  hashtag: "",
  // Time zone of the events (used for the countdown and calendar links).
  timeZone: "Asia/Karachi",
  utcOffset: "+05:00"
};
