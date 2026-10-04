# Weight Tracker

Mobile-first weight loss tracker (PWA). React + Vite + TypeScript, Tailwind, React Router, TanStack Query, Recharts, Supabase (Auth + Postgres).

## Setup

1. **Supabase**: create a project, then run the schema SQL (tables, RLS policies, sign-up trigger and `daily_summary` view) from `weight-tracker-claude-code-prompt.md` in the SQL editor. In Authentication > Providers make sure Email is enabled (optionally turn off "Confirm email" for local testing).
2. **Environment**: copy `.env.example` to `.env` and fill in your Project URL and anon public key (Project Settings > API).

   ```powershell
   Copy-Item .env.example .env
   ```

3. **Install and run**:

   ```powershell
   npm install
   npm run dev
   ```

4. **Test / build**:

   ```powershell
   npm test          # unit tests for src/lib/metrics.ts
   npm run build     # type-check + production build (outputs dist/)
   npm run preview   # serve the production build
   ```

## Deploying

Vercel or Netlify both work. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, build command `npm run build`, output directory `dist`. For client-side routing, add a rewrite of all paths to `/index.html`.

## Notes

- Weights are stored in kg and converted to lb in the UI when `profiles.unit = 'lb'`.
- Dates are `YYYY-MM-DD` in the user's local timezone.
- Calories are optional everywhere.
- PWA icons: only an SVG icon is included. For best installability on all platforms, add 192px and 512px PNG icons and list them in the manifest in `vite.config.ts`.
