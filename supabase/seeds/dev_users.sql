-- DEV-ONLY demo users (local Supabase). NOT part of the normal migration/seed.
-- Run with: docker exec -i supabase_db_lingoo psql -U postgres -d postgres < supabase/seeds/dev_users.sql
-- Creates 4 auth users (password: "password123"); the on_auth_user_created
-- trigger makes their profiles, then we fill in languages + interests.

do $$
declare
  u record;
  pw text := extensions.crypt('password123', extensions.gen_salt('bf'));
begin
  for u in
    select * from (values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'emma@demo.dev'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'yuki@demo.dev'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'liam@demo.dev'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'sofia@demo.dev'),
      ('55555555-5555-5555-5555-555555555555'::uuid, 'me@demo.dev')
    ) as t(id, email)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.email, pw, now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}', false, false
    ) on conflict (id) do nothing;
  end loop;
end $$;

-- Flesh out profiles (display names, interests). Usernames were auto-set by trigger.
update public.profiles set display_name = 'Emma',  interests = '{travel,music}'  where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set display_name = 'Yuki',  interests = '{anime,music}'   where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set display_name = 'Liam',  interests = '{gaming,tech}'   where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set display_name = 'Sofía', interests = '{food,travel}'   where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set display_name = 'Me',    interests = '{travel,music}'  where id = '55555555-5555-5555-5555-555555555555';

-- Demo users skip onboarding (column added in 0005).
update public.profiles set onboarded = true
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- Native languages
insert into public.profile_native_languages (profile_id, language_code) values
  ('11111111-1111-1111-1111-111111111111', 'en'),
  ('22222222-2222-2222-2222-222222222222', 'ja'),
  ('33333333-3333-3333-3333-333333333333', 'en'),
  ('44444444-4444-4444-4444-444444444444', 'es'),
  ('55555555-5555-5555-5555-555555555555', 'ko')
on conflict do nothing;

-- Learning languages
insert into public.profile_learning_languages (profile_id, language_code, level) values
  ('11111111-1111-1111-1111-111111111111', 'ko', 'intermediate'),
  ('22222222-2222-2222-2222-222222222222', 'ko', 'beginner'),
  ('33333333-3333-3333-3333-333333333333', 'ja', 'beginner'),
  ('44444444-4444-4444-4444-444444444444', 'fr', 'elementary'),
  ('55555555-5555-5555-5555-555555555555', 'en', 'intermediate')
on conflict do nothing;
