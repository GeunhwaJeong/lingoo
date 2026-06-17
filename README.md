# lingoo

A clean, ad-light **language exchange** app for iOS, Android, and Web — built to
fix what annoys people about HelloTalk (heavy UI, message caps, spam) and Meeff
(fake accounts, ad overload). One TypeScript codebase, one backend.

> Positioning: *"the serious-but-friendly language exchange — no spam, no
> clutter, with built-in corrections (partner or AI)."*

## Monorepo layout

```
lingoo/
├── apps/
│   └── mobile/         Expo + React Native app (iOS / Android / Web)
│       └── src/
│           ├── alf/         design system (themes, tokens, atoms)
│           ├── components/   Text, Button, ...
│           ├── screens/      Welcome, Discover, Chats, Profile
│           ├── navigation/   root navigator (auth gate + tabs)
│           └── lib/          supabase client, auth context
├── packages/
│   └── shared/         TypeScript domain types shared by app + backend
└── supabase/           Postgres schema + RLS + seed (the backend)
```

Why a monorepo: `@lingoo/shared` holds the domain types (Message, Profile, …).
Both the app and any backend code import them, so a change to a data shape
breaks the typecheck on both sides until they agree.

## Tech stack

| Layer    | Choice |
|----------|--------|
| App      | Expo (SDK 54) + React Native — one codebase → iOS, Android, Web |
| Nav      | React Navigation v7 |
| Data     | TanStack Query + Supabase JS |
| Backend  | Supabase (Postgres + Auth + Realtime + Storage) |
| Design   | `alf` — Tailwind-style atoms, t-shirt sizing, light/dark themes |

## Getting started

```bash
# 1. install
pnpm install

# 2. backend — see supabase/README.md, then:
cp apps/mobile/.env.example apps/mobile/.env   # fill in Supabase URL + anon key

# 3. run (pick one)
pnpm web        # browser
pnpm ios        # iOS simulator (Mac)
pnpm android    # Android emulator
```

## Status

Skeleton in place: design system, auth gate (magic-link), tab navigation,
themed components, and the full backend schema with RLS. Screens currently use
placeholder data — next step is wiring the Supabase queries (matching, chat,
corrections) into the screens.
