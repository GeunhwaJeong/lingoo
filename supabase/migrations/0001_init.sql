-- lingoo initial schema
-- Postgres / Supabase. Row Level Security (RLS) is ON for every table — the
-- anon key shipped in the app can only ever do what these policies allow.
--
-- Chat model (conversations / participants / messages / reactions) adapted
-- from a proven design; `corrections` is lingoo's differentiator.

-- ============================================================================
-- Reference data
-- ============================================================================

create table public.languages (
  code        text primary key,            -- 'en', 'ko', 'ja', ...
  name        text not null,               -- 'Korean'
  native_name text not null,               -- '한국어'
  is_rtl      boolean not null default false
);

-- ============================================================================
-- Profiles  (1:1 with auth.users)
-- ============================================================================

create type proficiency_level as enum
  ('beginner', 'elementary', 'intermediate', 'advanced', 'native');

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  country_code  text,                       -- ISO 3166-1 alpha-2
  interests     text[] not null default '{}',
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create table public.profile_native_languages (
  profile_id    uuid references public.profiles (id) on delete cascade,
  language_code text references public.languages (code),
  primary key (profile_id, language_code)
);

create table public.profile_learning_languages (
  profile_id    uuid references public.profiles (id) on delete cascade,
  language_code text references public.languages (code),
  level         proficiency_level not null default 'beginner',
  primary key (profile_id, language_code)
);

-- ============================================================================
-- Matching
-- ============================================================================

create table public.match_decisions (
  actor_id   uuid references public.profiles (id) on delete cascade,
  target_id  uuid references public.profiles (id) on delete cascade,
  decision   text not null check (decision in ('like', 'pass')),
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id)
);

-- ============================================================================
-- Conversations & messages
-- ============================================================================

create table public.conversations (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  pinned_message_id  uuid
);

create table public.conversation_participants (
  conversation_id uuid references public.conversations (id) on delete cascade,
  user_id         uuid references public.profiles (id) on delete cascade,
  last_read_at    timestamptz,
  hidden          boolean not null default false,
  primary key (conversation_id, user_id)
);

create type message_type as enum ('text', 'image', 'audio', 'call_audio', 'call_video');
create type call_status  as enum ('completed', 'missed', 'declined');

create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.conversations (id) on delete cascade,
  sender_id           uuid not null references public.profiles (id) on delete cascade,
  reply_to_message_id uuid references public.messages (id) on delete set null,
  type                message_type not null default 'text',
  text                text not null default '',
  media_url           text,
  call_status         call_status,
  call_duration       integer,             -- seconds
  created_at          timestamptz not null default now()
);
create index on public.messages (conversation_id, created_at desc);

create table public.message_reactions (
  message_id uuid references public.messages (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- The differentiator: corrections attached to a message.
create table public.corrections (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid not null references public.messages (id) on delete cascade,
  author_id      uuid references public.profiles (id) on delete set null,
  source         text not null default 'partner' check (source in ('partner', 'ai')),
  original_text  text not null,
  corrected_text text not null,
  note           text,
  created_at     timestamptz not null default now()
);
create index on public.corrections (message_id);

-- ============================================================================
-- Safety
-- ============================================================================

create table public.blocks (
  blocker_id uuid references public.profiles (id) on delete cascade,
  blocked_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references public.profiles (id) on delete cascade,
  reported_id  uuid references public.profiles (id) on delete cascade,
  reason       text not null,
  details      text,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- Helpers & triggers
-- ============================================================================

-- True if the calling user belongs to a conversation. SECURITY DEFINER so it
-- can read participants without tripping that table's own RLS (avoids
-- recursive policy evaluation).
create or replace function public.is_participant(conv uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv and user_id = auth.uid()
  );
$$;

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bump conversation.updated_at on every new message.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.languages                   enable row level security;
alter table public.profiles                     enable row level security;
alter table public.profile_native_languages     enable row level security;
alter table public.profile_learning_languages   enable row level security;
alter table public.match_decisions              enable row level security;
alter table public.conversations                enable row level security;
alter table public.conversation_participants     enable row level security;
alter table public.messages                      enable row level security;
alter table public.message_reactions             enable row level security;
alter table public.corrections                   enable row level security;
alter table public.blocks                        enable row level security;
alter table public.reports                       enable row level security;

-- Reference data: readable by all signed-in users.
create policy "languages readable" on public.languages
  for select to authenticated using (true);

-- Profiles: anyone signed in can read; you can only write your own.
create policy "profiles readable" on public.profiles
  for select to authenticated using (true);
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- Language link tables: readable by all; writable only for your own profile.
create policy "native langs readable" on public.profile_native_languages
  for select to authenticated using (true);
create policy "native langs write own" on public.profile_native_languages
  for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "learning langs readable" on public.profile_learning_languages
  for select to authenticated using (true);
create policy "learning langs write own" on public.profile_learning_languages
  for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Match decisions: you manage only your own.
create policy "match decisions own" on public.match_decisions
  for all to authenticated using (actor_id = auth.uid()) with check (actor_id = auth.uid());

-- Conversations: visible only to participants.
create policy "conversations visible to participants" on public.conversations
  for select to authenticated using (public.is_participant(id));

-- Participants: you can see participant rows of conversations you're in.
create policy "participants visible" on public.conversation_participants
  for select to authenticated using (public.is_participant(conversation_id));
create policy "participants update own" on public.conversation_participants
  for update to authenticated using (user_id = auth.uid());

-- Messages: read if you're in the conversation; send only as yourself.
create policy "messages readable by participants" on public.messages
  for select to authenticated using (public.is_participant(conversation_id));
create policy "messages insert by participant sender" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_participant(conversation_id));

-- Reactions: read if you can read the message; write your own.
create policy "reactions readable" on public.message_reactions
  for select to authenticated using (
    exists (select 1 from public.messages m
            where m.id = message_id and public.is_participant(m.conversation_id))
  );
create policy "reactions write own" on public.message_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Corrections: read if you can read the message; create as yourself.
create policy "corrections readable" on public.corrections
  for select to authenticated using (
    exists (select 1 from public.messages m
            where m.id = message_id and public.is_participant(m.conversation_id))
  );
create policy "corrections insert own" on public.corrections
  for insert to authenticated with check (author_id = auth.uid());

-- Blocks & reports: you manage only your own.
create policy "blocks own" on public.blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "reports insert own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ============================================================================
-- Realtime: stream new messages to subscribed clients.
-- ============================================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;
