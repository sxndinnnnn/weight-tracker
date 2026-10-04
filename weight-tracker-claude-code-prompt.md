# Weight Tracker: Claude Code build prompt

Paste everything under "The prompt" into Claude Code from an empty project folder. Run the SQL in the Supabase SQL editor first (Step 1 below).

---

## Step 1: Supabase setup (do this yourself)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste the SQL below, and run it.
3. In **Authentication > Providers**, make sure Email is enabled. For quick local testing you can turn off "Confirm email".
4. Copy the **Project URL** and **anon public key** from **Project Settings > API**. You will put them in a `.env` file.

```sql
-- ============ TABLES ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  start_weight_kg numeric(5,2),
  goal_weight_kg numeric(5,2),
  height_cm numeric(5,1),
  unit text not null default 'kg' check (unit in ('kg', 'lb')),
  daily_calorie_target int,
  daily_water_target_ml int not null default 2500,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(5,2) not null check (weight_kg > 20 and weight_kg < 500),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'drink')),
  name text not null,
  calories int check (calories >= 0),
  eaten_at time,
  note text,
  created_at timestamptz not null default now()
);

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  ml int not null check (ml > 0),
  created_at timestamptz not null default now()
);

create index on public.weight_entries (user_id, entry_date desc);
create index on public.food_entries (user_id, entry_date desc);
create index on public.water_entries (user_id, entry_date desc);

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.weight_entries enable row level security;
alter table public.food_entries enable row level security;
alter table public.water_entries enable row level security;

create policy "profiles: own row" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "weight: own rows" on public.weight_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "food: own rows" on public.food_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "water: own rows" on public.water_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ AUTO-CREATE PROFILE ON SIGN-UP ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ DAILY SUMMARY VIEW ============

create or replace view public.daily_summary
with (security_invoker = true) as
select
  d.entry_date,
  w.weight_kg,
  coalesce(f.total_calories, 0) as total_calories,
  coalesce(h.total_water_ml, 0) as total_water_ml
from (
  select user_id, entry_date from public.weight_entries
  union select user_id, entry_date from public.food_entries
  union select user_id, entry_date from public.water_entries
) d
left join public.weight_entries w
  on w.user_id = d.user_id and w.entry_date = d.entry_date
left join (
  select user_id, entry_date, sum(calories) as total_calories
  from public.food_entries group by user_id, entry_date
) f on f.user_id = d.user_id and f.entry_date = d.entry_date
left join (
  select user_id, entry_date, sum(ml) as total_water_ml
  from public.water_entries group by user_id, entry_date
) h on h.user_id = d.user_id and h.entry_date = d.entry_date;
```

---

## The prompt (paste into Claude Code)

```
Build a mobile-first, responsive weight loss tracker as a PWA.

STACK
- React + Vite + TypeScript
- Tailwind CSS
- React Router
- TanStack Query for data fetching/caching
- Recharts for charts
- @supabase/supabase-js (Auth + Postgres)
- vite-plugin-pwa for installability
- I am on Windows using PowerShell, so give any shell commands in PowerShell syntax.

BACKEND
The Supabase schema already exists (tables: profiles, weight_entries, food_entries,
water_entries, and the view daily_summary, all with Row Level Security).
Read the Supabase URL and anon key from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
in a .env file. Create .env.example with placeholders. Never hardcode keys.
Weights are stored in kg. Convert to lb in the UI if profiles.unit = 'lb'.

SCREENS (bottom tab bar on mobile: Today, Log, [+ Add], Progress; Settings reachable
from the Today header)
1. Auth: email + password sign up / log in, with clear error messages.
2. Onboarding (first login only, when profiles.start_weight_kg is null): ask start
   weight, goal weight, height (optional), unit. Save to profiles.
3. Today (dashboard):
   - Hero card: current weight (latest entry), total lost, progress bar from start to
     goal with "% to goal".
   - Two stat cards: change this week, logging streak (consecutive days with a weight entry).
   - 30-day weight area chart.
   - Today's calories (vs target if set) and water (vs target) progress bars.
4. Log (daily diary):
   - Horizontal 7-day date strip; tapping a day loads that day.
   - Weight card with a - / + stepper (0.1 steps) that starts from the previous entry,
     upserting on (user_id, entry_date). Show yesterday's weight and the difference.
   - Food & drink grouped by Breakfast, Lunch, Dinner, Snack, with per-meal calorie
     subtotals, an "Add" dashed button for empty meals, and swipe or button to delete.
   - Water card with +250 ml and +500 ml quick-add buttons.
5. Add entry: Food / Drink toggle, name, meal pills, optional calories, time, optional
   note, and a "Recent" row of the user's last distinct entries that fills the form on tap.
6. Progress:
   - Range switcher: 1W, 1M, 3M, All.
   - Line/area chart with a 7-day moving average line plus faint daily dots, and a
     dashed goal line.
   - Metric cards: total lost, average change per week, remaining to goal, estimated
     goal date (based on the average weekly rate; hide it if there is not enough data).
   - Weekly change bars for the last 5 weeks.
   - A short, neutral pace note (e.g. steady pace of 0.5-1 kg/week). If the average
     loss exceeds 1 kg/week for several weeks, show a gentle note suggesting a
     steadier pace rather than praise.
7. Settings: edit goal weight, height, unit, calorie and water targets, log out,
   and export all data as CSV.

BEHAVIOUR
- Calories are optional everywhere. The app must work fully with no calories logged.
- Handle loading, empty and error states on every screen. Empty states should have
  a clear next action, not a blank page.
- Dates use the user's local timezone (entry_date as YYYY-MM-DD).
- Optimistic updates for weight and water.
- Protected routes: redirect to login when signed out.

DESIGN
Clean, calm, and modern. Use these tokens (put them in tailwind.config):
- Background #F2F6F4, surface #FFFFFF, text #0E2B2B, muted text #4D6666,
  border #D8E3DF
- Primary teal #0F766E (hover #0B5A54, tint #D5EDE8)
- Accent orange #C2410C for the add button and goal markers
- Water blue #1D4ED8
- Headings: Bricolage Grotesque (600-700). Body: DM Sans. Load via Google Fonts.
- Rounded cards (20-24px radius), large touch targets (minimum 44px), bottom nav
  76px tall with a raised circular orange + button in the middle.
- Must look good at 390px wide and still be usable on desktop (center content, max
  width around 480px, or a two-column layout from lg up).
- Meet WCAG AA contrast and use real buttons, labels and aria-labels on icon-only buttons.

STRUCTURE
src/
  lib/supabase.ts
  lib/metrics.ts        (moving average, weekly change, streak, goal ETA, unit conversion)
  hooks/                (useWeights, useFoodEntries, useWaterEntries, useProfile)
  components/           (WeightStepper, MealSection, TrendChart, StatCard, DateStrip,
                         BottomNav, ProgressBar)
  pages/                (Auth, Onboarding, Today, Log, AddEntry, Progress, Settings)

Write unit tests for lib/metrics.ts. Add a README with setup steps (create .env, run
dev server, build). Start by scaffolding the project and getting auth + onboarding +
the daily weight entry working end to end, then continue screen by screen, and tell me
what you did after each stage.
```

---

## Notes

- **Seed data for testing:** once auth works, ask Claude Code to write a script that inserts about 9 weeks of realistic sample weigh-ins and meals for your test user so the charts have something to show.
- **Deploying:** Vercel or Netlify both work. Add the same two environment variables in their dashboard.
- **Visual reference:** the mockups are at https://claude.ai/artifact/NPpvKW8EeQEYVW2eRoUZLc. The design tokens in the prompt come straight from them.
