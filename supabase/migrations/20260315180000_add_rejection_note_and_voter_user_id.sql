-- Add rejection_note to entries (so admins can tell builders why they were rejected)
alter table public.entries add column if not exists rejection_note text;

-- Add user_id to voter_sessions (link votes to authenticated users)
alter table public.voter_sessions add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index if not exists voter_sessions_user_id_idx on public.voter_sessions (user_id) where user_id is not null;
