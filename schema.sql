-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. Complaints Table
create table complaints (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null,
  severity text not null, -- Low, Medium, High, Critical
  status text default 'OPEN' not null, -- OPEN, RESOLVED, ESCALATED
  priority_score integer default 0,
  location text not null,
  sla_deadline timestamptz,
  created_at timestamptz default now()
);

-- 2. Events Table (Event Bus)
create table events (
  id uuid default gen_random_uuid() primary key,
  type text not null, -- ComplaintRaised, PriorityCalculated, SLABreached
  payload jsonb not null,
  created_at timestamptz default now()
);

-- 3. Optimization Indexes
create index idx_complaints_priority on complaints(priority_score desc);
create index idx_events_created on events(created_at desc);

-- 4. Realtime (Enable for Events)
alter publication supabase_realtime add table events;
