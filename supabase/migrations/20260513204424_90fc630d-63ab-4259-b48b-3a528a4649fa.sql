
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null default '',
  category text not null,
  amount numeric not null,
  period text not null default 'daily' check (period in ('daily','yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_idx on public.transactions(user_id, date desc);
alter table public.transactions enable row level security;
create policy "tx select own" on public.transactions for select using (auth.uid() = user_id);
create policy "tx insert own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "tx update own" on public.transactions for update using (auth.uid() = user_id);
create policy "tx delete own" on public.transactions for delete using (auth.uid() = user_id);

create table public.year_end_inputs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.year_end_inputs enable row level security;
create policy "ye select own" on public.year_end_inputs for select using (auth.uid() = user_id);
create policy "ye insert own" on public.year_end_inputs for insert with check (auth.uid() = user_id);
create policy "ye update own" on public.year_end_inputs for update using (auth.uid() = user_id);
create policy "ye delete own" on public.year_end_inputs for delete using (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_tx_updated before update on public.transactions for each row execute function public.touch_updated_at();
create trigger trg_ye_updated before update on public.year_end_inputs for each row execute function public.touch_updated_at();
