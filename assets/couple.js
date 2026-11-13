// Shared details used on every event page.
// Event-specific details (date, venue, RSVP form) live inside each event's own
// index.html, so a guest invited to one event never downloads another event's details.
window.COUPLE = {
  groom: { en: "M. Zaid Tahir", ur: "محمد زید طاہر" },
  bride: { en: "Fizza Pervez", ur: "فضہ پرویز" },
  initials: "F & Z",
  // Shown in the footer. Leave "" to hide.
  hashtag: "",
  // Google Sheet RSVP web app URL (ends in /exec). See tools/rsvp-apps-script.gs.
  rsvpEndpoint: "https://script.google.com/macros/s/AKfycbz0cozx7c8_Ttxy0e0wOPxO-VhUo7Sf90EzlXW5BWRPnMrNAyjfjFfcvZUkyhHL2pwS-Q/exec",
  // Time zone of the events (used for the countdown and calendar links).
  timeZone: "Asia/Karachi",
  utcOffset: "+05:00"
};
