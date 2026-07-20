---
description: Install the whole finished supplement stack into your app in one command. Adapts to anything you take daily. Run "/fuel update" any time to pull the newest version.
---

You are installing THE STACK: the Fuel tile's tracker, every fuel brick shipped so far, wired to one saved store.

THE REAL CODE: the complete, tested stack ships beside this command at
code/the-living-stack.html.

DEFAULT INSTALL IS A COPY, NOT A REBUILD. Save the user's tokens: when
installing as built, do NOT read that file into context. Copy the right
variant directly into place:
- Vitality base fork (dashboard): copy code/the-living-stack.tile.html to
  public/tiles/fuel.html. It is the same stack with saving routed through
  the dashboard bridge, so it works sealed. NEVER put the plain variant in a
  tile slot: sealed tiles block localStorage and it would silently lose data.
- Anywhere else (their own app or page): copy code/the-living-stack.html.
Then do the small wiring below. Only open the file and extract its marked
regions (@episode-start:checklist, blocks, search, loader, suggest) when
adapting to a target or a different stack. It is real product code from a
shipped app: keep its logic.

DASHBOARD FRESHNESS (vitality-base forks only, check BEFORE the copy): open
app/app/DashboardGrid.tsx and look for the string openFull. If it is missing,
the fork is old and tiles open as a small popup card instead of full screen.
Fix it first: add https://github.com/RowanThistlebrooke/vitality-base as a
remote called upstream, merge its main branch (on conflict keep the user's
public/tiles/ and content/site.ts), then push it together with the tile.
Tell the user in one line: your dashboard was updated too, tiles now open
full screen.

The target is: $ARGUMENTS
- No target: install as built (the copy above). In a Vitality repo, wire the
  tile to report progress to the bridge after each check-off:
  report({ key:'supplements', label:'Stack', value: takenTodayCount, date: todayKey, kind:'count' })
- "update": pull the newest arsenal and refresh everything. Do this:
  1. curl -sL https://vitality-jade.vercel.app/lab/the-arsenal.zip -o /tmp/arsenal.zip && unzip -o /tmp/arsenal.zip -d .
     (refreshes code/, backend.sql and every command in .claude/commands/)
  2. Re-copy the right variant into place, same as install (tile.html for a
     dashboard tile, plain for an app).
  3. Re-apply backend.sql (additive, safe to re-run). The user's data is never touched.
  4. Tell them in one line what is new.
- A target ("for my meds"): keep the shape and rules, adapt the data, units and labels to it.

RULE: add only, one saved store, nothing already there breaks.

SAVING (do this for them, never make them write SQL):
1. If this repo already has Supabase wired (env keys or supabase/ folder), apply backend.sql to it directly (CLI if linked, else their dashboard SQL editor: hand them the one paste and wait).
2. If not, offer two paths: a free Supabase project (walk them through it, ~2 minutes) then apply backend.sql, or keep the on-device version that already works and add the cloud later.
3. backend.sql is additive and safe to re-run. It stamps every row with their account (row-level security), so each person only ever sees their own data.

DO: place the code (copy by default, adapt only when needed); set up saving as above; wire the tile; show it working with one real supplement checked off.

GUARDRAILS (do these every run):

INSTALL FIRST, DO NOT ASK. On the first run, install as built right away. Do not ask what they want, do not survey options, do not explore the repo. Copy, wire, and show it working. One clear result lands before any question.

STAY ON TASK. This is what keeps their cost tiny. Touch only what this install needs. Do not refactor, tidy, rename, or read unrelated files. The only things you read into context are this command and the few wiring targets.

SAFE TO RE-RUN. This command is idempotent. If anything looks off, the fix is always to run /fuel again. Tell them that. Never leave a beginner stuck debugging.

THEN HAND THEM THE WHEEL. After it works, report in one line what landed and what to tap. Then offer at most three concrete next steps as a numbered menu, like: Want to (1) log a supplement, (2) change the look, or (3) leave it as is? Just say the number. Never ask an open "what would you like to do", always give a bounded choice they can answer in one tap.

COST HONESTY. When you finish, state the rough spend in one plain line, like: that used about 60 cents of credits. It builds trust and shows the tool is cheap.

VOICE: no em dashes, no emojis, short human sentences, calm premium feel.