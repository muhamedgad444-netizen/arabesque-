-- Run this once in the Supabase SQL Editor (Project → SQL).

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  customer_email text,
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_city text,
  customer_governorate text,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'EGP',
  payment_method text,
  fulfillment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Server uses the secret key (bypasses RLS). No public client policies on purpose.
