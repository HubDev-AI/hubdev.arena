insert into public.weeks (
  slug,
  theme_title,
  theme_description,
  timezone,
  submission_open_at,
  submission_close_at,
  voting_open_at,
  voting_close_at,
  status
)
values (
  'launch-week',
  'Agents That Ship',
  'Build the most compelling AI-powered app that feels production-ready after a single session.',
  'America/Los_Angeles',
  '2026-03-12T20:00:00Z',
  '2026-03-16T06:59:00Z',
  '2026-03-16T16:00:00Z',
  '2026-03-19T06:59:00Z',
  'draft'
)
on conflict (slug) do update
set
  theme_title = excluded.theme_title,
  theme_description = excluded.theme_description,
  timezone = excluded.timezone,
  submission_open_at = excluded.submission_open_at,
  submission_close_at = excluded.submission_close_at,
  voting_open_at = excluded.voting_open_at,
  voting_close_at = excluded.voting_close_at,
  status = excluded.status;
