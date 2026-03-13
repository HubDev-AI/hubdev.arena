create extension if not exists pgcrypto;

create type public.week_status as enum (
  'draft',
  'submissions_open',
  'voting_open',
  'locked',
  'archived'
);

create type public.entry_status as enum (
  'pending',
  'approved',
  'rejected'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  username text,
  avatar_url text,
  auth_provider text not null default 'email',
  founding_builder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  theme_title text not null,
  theme_description text not null,
  timezone text not null default 'America/Los_Angeles',
  submission_open_at timestamptz not null,
  submission_close_at timestamptz not null,
  voting_open_at timestamptz not null,
  voting_close_at timestamptz not null,
  status public.week_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weeks_window_order_check check (
    submission_open_at < submission_close_at
    and submission_close_at <= voting_open_at
    and voting_open_at < voting_close_at
  )
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  builder_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null,
  one_liner text not null,
  live_url text not null,
  demo_asset_path text not null,
  status public.entry_status not null default 'pending',
  elo_rating integer not null default 1200,
  wins integer not null default 0,
  losses integer not null default 0,
  appearance_count integer not null default 0,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_builder_week_unique unique (week_id, builder_id),
  constraint entries_rating_nonnegative_check check (elo_rating >= 0),
  constraint entries_win_loss_nonnegative_check check (
    wins >= 0
    and losses >= 0
    and appearance_count >= 0
  )
);

create unique index entries_id_week_id_unique_idx
  on public.entries (id, week_id);

create index entries_week_status_leaderboard_idx
  on public.entries (
    week_id,
    status,
    elo_rating desc,
    wins desc,
    losses asc,
    approved_at asc
  );

create table public.matchups (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  entry_a_id uuid not null,
  entry_b_id uuid not null,
  exposure_count integer not null default 0,
  vote_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matchups_distinct_entries_check check (entry_a_id <> entry_b_id),
  constraint matchups_entry_a_fk
    foreign key (entry_a_id, week_id)
    references public.entries (id, week_id)
    on delete cascade,
  constraint matchups_entry_b_fk
    foreign key (entry_b_id, week_id)
    references public.entries (id, week_id)
    on delete cascade
);

create unique index matchups_week_entry_pair_unique_idx
  on public.matchups (week_id, least(entry_a_id, entry_b_id), greatest(entry_a_id, entry_b_id));

create unique index matchups_id_week_id_unique_idx
  on public.matchups (id, week_id);

create index matchups_week_exposure_idx
  on public.matchups (week_id, exposure_count asc, vote_count asc, created_at asc);

create table public.voter_sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  cookie_id text not null,
  fingerprint_hash text not null,
  votes_cast integer not null default 0,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint voter_sessions_cookie_per_week_unique unique (week_id, cookie_id),
  constraint voter_sessions_votes_nonnegative_check check (votes_cast >= 0)
);

create unique index voter_sessions_id_week_id_unique_idx
  on public.voter_sessions (id, week_id);

create index voter_sessions_week_fingerprint_idx
  on public.voter_sessions (week_id, fingerprint_hash, last_seen_at desc);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  matchup_id uuid not null,
  winner_entry_id uuid not null,
  loser_entry_id uuid not null,
  voter_session_id uuid not null,
  fingerprint_hash text not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint votes_distinct_entries_check check (winner_entry_id <> loser_entry_id),
  constraint votes_idempotency_unique unique (idempotency_key),
  constraint votes_one_per_matchup_per_session unique (voter_session_id, matchup_id),
  constraint votes_matchup_fk
    foreign key (matchup_id, week_id)
    references public.matchups (id, week_id)
    on delete cascade,
  constraint votes_winner_entry_fk
    foreign key (winner_entry_id, week_id)
    references public.entries (id, week_id)
    on delete cascade,
  constraint votes_loser_entry_fk
    foreign key (loser_entry_id, week_id)
    references public.entries (id, week_id)
    on delete cascade,
  constraint votes_session_fk
    foreign key (voter_session_id, week_id)
    references public.voter_sessions (id, week_id)
    on delete cascade
);

create index votes_session_created_at_idx
  on public.votes (voter_session_id, created_at desc);

create index votes_fingerprint_created_at_idx
  on public.votes (fingerprint_hash, created_at desc);

create index votes_week_created_at_idx
  on public.votes (week_id, created_at desc);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_weeks_updated_at
before update on public.weeks
for each row
execute function public.set_updated_at();

create trigger set_entries_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

create trigger set_matchups_updated_at
before update on public.matchups
for each row
execute function public.set_updated_at();

