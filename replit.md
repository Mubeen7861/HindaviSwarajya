# HindaviSwarajya — Community Seva Platform

## Overview

Full-stack community seva (service) social platform built as a pnpm workspace monorepo. Brand color: #FF6F00 (saffron orange). Hindi logo: "हिंदवी स्वराज्य".

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (port 22709, proxied at `/`)
- **API framework**: Express 5 (port 8080, proxied at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle)
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **Typography**: `@fontsource/metropolis` (300–800) for English; `Mukta` + `Tiro Devanagari Marathi` (Google Fonts) for Devanagari script
- **i18n**: `i18next` + `react-i18next` + `i18next-browser-languagedetector` (English + Marathi)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run push-force` — same, force-apply (used when adding NOT NULL columns to empty tables)

### Database workflow

This project uses **Drizzle push-only** (no migration files). Schema changes in `lib/db/src/schema/*.ts` are applied directly via `push` / `push-force`. There is no `drizzle/` migrations directory — `drizzle.config.ts` is configured for push mode.

## Artifacts

| Artifact | Path | Description |
|---|---|---|
| `hindavi-swarajya` | `/` | React frontend |
| `api-server` | `/api` | Express backend |

## Authentication

Clerk auth (development keys). Env vars set:
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key (secret)
- `CLERK_SECRET_KEY` — Clerk secret key (secret)
- `VITE_CLERK_PUBLISHABLE_KEY` is injected at build time via vite.config.ts `define` from `CLERK_PUBLISHABLE_KEY`
- `SESSION_SECRET` — Express session secret

Clerk proxy middleware at `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`.

## Pages & Routes

| Route | Component | Auth | Description |
|---|---|---|---|
| `/` | `Landing.tsx` | Public (guests) | Marketing landing page; signed-in users → `/app` |
| `/sign-in/*?` | `SignInPage.tsx` | Public | Clerk sign-in |
| `/sign-up/*?` | `SignUpPage.tsx` | Public | Clerk sign-up |
| `/app` | `Home.tsx` | Protected | Seva Feed — post feed, leaderboard, trending tags |
| `/app/create` | `CreatePost.tsx` | Protected | Create a seva post |
| `/app/post/:id` | `PostDetail.tsx` | Protected | Post detail with comments |
| `/app/events` | `Events.tsx` | Protected | Seva events — browse, register, create |
| `/app/help` | `HelpRequests.tsx` | Protected | Help requests — emergency + normal, join/create |
| `/app/community` | `Community.tsx` | Protected | Discussions, teachings, Top Sevaks leaderboard |
| `/app/leaderboard` | `Leaderboard.tsx` | Protected | Full leaderboard |
| `/app/profile/:id` | `Profile.tsx` | Protected | User profile |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/me` | Get current authenticated user (401 if not signed in) |
| PATCH | `/api/me` | Update current user (name, bio, location) |
| GET | `/api/posts` | List seva posts (filter, search, sort) |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post with comments |
| PATCH | `/api/posts/:id` | Update own post (author-only, validated via zod) |
| DELETE | `/api/posts/:id` | Delete own post (author-only, transactional counter rollback) |
| GET | `/api/me/posts` | List the current user's own posts (any approval status) |
| GET | `/api/me/events` | List the current user's own events (any approval status) |
| GET | `/api/me/help-requests` | List the current user's own help requests (any approval status) |
| PATCH | `/api/events/:id` | Update own event (organizer-only) |
| DELETE | `/api/events/:id` | Delete own event (organizer-only) |
| PATCH | `/api/help-requests/:id` | Update own help request (requester-only) |
| DELETE | `/api/help-requests/:id` | Delete own help request (requester-only) |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comments` | Add comment |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/users/:id/follow` | Follow/unfollow user |
| GET | `/api/leaderboard` | Get leaderboard |
| GET | `/api/stats/summary` | Platform stats |
| GET | `/api/tags/trending` | Trending tags |
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| GET | `/api/events/:id` | Get event |
| POST | `/api/events/:id/register` | Register/unregister for event |
| GET | `/api/help-requests` | List help requests |
| POST | `/api/help-requests` | Create help request |
| POST | `/api/help-requests/:id/join` | Join/leave help request |

## DB Schema Tables

- `users` — user profiles with rank, totalHelped, etc. `clerkId` is unique NOT NULL; row is auto-provisioned on first authenticated request.
- `posts` — seva posts with category, location, peopleHelped
- `comments` — post comments
- `likes` — post likes
- `follows` — user follows
- `tags` + `post_tags` — tag system
- `events` — seva events with date/time/location/status
- `event_registrations` — event volunteer registrations
- `event_tags` — event tags
- `help_requests` — help requests with urgency/status
- `help_request_joins` — helpers who joined a request

## Current User

The signed-in Clerk user is the source of truth. On the server, `requireAuth` (in `artifacts/api-server/src/middlewares/requireAuth.ts`) verifies the Clerk session, looks up the DB user by `users.clerkId`, lazily provisions the row from the Clerk profile if missing, and attaches `req.dbUser`. On the client, `useCurrentUser()` / `useCurrentUserId()` (in `artifacts/hindavi-swarajya/src/hooks/useCurrentUser.ts`) wrap the generated `useGetMe()` hook (gated by `useAuth().isSignedIn`). The Profile route at `/app/profile/me` resolves to the signed-in user.

The Orval custom-fetch (`lib/api-client-react/src/custom-fetch.ts`) defaults `credentials: "include"` so all generated client calls send the Clerk session cookie automatically.

There is no global hardcoded current-user constant. No mutating endpoint trusts user IDs from the request body — they are always derived from `req.dbUser.id`.

To guarantee that the DB row is provisioned the moment a user reaches the app (not just when they call a mutating endpoint), `App.tsx`'s `AppLayout` mounts an `EnsureUserProvisioned` component that calls `useCurrentUser()` unconditionally. The first `GET /api/me` triggers `requireAuth.resolveOrProvisionUser` which inserts the user row.

## Internationalization (i18n)

The frontend supports **English** and **Marathi (मराठी)**.

- Setup: `artifacts/hindavi-swarajya/src/i18n/index.ts` — initialises i18next with `LanguageDetector` (localStorage key `hs.lang`, then `navigator`, then `htmlTag`). Exports `SUPPORTED_LANGUAGES` and a `LanguageCode` type. On every language change, sets `<html lang>` and `<html data-lang>` so CSS can react.
- Locales: `src/i18n/locales/en.ts` is the **source of truth** — its inferred type `Translation` is exported and `mr.ts` is typed as `Translation`, guaranteeing key parity at build time. Namespaces: `brand`, `common`, `nav`, `home`, `post`, `profile`, `auth`.
- Switcher: `src/components/LanguageSwitcher.tsx` — Radix DropdownMenu with variants `icon` / `compact` / `pill`. Mounted in the Sidebar (desktop footer + mobile top bar).
- Devanagari font fallback: `src/index.css` defines `--app-font-sans: 'Metropolis', 'Mukta', ...`; the selector `:lang(mr), [data-lang="mr"]` flips the stack to `'Mukta'`-first so Marathi text gets a font that actually contains Devanagari glyphs. Latin text always picks Metropolis first.
- Adding a string: add the key to `en.ts`, mirror it in `mr.ts` (TypeScript will fail the build otherwise), then call `t("namespace.key")`.

## Mobile / Native-feel UI

- `index.html` sets `viewport-fit=cover`, `theme-color=#FF6F00`, and `apple-mobile-web-app-capable=yes` for an installed-app feel.
- `src/index.css` adds safe-area utilities `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe` (using `env(safe-area-inset-*)`), `.glass-bar` (translucent backdrop-blur for fixed bars), `.no-scrollbar`, `.tap-none` (kills the iOS tap-highlight), `.surface` (premium card surface), `.tabular-nums`.
- `Sidebar.tsx` renders three layouts: a desktop sidebar (md+), a glass top bar with brand + language switcher (mobile), and a glass bottom nav with five items including a floating create-FAB (mobile). The bottom nav uses `aria-current="page"` and `aria-label` per item.
- `App.tsx` reserves space with `pb-[calc(60px+env(safe-area-inset-bottom,0))]` and `h-[calc(56px+env(safe-area-inset-top,0))]` so content never sits under the fixed bars.

## Codegen Notes

- Orval `zod` output uses `mode: "single"` (not split) to avoid generating an index.ts that references non-existent files
- `lib/api-zod/src/index.ts` exports only `./generated/api` (no `api.schemas`)
- `lib/api-client-react/src/index.ts` exports from both `./generated/api` and `./generated/api.schemas`
