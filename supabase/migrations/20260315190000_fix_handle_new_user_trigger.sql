-- Fix: auth.users uses raw_app_meta_data, not app_metadata
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
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
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
