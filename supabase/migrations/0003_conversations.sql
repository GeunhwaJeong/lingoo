-- get_conversations() — the chat list for the current user, with the other
-- participant, the last message, and an unread count. SECURITY DEFINER so the
-- aggregation can run cleanly; every row is still scoped to auth.uid().
create or replace function public.get_conversations()
returns table (
  id           uuid,
  updated_at   timestamptz,
  partner      jsonb,
  last_message jsonb,
  unread_count int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.updated_at,
    (select to_jsonb(x) from (
        select pr.id, pr.username, pr.display_name, pr.avatar_url, pr.country_code,
               (pr.last_seen_at > now() - interval '5 minutes') as is_online
        from public.conversation_participants cp2
        join public.profiles pr on pr.id = cp2.user_id
        where cp2.conversation_id = c.id and cp2.user_id <> auth.uid()
        limit 1
     ) x) as partner,
    (select to_jsonb(m) from (
        select id, text, type, sender_id, created_at
        from public.messages
        where conversation_id = c.id
        order by created_at desc
        limit 1
     ) m) as last_message,
    (select count(*) from public.messages m
       where m.conversation_id = c.id
         and m.sender_id <> auth.uid()
         and (cp.last_read_at is null or m.created_at > cp.last_read_at)
    )::int as unread_count
  from public.conversations c
  join public.conversation_participants cp
    on cp.conversation_id = c.id and cp.user_id = auth.uid()
  order by c.updated_at desc;
$$;

-- Stream corrections too, so a partner's correction appears live.
alter publication supabase_realtime add table public.corrections;
