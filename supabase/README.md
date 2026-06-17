# lingoo backend (Supabase)

Postgres + Auth + Realtime + Storage, managed by Supabase. No server to run —
the mobile app talks to Supabase directly, and **Row Level Security** decides
what each user can read/write.

## Files

- `migrations/0001_init.sql` — schema, triggers, and RLS policies.
- `seed.sql` — common languages for the reference table.

## Set up (two options)

### A. Cloud project (fastest)

1. Create a project at https://supabase.com → note the **Project URL** and
   **anon key** (Project Settings → API).
2. Open the SQL Editor and run `migrations/0001_init.sql`, then `seed.sql`.
3. Put the URL + anon key in `apps/mobile/.env` (see `.env.example`).

### B. Local dev with the Supabase CLI

```bash
brew install supabase/tap/supabase
supabase init          # if not already initialized
supabase start         # spins up local Postgres + Auth + Studio
supabase db reset      # applies migrations/ then seed.sql
```

Use the local URL + anon key printed by `supabase start`.

## Data model (high level)

```
auth.users ──1:1── profiles ──< profile_native_languages
                           └──< profile_learning_languages
profiles ──< match_decisions >── profiles      (like / pass)
conversations ──< conversation_participants >── profiles
conversations ──< messages ──< message_reactions
                          └──< corrections      ← lingoo's differentiator
profiles ──< blocks / reports
```

## Security model

- RLS is **on for every table**; the anon key alone can do nothing unauthorized.
- A user can only read conversations/messages they participate in
  (`public.is_participant()`).
- Messages can only be inserted with `sender_id = auth.uid()`.
- New `auth.users` automatically get a `profiles` row (`handle_new_user` trigger).
- New messages are streamed via Supabase Realtime.
