-- IPL Ticket Booking: run this script in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_number integer not null unique,
  match_date date not null,
  title text not null,
  venue text not null,
  available_seats integer not null default 0 check (available_seats >= 0),
  prices jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  seats integer not null check (seats > 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

insert into public.matches (match_number, match_date, title, venue, available_seats, prices)
values
  (1, '2026-03-28', 'CSK vs MI', 'Wankhede Stadium, Mumbai', 1200, '[{"category":"General","amount":1500},{"category":"Premium","amount":3500},{"category":"VIP","amount":7500}]'),
  (2, '2026-03-29', 'RCB vs KKR', 'M. Chinnaswamy Stadium, Bengaluru', 950, '[{"category":"General","amount":1200},{"category":"Premium","amount":3000},{"category":"VIP","amount":6500}]'),
  (3, '2026-04-01', 'MI vs KKR', 'Eden Gardens, Kolkata', 800, '[{"category":"General","amount":1000},{"category":"Premium","amount":2800},{"category":"VIP","amount":6000}]')
on conflict (match_number) do update set
  match_date = excluded.match_date,
  title = excluded.title,
  venue = excluded.venue,
  prices = excluded.prices;

alter table public.matches enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Public can read matches" on public.matches;
create policy "Public can read matches" on public.matches for select to anon, authenticated using (true);

drop policy if exists "Public can update match seats" on public.matches;
create policy "Public can update match seats" on public.matches for update to anon, authenticated using (true) with check (available_seats >= 0);

drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings" on public.bookings for insert to anon, authenticated with check (seats > 0);

alter table public.matches replica identity full;
alter table public.bookings replica identity full;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.bookings;
