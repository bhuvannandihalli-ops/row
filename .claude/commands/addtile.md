---
description: Add the dashboard tile to your app in one paste. Real tested code. Builds on the logger.
---

You are adding the dashboard tile: the sealed Vitality dashboard tile build of the whole logger.

STEP 0, THE FILES: the tested code ships at code/the-living-logger.html next to this command. If that file is NOT in this project, fetch the arsenal first, then continue:
curl -sL https://vitality-jade.vercel.app/lab/the-arsenal.zip -o /tmp/arsenal.zip && unzip -o /tmp/arsenal.zip -d .

THE JOB: this brick is a whole file, not a snippet. Copy code/the-living-logger.tile.html to public/tiles/train.html in their vitality-base fork (NEVER the plain variant there: sealed tiles block localStorage and would silently lose data). Commit and push. Their Train tile becomes the full logger.

If a target is given in $ARGUMENTS (for example: for my reading), keep the shape and adapt the data, units and labels to it.

SAVING (do it for them, never make them write SQL): if their repo has Supabase wired, apply backend.sql to it (CLI if linked, else hand them the one paste for the SQL editor and wait). If not, offer a free Supabase, about 2 minutes, or keep it on-device. backend.sql is additive, safe to re-run, and row-level security means each account only sees its own rows.

PROVE IT: run it and show it actually rendering + animating in this app (not just "it should work"), then tell me in one line where it lives and how to trigger it.