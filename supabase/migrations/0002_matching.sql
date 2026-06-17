-- Matching + conversation bootstrap.
-- These run as SECURITY DEFINER so they can do cross-row work (scoring,
-- creating both participant rows) that table-level RLS would otherwise block,
-- while still keying everything off auth.uid() so a user only acts as themselves.

-- ---------------------------------------------------------------------------
-- get_match_candidates() — people whose languages complement yours.
-- Score: +45 if they speak (natively) something you're learning,
--        +45 if they're learning something you speak natively,
--        +10 if you share an interest. Capped at 100.
-- ---------------------------------------------------------------------------
create or replace function public.get_match_candidates(limit_count int default 20)
returns table (
  id                 uuid,
  username           text,
  display_name       text,
  avatar_url         text,
  country_code       text,
  is_online          boolean,
  native_languages   jsonb,
  learning_languages jsonb,
  compatibility_score int
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select
      array(select language_code from profile_native_languages   where profile_id = auth.uid()) as my_native,
      array(select language_code from profile_learning_languages where profile_id = auth.uid()) as my_learning,
      coalesce((select interests from profiles where id = auth.uid()), '{}') as my_interests
  )
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.country_code,
    (p.last_seen_at > now() - interval '5 minutes') as is_online,
    coalesce((select jsonb_agg(jsonb_build_object('code', language_code))
              from profile_native_languages where profile_id = p.id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('code', language_code, 'level', level))
              from profile_learning_languages where profile_id = p.id), '[]'::jsonb),
    least(
      100,
      (case when me.my_learning && array(select language_code from profile_native_languages   where profile_id = p.id) then 45 else 0 end)
    + (case when me.my_native   && array(select language_code from profile_learning_languages where profile_id = p.id) then 45 else 0 end)
    + (case when me.my_interests && p.interests then 10 else 0 end)
    )::int as compatibility_score
  from public.profiles p, me
  where p.id <> auth.uid()
    and not exists (
      select 1 from public.match_decisions d
      where d.actor_id = auth.uid() and d.target_id = p.id
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by compatibility_score desc, p.created_at desc
  limit limit_count;
$$;

-- ---------------------------------------------------------------------------
-- start_conversation(other_user) — get-or-create a 1:1 conversation and
-- record a 'like'. Returns the conversation id. Idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.start_conversation(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if other_user = me then
    raise exception 'cannot start a conversation with yourself';
  end if;

  -- Existing 1:1 conversation between exactly these two users?
  select c.id into conv
  from public.conversations c
  join public.conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = me
  join public.conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = other_user
  where (select count(*) from public.conversation_participants p where p.conversation_id = c.id) = 2
  limit 1;

  if conv is null then
    insert into public.conversations default values returning id into conv;
    insert into public.conversation_participants (conversation_id, user_id) values (conv, me), (conv, other_user);
  end if;

  -- Record the like (idempotent).
  insert into public.match_decisions (actor_id, target_id, decision)
  values (me, other_user, 'like')
  on conflict (actor_id, target_id) do update set decision = 'like';

  return conv;
end;
$$;
