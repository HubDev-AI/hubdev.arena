-- ═══════════════════════════════════════════════════════════════
-- HubDev Arena — seed data for local development
-- Provides a running sprint with voting_open so you can vote
-- ═══════════════════════════════════════════════════════════════

-- Clean slate (reverse FK order)
truncate public.votes cascade;
truncate public.voter_sessions cascade;
truncate public.matchups cascade;
truncate public.entries cascade;
truncate public.weeks cascade;
truncate public.profiles cascade;
delete from auth.users where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005'
);

-- ─── Auth users (required for profiles FK) ───
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at, instance_id, encrypted_password, confirmation_token)
values
  ('00000000-0000-0000-0000-000000000001', 'alex.chen@example.com',   '{"full_name":"Alex Chen","user_name":"alexchen"}'::jsonb,     '{"provider":"github"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000', '', ''),
  ('00000000-0000-0000-0000-000000000002', 'maya.rodriguez@example.com','{"full_name":"Maya Rodriguez","user_name":"mayarodriguez"}'::jsonb, '{"provider":"github"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000', '', ''),
  ('00000000-0000-0000-0000-000000000003', 'sam.nakamura@example.com', '{"full_name":"Sam Nakamura","user_name":"samnakamura"}'::jsonb,  '{"provider":"github"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000', '', ''),
  ('00000000-0000-0000-0000-000000000004', 'riley.patel@example.com',  '{"full_name":"Riley Patel","user_name":"rileypatel"}'::jsonb,   '{"provider":"github"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000', '', ''),
  ('00000000-0000-0000-0000-000000000005', 'jordan.lee@example.com',   '{"full_name":"Jordan Lee","user_name":"jordanlee"}'::jsonb,    '{"provider":"github"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000', '', '');

-- ─── Profiles ───
insert into public.profiles (id, display_name, username, avatar_url, auth_provider, founding_builder)
values
  ('00000000-0000-0000-0000-000000000001', 'Alex Chen',       'alexchen',       null, 'github', true),
  ('00000000-0000-0000-0000-000000000002', 'Maya Rodriguez',  'mayarodriguez',  null, 'github', true),
  ('00000000-0000-0000-0000-000000000003', 'Sam Nakamura',    'samnakamura',    null, 'github', true),
  ('00000000-0000-0000-0000-000000000004', 'Riley Patel',     'rileypatel',     null, 'github', false),
  ('00000000-0000-0000-0000-000000000005', 'Jordan Lee',      'jordanlee',      null, 'github', false)
on conflict (id) do update set
  display_name = excluded.display_name,
  username = excluded.username,
  auth_provider = excluded.auth_provider,
  founding_builder = excluded.founding_builder;

-- ─── Current week: voting open, closes in 4 days ───
insert into public.weeks (
  id, slug, theme_title, theme_description, timezone,
  submission_open_at, submission_close_at, voting_open_at, voting_close_at, status
)
values (
  '11111111-1111-1111-1111-111111111111',
  'agents-that-ship',
  'Agents That Ship',
  'Build the most compelling AI-powered app that feels production-ready after a single session.',
  'Europe/Sofia',
  '2026-03-14T10:00:00Z',
  '2026-03-18T22:00:00Z',
  '2026-03-19T10:00:00Z',
  '2026-03-25T22:00:00Z',
  'voting_open'
)
on conflict (slug) do update set
  theme_title = excluded.theme_title,
  theme_description = excluded.theme_description,
  timezone = excluded.timezone,
  submission_open_at = excluded.submission_open_at,
  submission_close_at = excluded.submission_close_at,
  voting_open_at = excluded.voting_open_at,
  voting_close_at = excluded.voting_close_at,
  status = excluded.status;

-- ─── Past week (locked) ───
insert into public.weeks (
  id, slug, theme_title, theme_description, timezone,
  submission_open_at, submission_close_at, voting_open_at, voting_close_at, status
)
values (
  '22222222-2222-2222-2222-222222222222',
  'hello-world',
  'Hello World',
  'Ship something — anything — that proves your AI workflow can go from zero to live in one sitting.',
  'Europe/Sofia',
  '2026-03-07T10:00:00Z',
  '2026-03-11T22:00:00Z',
  '2026-03-12T10:00:00Z',
  '2026-03-14T22:00:00Z',
  'locked'
)
on conflict (slug) do update set
  theme_title = excluded.theme_title,
  theme_description = excluded.theme_description,
  status = excluded.status;

-- ─── Entries for current week (5 approved) ───
insert into public.entries (
  id, week_id, builder_id, slug, title, one_liner, live_url, demo_asset_path,
  status, elo_rating, wins, losses, appearance_count, approved_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'shipfast-agent',
    'ShipFast Agent',
    'An AI co-pilot that turns a product brief into a deployed MVP in under 30 minutes.',
    'https://shipfast-agent.example.com',
    'mock://shipfast-agent',
    'approved', 1243, 28, 21, 49,
    '2026-03-18T14:00:00Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'designbot-studio',
    'DesignBot Studio',
    'Generate production-ready UI components from rough sketches using multi-modal AI.',
    'https://designbot-studio.example.com',
    'mock://designbot-studio',
    'approved', 1210, 29, 27, 56,
    '2026-03-18T15:00:00Z'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000003',
    'data-whisperer',
    'Data Whisperer',
    'Ask questions in plain English and get instant SQL queries, charts, and insights.',
    'https://data-whisperer.example.com',
    'mock://data-whisperer',
    'approved', 1201, 21, 30, 51,
    '2026-03-18T16:00:00Z'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000004',
    'codepilot-ai',
    'CodePilot AI',
    'Real-time code review agent that catches bugs, suggests fixes, and explains trade-offs.',
    'https://codepilot-ai.example.com',
    'mock://codepilot-ai',
    'approved', 1190, 28, 28, 56,
    '2026-03-18T17:00:00Z'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000005',
    'bugslayer-pro',
    'BugSlayer Pro',
    'Autonomous debugging agent that reproduces, diagnoses, and patches bugs from error logs.',
    'https://bugslayer-pro.example.com',
    'mock://bugslayer-pro',
    'approved', 1156, 24, 24, 48,
    '2026-03-18T18:00:00Z'
  )
on conflict (slug) do update set
  title = excluded.title,
  one_liner = excluded.one_liner,
  status = excluded.status,
  elo_rating = excluded.elo_rating,
  wins = excluded.wins,
  losses = excluded.losses,
  appearance_count = excluded.appearance_count,
  approved_at = excluded.approved_at;

-- ─── Past week winner entry ───
insert into public.entries (
  id, week_id, builder_id, slug, title, one_liner, live_url, demo_asset_path,
  status, elo_rating, wins, losses, appearance_count, approved_at
)
values (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000001',
  'landing-wizard',
  'Landing Wizard',
  'Generate a complete landing page from a single sentence describing your product.',
  'https://landing-wizard.example.com',
  'mock://landing-wizard',
  'approved', 1280, 18, 6, 24,
  '2026-03-11T14:00:00Z'
)
on conflict (slug) do update set
  title = excluded.title,
  elo_rating = excluded.elo_rating,
  wins = excluded.wins,
  losses = excluded.losses;

-- ─── Generate all 10 matchups for current week ───
select public.generate_week_matchups('11111111-1111-1111-1111-111111111111');

-- Pre-set some exposure counts so voting feels active
update public.matchups
set exposure_count = floor(random() * 20 + 30)::int,
    vote_count = floor(random() * 15 + 10)::int
where week_id = '11111111-1111-1111-1111-111111111111';
