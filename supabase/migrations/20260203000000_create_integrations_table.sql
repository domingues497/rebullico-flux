create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(provider, user_id)
);

alter table public.integrations enable row level security;

create policy "Users can view their own integrations"
  on public.integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on public.integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on public.integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.integrations for delete
  using (auth.uid() = user_id);

-- Add trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_integrations_updated_at
  before update on public.integrations
  for each row
  execute function public.handle_updated_at();
