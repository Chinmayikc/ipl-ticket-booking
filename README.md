# IPL Ticket Booking

## Run the React app

From this repository root:

```powershell
npm run dev
```

Open `http://127.0.0.1:5501/` and use the **Book Ticket** section at `/#booking`.

Before starting Vite, create `react-app/.env.local` from `react-app/.env.example` and add the Supabase project URL and publishable key. Then run `supabase-schema.sql` in Supabase SQL Editor. The SQL also migrates older `bookings` tables by adding and backfilling `booking_code`.

Do not use VS Code Live Server or open the legacy root `booking.html`; those pages are not the React/Vite entry point. If you do use the legacy pages, create `supabase-browser-config.js` from `supabase-browser-config.example.js`; bookings are no longer stored silently in browser local storage.
