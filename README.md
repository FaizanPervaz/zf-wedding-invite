# Wedding invitations: Mehndi, Baraat, Walima

Three separate invitation pages, one per event. Each has its own RSVP, so a guest
only sees the event(s) whose link they receive.

| Event  | Page                | Theme                        |
| ------ | ------------------- | ---------------------------- |
| Mehndi | `mehndi/index.html` | Turmeric yellow, bottle green |
| Baraat | `baraat/index.html` | Maroon and gold              |
| Walima | `walima/index.html` | Cream, navy and gold         |

The root page lists no events on purpose.

## Editing

- **Names / initials**: `assets/couple.js`
- **Everything about one event** (wording, date, venue, map pin, programme, dress code,
  RSVP form, music, image): the `EDIT THIS EVENT` JSON block inside that event's `index.html`.
- `"schedule": []` hides the programme section; `"rsvpBy": ""` hides the deadline.

## Personal links

Add `?to=Name&n=Seats` to any event link:

```
https://<site>/baraat/?to=Ali%20Khan&n=4
```

Shows "Dear Ali Khan", "4 seats reserved", pre-fills the RSVP name and caps guests at 4.
Add `&lang=ur` to open in Urdu.

## RSVPs → Google Sheets (one form per event)

1. Create a Google Form for the event with these **short-answer** questions:
   Name, Attending, Guests, Phone, Message, Invited as.
2. Form ⋮ menu → **Get pre-filled link** → type `Yes` in Attending and something in the
   others → **Get link**. The link contains `entry.123456=...` for every question.
3. In that event's JSON set `rsvp.googleForm`:
   - `action`: the form URL with `/viewform…` replaced by `/formResponse`
   - `fields`: the matching `entry.` numbers
4. **Responses** tab → link to Sheets. Repeat for each event.

Alternative: leave the form `action` as is and set `"whatsapp": "923001234567"`; replies
then open in WhatsApp to that number.

## Music

Put an `.mp3` in `assets/music/` and set `"music": { "src": "../assets/music/baraat.mp3" }`.
It starts when the guest taps the seal; a button bottom-right pauses it.
