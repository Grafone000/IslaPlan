-- Event Planner initial schema.
-- Row level security is on for every table. Clients only ever read their own rows;
-- all request and message writes go through the server with the service role key.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  updated_at timestamptz not null default now()
);

create table public.event_requests (
  id uuid primary key,
  schema_version integer not null,
  revision integer not null,
  status text not null check (
    status in (
      'estimated',
      'revising',
      'declined',
      'accepted',
      'consultation-requested',
      'deposit-pending',
      'deposit-paid'
    )
  ),
  account_id uuid references auth.users (id) on delete set null,
  contact_email text not null,
  event_date date,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  payload jsonb not null
);

create index event_requests_account_id_idx on public.event_requests (account_id);
create index event_requests_status_idx on public.event_requests (status);
create index event_requests_contact_email_idx on public.event_requests (lower(contact_email));

create table public.event_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.event_requests (id) on delete cascade,
  direction text not null check (direction in ('client', 'organiser')),
  subject text not null default '',
  body jsonb not null,
  body_text text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index event_messages_request_id_idx on public.event_messages (request_id, created_at);

alter table public.profiles enable row level security;
alter table public.event_requests enable row level security;
alter table public.event_messages enable row level security;

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users read their own requests"
  on public.event_requests for select to authenticated
  using ((select auth.uid()) = account_id);

create policy "Users read messages of their own requests"
  on public.event_messages for select to authenticated
  using (
    exists (
      select 1 from public.event_requests r
      where r.id = request_id and r.account_id = (select auth.uid())
    )
  );

-- Copy the sign-up details into the profile.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private buckets: files are read through signed URLs made by the server.
insert into storage.buckets (id, name, public)
values
  ('event-photos', 'event-photos', false),
  ('message-attachments', 'message-attachments', false);
