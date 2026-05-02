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

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

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
| GET | `/api/posts` | List seva posts (filter, search, sort) |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post with comments |
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

- `users` — user profiles with rank, totalHelped, etc.
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

`CURRENT_USER_ID = 1` (Rajendra Patil) — defined in `src/lib/constants.ts`

## Codegen Notes

- Orval `zod` output uses `mode: "single"` (not split) to avoid generating an index.ts that references non-existent files
- `lib/api-zod/src/index.ts` exports only `./generated/api` (no `api.schemas`)
- `lib/api-client-react/src/index.ts` exports from both `./generated/api` and `./generated/api.schemas`