create trigger set_voter_sessions_updated_at
before update on public.voter_sessions
for each row
execute function public.set_updated_at();

grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles, public.weeks, public.entries, public.matchups to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update on public.entries to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.weeks to service_role;
grant select, insert, update, delete on public.entries to service_role;
grant select, insert, update, delete on public.matchups to service_role;
grant select, insert, update, delete on public.voter_sessions to service_role;
grant select, insert, update, delete on public.votes to service_role;

alter table public.profiles enable row level security;
alter table public.weeks enable row level security;
alter table public.entries enable row level security;
alter table public.matchups enable row level security;
alter table public.voter_sessions enable row level security;
alter table public.votes enable row level security;

create policy "Public can view profiles"
  on public.profiles
  for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public can view weeks"
  on public.weeks
  for select
  using (status <> 'draft'::public.week_status);

create policy "Public can view approved entries"
  on public.entries
  for select
  using (status = 'approved'::public.entry_status);

create policy "Builders can view own entries"
  on public.entries
  for select
  to authenticated
  using (auth.uid() = builder_id);

create policy "Builders can insert own entry"
  on public.entries
  for insert
  to authenticated
  with check (
    auth.uid() = builder_id
    and status = 'pending'::public.entry_status
  );

create policy "Builders can update own pending or rejected entry"
  on public.entries
  for update
  to authenticated
  using (
    auth.uid() = builder_id
    and status in ('pending'::public.entry_status, 'rejected'::public.entry_status)
  )
  with check (
    auth.uid() = builder_id
    and status in ('pending'::public.entry_status, 'rejected'::public.entry_status)
  );

create policy "Public can view matchups for visible weeks"
  on public.matchups
  for select
  using (
    exists (
      select 1
      from public.weeks
      where weeks.id = matchups.week_id
        and weeks.status in (
          'voting_open'::public.week_status,
          'locked'::public.week_status,
          'archived'::public.week_status
        )
    )
  );

create policy "Service writes voter sessions"
  on public.voter_sessions
  for all
  to service_role
  using (true)
  with check (true);

create policy "Service writes votes"
  on public.votes
  for all
  to service_role
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'demo-assets',
  'demo-assets',
  true,
  52428800,
  array['image/gif', 'video/mp4']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view demo assets"
  on storage.objects
  for select
  using (bucket_id = 'demo-assets');

