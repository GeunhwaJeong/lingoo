-- Track whether a user has finished onboarding (chosen languages etc.).
-- The app routes signed-in-but-not-onboarded users to the onboarding flow.
alter table public.profiles
  add column onboarded boolean not null default false;
