alter table public.voter_sessions
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index if not exists voter_sessions_user_id_week_idx
  on public.voter_sessions (user_id, week_id)
  where user_id is not null;
