# Wedding invitations: Mehndi, Baraat, Walima

Three separate invitation pages, one per event. Each has its own RSVP, so a guest
only sees the event(s) whose link they receive.

| Event  | Page                        | Theme                         |
| ------ | --------------------------- | ----------------------------- |
| Mehndi | `mehndi-36yn1z8/index.html` | Turmeric yellow, bottle green |
| Baraat | `baraat/index.html`         | Maroon and gold               |
| Walima | `walima-d1pclbd/index.html` | Cream, navy and gold          |

Everyone is invited to the Baraat, so it has a simple path. Mehndi and Walima are for
selected guests, so their folders have a random suffix: `/mehndi/` and `/walima/` don't
exist, and the links can't be guessed. (The repo is public, so this keeps casual visitors
out; it isn't a password.) To change a link, rename the folder.

The root page lists no events on purpose.

## Editing

- **Names / initials**: `assets/couple.js`
- **Everything about one event** (wording, date, venue, map pin, programme, dress code,
  music, image): the `EDIT THIS EVENT` JSON block inside that event's `index.html`.
  In the wording, `**Name**` makes a name bold and keeps it on one line.
- `"schedule": []` hides the programme section; `"rsvpBy": ""` hides the deadline.

## Personal links

Add `?to=Name&n=Seats` to any event link:

```
https://<site>/baraat/?to=Ali%20Khan&n=4
```

Shows "Dear Ali Khan", "4 seats reserved", pre-fills the RSVP name and caps guests at 4.
Add `&lang=ur` to open in Urdu.

## RSVPs → one Google Sheet (a tab per event + Summary)

1. Create a new Google Sheet (e.g. "Wedding RSVPs").
2. **Extensions → Apps Script**, replace everything in `Code.gs` with
   `tools/rsvp-apps-script.gs`, then **Save**.
3. **Deploy → New deployment →** gear icon **→ Web app**.
   Execute as: **Me**. Who has access: **Anyone**. **Deploy**, then allow the permissions.
4. Copy the **Web app URL** (ends in `/exec`) into `assets/couple.js` → `rsvpEndpoint`.

Replies appear in the Mehndi / Baraat / Walima tabs; **Summary** shows totals.
If you edit the script later: Deploy → Manage deployments → edit → New version
(the URL stays the same).

## Music

Each event's `"music"` plays a YouTube clip on loop:
`{ "youtube": "VIDEO_ID", "start": 29, "end": 83, "volume": 0.7 }` (seconds).
It starts when the guest taps the seal; the button in the top bar mutes it.
An `.mp3` also works: `{ "src": "../assets/music/song.mp3" }`.