create policy "Builders can upload demo assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'demo-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Builders can update own demo assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'demo-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'demo-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Builders can delete own demo assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'demo-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    username,
    avatar_url,
    auth_provider
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'user_name', ''),
      nullif(new.raw_user_meta_data ->> 'preferred_username', '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    ),
    coalesce(new.app_metadata ->> 'provider', 'email')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    username = coalesce(excluded.username, public.profiles.username),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    auth_provider = excluded.auth_provider,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.generate_week_matchups(p_week_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_count integer;
begin
  insert into public.matchups (week_id, entry_a_id, entry_b_id)
  select
    p_week_id,
    a.id,
    b.id
  from public.entries a
  join public.entries b
    on a.week_id = b.week_id
   and a.id < b.id
  where a.week_id = p_week_id
    and a.status = 'approved'::public.entry_status
    and b.status = 'approved'::public.entry_status
  on conflict do nothing;

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;

create or replace function public.cast_vote(
  p_week_id uuid,
  p_matchup_id uuid,
  p_winner_entry_id uuid,
  p_loser_entry_id uuid,
  p_voter_session_id uuid,
  p_fingerprint_hash text,
  p_idempotency_key text,
  p_created_at timestamptz default now()
)
returns table (
  vote_id uuid,
  winner_new_elo integer,
  loser_new_elo integer,
  winner_wins integer,
  loser_losses integer,
  session_votes_cast integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week public.weeks%rowtype;
  v_matchup public.matchups%rowtype;
  v_winner public.entries%rowtype;
  v_loser public.entries%rowtype;
  v_session public.voter_sessions%rowtype;
  v_vote public.votes%rowtype;
  v_expected numeric;
  v_delta integer;
  v_session_votes_last_10m integer;
  v_session_votes_last_day integer;
  v_fingerprint_votes_last_10m integer;
  v_fingerprint_votes_last_day integer;
begin
  if exists (
    select 1
    from public.votes
    where idempotency_key = p_idempotency_key
  ) then
    raise exception 'Duplicate idempotency key'
      using errcode = '23505';
  end if;

  select *
  into v_week
  from public.weeks
  where id = p_week_id
  for update;

  if not found then
    raise exception 'Week not found';
  end if;

  if v_week.status <> 'voting_open'::public.week_status then
    raise exception 'Voting is not open for this week';
  end if;

  if p_created_at > v_week.voting_close_at then
    raise exception 'Voting has already closed for this week';
  end if;

  select *
  into v_matchup
  from public.matchups
  where id = p_matchup_id
    and week_id = p_week_id
  for update;

  if not found then
    raise exception 'Matchup not found for week';
  end if;

  if not (
    (v_matchup.entry_a_id = p_winner_entry_id and v_matchup.entry_b_id = p_loser_entry_id)
    or (v_matchup.entry_a_id = p_loser_entry_id and v_matchup.entry_b_id = p_winner_entry_id)
  ) then
    raise exception 'Winner and loser must match the supplied matchup';
  end if;

  select *
  into v_session
  from public.voter_sessions
  where id = p_voter_session_id
    and week_id = p_week_id
  for update;

  if not found then
    raise exception 'Voter session not found for week';
  end if;

  if v_session.fingerprint_hash <> p_fingerprint_hash then
    raise exception 'Fingerprint does not match the voter session';
  end if;

  if exists (
    select 1
    from public.votes
    where voter_session_id = p_voter_session_id
      and matchup_id = p_matchup_id
  ) then
    raise exception 'This session already voted on the matchup'
      using errcode = '23505';
  end if;

  select count(*)
  into v_session_votes_last_10m
  from public.votes
  where voter_session_id = p_voter_session_id
    and created_at >= (p_created_at - interval '10 minutes');

  select count(*)
  into v_session_votes_last_day
  from public.votes
  where voter_session_id = p_voter_session_id
    and created_at >= (p_created_at - interval '1 day');

  select count(*)
  into v_fingerprint_votes_last_10m
  from public.votes
  where fingerprint_hash = p_fingerprint_hash
    and created_at >= (p_created_at - interval '10 minutes');

  select count(*)
  into v_fingerprint_votes_last_day
  from public.votes
  where fingerprint_hash = p_fingerprint_hash
    and created_at >= (p_created_at - interval '1 day');

  if greatest(v_session_votes_last_10m, v_fingerprint_votes_last_10m) >= 30 then
    raise exception 'Rate limit exceeded: 30 votes per 10 minutes';
  end if;

  if greatest(v_session_votes_last_day, v_fingerprint_votes_last_day) >= 100 then
    raise exception 'Rate limit exceeded: 100 votes per day';
  end if;

  select *
  into v_winner
  from public.entries
  where id = p_winner_entry_id
    and week_id = p_week_id
  for update;

  select *
  into v_loser
  from public.entries
  where id = p_loser_entry_id
    and week_id = p_week_id
  for update;

  if v_winner.id is null or v_loser.id is null then
    raise exception 'Winner or loser entry not found for week';
  end if;

  if v_winner.status <> 'approved'::public.entry_status
    or v_loser.status <> 'approved'::public.entry_status then
    raise exception 'Only approved entries can receive votes';
  end if;

  v_expected := 1 / (1 + power(10, (v_loser.elo_rating - v_winner.elo_rating) / 400.0));
  v_delta := round(24 * (1 - v_expected));

  update public.entries
  set
    elo_rating = elo_rating + v_delta,
    wins = wins + 1
  where id = p_winner_entry_id
  returning * into v_winner;

  update public.entries
  set
    elo_rating = elo_rating - v_delta,
    losses = losses + 1
  where id = p_loser_entry_id
  returning * into v_loser;

  update public.matchups
  set vote_count = vote_count + 1
  where id = p_matchup_id;

  insert into public.votes (
    week_id,
    matchup_id,
    winner_entry_id,
    loser_entry_id,
    voter_session_id,
    fingerprint_hash,
    idempotency_key,
    created_at
  )
  values (
    p_week_id,
    p_matchup_id,
    p_winner_entry_id,
    p_loser_entry_id,
    p_voter_session_id,
    p_fingerprint_hash,
    p_idempotency_key,
    p_created_at
  )
  returning * into v_vote;

  update public.voter_sessions
  set
    votes_cast = votes_cast + 1,
    last_seen_at = greatest(last_seen_at, p_created_at)
  where id = p_voter_session_id
  returning * into v_session;

  return query
  select
    v_vote.id,
    v_winner.elo_rating,
    v_loser.elo_rating,
    v_winner.wins,
    v_loser.losses,
    v_session.votes_cast;
end;
$$;

grant execute on function public.generate_week_matchups(uuid) to authenticated, service_role;
grant execute on function public.cast_vote(uuid, uuid, uuid, uuid, uuid, text, text, timestamptz) to service_role;
