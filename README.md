# Together 2027

Production wedding invitation and RSVP application for Ana & Nuno.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase and Vercel.

## Setup

1. Copy `.env.example` to `.env.local` and use the existing Supabase project values.
2. Apply `supabase/migrations/001_together_2027.sql` in the Supabase SQL editor.
3. Create the admin user in Supabase Authentication.
4. Run `npm install` and `npm run dev`.

The included seed creates the test invitation `ANA-NUNO-2027-TEST` for Ana Garcia and Nuno Fernandes.

## Production checks

Run `npm run lint` and `npm run build`. Set `NEXT_PUBLIC_SITE_URL` to the canonical Vercel URL before deployment.

## Routes

- `/` — bilingual public invitation
- `/rsvp` — invitation lookup and response journey
- `/thank-you` — completion page
- `/admin/login` — Supabase email/password login
- `/admin` — protected dashboard and management sections
