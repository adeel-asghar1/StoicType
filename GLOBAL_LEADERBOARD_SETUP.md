# StoicType global leaderboard setup

The app keeps personal history, player name, theme, and preferences in the browser.
Only the global leaderboard uses a shared backend.

## Free deployment stack

- Next.js app: Vercel Hobby
- Shared leaderboard database: Supabase Free
- No authentication
- No paid services required for normal hobby/portfolio traffic

## 1. Create the Supabase database

1. Create a free Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/leaderboard.sql`.
4. Open **Project Settings → API**.
5. Copy:
   - Project URL
   - service-role key

## 2. Configure local development

Copy `.env.example` to `.env.local` and fill in:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Never expose the service-role key in browser code and never rename it to `NEXT_PUBLIC_*`.

## 3. Configure Vercel

Add the same two environment variables to the Vercel project for Production (and Preview if desired), then redeploy.

## How it works

The browser still stores:
- player name
- personal test history
- personal statistics
- selected theme

When a test finishes, StoicType sends the result to `/api/leaderboard`.
The Next.js server validates it and writes only the player's best score to Supabase.

The leaderboard page reads the shared scores from `/api/leaderboard` and refreshes every 30 seconds.

If the backend is not configured, the app automatically falls back to the local leaderboard instead of breaking.

## Important limitation

This is intentionally a simple public leaderboard, not an anti-cheat system. A determined user can fake a score by calling the endpoint directly. The server performs basic validation, but StoicType does not use accounts or a sophisticated anti-cheat system.

## Free-tier note

The intended hobby/portfolio deployment can stay at $0 while it remains within the free-plan limits of the hosting providers. Free plans are not unlimited and can change. Supabase Free projects can pause after one week of inactivity, so an inactive project may need to wake up when visited again.
