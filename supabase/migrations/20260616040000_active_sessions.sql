-- Migration: Create active_sessions table for tracking multiple devices
create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_id text not null,
  last_active timestamptz default now() not null,
  unique(user_id, device_id)
);

-- Enable Row Level Security
alter table public.active_sessions enable row level security;

-- Policy: Users can only select, insert, update, delete their own sessions
create policy "Users can manage their own sessions" 
on public.active_sessions 
for all 
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
