# Maison Lumière — Salon Booking Prototype

A responsive cosmetics-salon booking + management web app. **Front-end prototype**:
all data lives in the browser (seeded into `localStorage`), so there is no backend
to run. Auth is real (role-based, session-persisted); email notifications are
stubbed and written to an in-app log.

Target stack for the production build is **Next.js + Supabase** — the data layer in
`src/lib/store.tsx` is deliberately isolated so it can be swapped for Supabase
queries later.

**Live demo:** https://lucckozak.github.io/salonapp/

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (GitHub Pages)

The app is a fully static site (`output: "export"` in `next.config.ts`, served
under the `/salonapp` base path in production). To rebuild and publish:

```bash
npm run build      # -> ./out
npm run deploy     # pushes ./out to the gh-pages branch
```

GitHub Pages serves the `gh-pages` branch at
`https://lucckozak.github.io/salonapp/`. `npm run dev` still serves from `/`
(the base path only applies to production builds).

## Demo accounts

Password for all three is `password`.

| Role      | Email               | Lands on   |
| --------- | ------------------- | ---------- |
| Customer  | `customer@salon.app`| `/account` |
| Specialist| `sarah@salon.app`   | `/staff`   |
| Admin     | `admin@salon.app`   | `/admin`   |

Other specialists: `emma@`, `maria@`, `lina@`, `priya@` `salon.app`.

Reset all local data from **Admin → Settings → Reset demo data**.

## What's implemented

- **Customer**: browse treatments & specialists; **non-linear booking flow** — one
  "Arrange" screen where treatment, specialist, date and time can be set in any
  order and changed freely (changing the specialist just re-checks the time — it
  never restarts the flow), then details -> confirm. Entry points: `/book`,
  `/book?service=`, `?employee=`, `?date=`, `?time=` and any combination (e.g. the
  clickable slots in the specialist availability panel). Guest or signed-in
  checkout, upcoming/past appointments, reschedule & cancel within policy, profile.
- **Specialist profile** has a browse-only **availability panel**: pick a day
  (Today / Tomorrow / next 2 weeks), optionally a treatment. With no treatment it
  shows free time windows (buffer- and lead-time-aware); with one it shows exact
  bookable start times. Every entry links straight into the booking flow
  pre-filled. Backed by `getFreeWindows()` in `src/lib/availability.ts`.
- **Specialist**: dashboard, private day/week/month calendar, appointment list with
  complete / no-show, weekly working hours, breaks / vacation / one-off blocks,
  editable public profile.
- **Admin**: dashboard with KPIs + notification log, salon-wide calendar, global
  appointment search & manual create/edit (with availability override),
  **revenue report** (this week / this month / last month / this year; realised
  vs booked; 6-month & 8-week trend; income broken down per specialist and per
  treatment), full employee CRUD (creates the login account + schedule in one
  step, password reset, activate/deactivate) — each employee page has a
  **Bookings** tab (their day / week / month calendar + this-week / this-month
  counts + month revenue; click any appointment to edit) alongside the
  **Details & schedule** tab. Service CRUD with per-specialist assignment,
  customer CRUD with history and "book for customer", salon settings (hours,
  booking rules, notifications).
- **Availability engine** (`src/lib/availability.ts`): a slot is offered only when
  the specialist works, performs the service, is free (existing appointments +
  buffer), not on a break / block / vacation, the salon is open, and the whole
  service fits before closing.

## Structure

```
src/
  app/
    (site)/        marketing + customer pages (public chrome)
    staff/         specialist dashboard (role: EMPLOYEE)
    admin/         admin panel (role: ADMIN)
  components/      ui/, layout/, booking/, calendar/, appointments/, …
  lib/
    types.ts       domain model
    data/          static catalog + deterministic seed generator
    store.tsx      client data store (localStorage) — swap point for Supabase
    auth.tsx       mock role-based auth
    availability.ts the slot engine
    selectors.ts   derived queries
```
