# Workflow: Deploy Supabase Schema & Database Migrations

## Objective
Establish the relational data model, atomic counters, updated_at triggers, and Row-Level Security (RLS) policies for the Smart Review Standee network in Supabase.

---

## Required Inputs
1. Access to Supabase Project Dashboard (SQL Editor) or `SUPABASE_SERVICE_ROLE_KEY` CLI migration connection.
2. PostgreSQL 14+ engine (Standard Supabase instance).

---

## Architecture & Schema Definition

Execute the following SQL script inside Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Main Standees Table
create table if not exists public.standees (
  id uuid default gen_random_uuid() primary key,
  serial_code text unique not null,
  business_name text,
  google_review_url text,
  whatsapp_number text,
  is_active boolean default false not null,
  scan_count integer default 0 not null,
  last_scanned_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Performance Indexes
create index if not exists idx_standees_serial on public.standees(serial_code);
create index if not exists idx_standees_is_active on public.standees(is_active);

-- 3. Automatic updated_at Trigger
create or replace function public.handle_updated_at()
returns trigger as $$ 
begin   
  new.updated_at = now();   
  return new; 
end; 
$$ language plpgsql;

drop trigger if exists tr_standees_updated_at on public.standees;
create trigger tr_standees_updated_at
  before update on public.standees
  for each row execute function public.handle_updated_at();

-- 4. Atomic Scan Counter to eliminate race conditions
create or replace function public.increment_standee_scan(p_serial_code text)
returns void as $$ 
begin   
  update public.standees   
  set scan_count = scan_count + 1, 
      last_scanned_at = now()   
  where serial_code = p_serial_code; 
end; 
$$ language plpgsql security definer;

-- 5. Row Level Security (RLS)
alter table public.standees enable row level security;

-- Public can read standees to resolve links
drop policy if exists "Allow public read active standee" on public.standees;
create policy "Allow public read active standee"
  on public.standees for select using (true);

-- Insert/Update restricted to Service Role (Admin Actions)
drop policy if exists "Service role full access" on public.standees;
create policy "Service role full access"
  on public.standees for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

---

## Verification & Sanity Testing

After running the SQL script in Supabase:
1. Verify table exists:
   ```sql
   select count(*) from public.standees;
   ```
2. Test the atomic scan function:
   ```sql
   insert into public.standees (serial_code, business_name, is_active)
   values ('TEST-001', 'Test Cafe', true)
   on conflict (serial_code) do nothing;

   select public.increment_standee_scan('TEST-001');
   select scan_count, last_scanned_at from public.standees where serial_code = 'TEST-001';
   ```
3. Confirm RLS is enabled and active.
