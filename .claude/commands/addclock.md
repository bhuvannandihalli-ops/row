---
description: Add the rest timer to your app in one paste. Real tested code. Builds on the logger.
---

You are adding the rest timer: the ring that counts your rest between sets and arms the next set.

STEP 0, THE FILES: the tested code ships at code/the-living-logger.html next to this command. If that file is NOT in this project, fetch the arsenal first, then continue:
curl -sL https://vitality-jade.vercel.app/lab/the-arsenal.zip -o /tmp/arsenal.zip && unzip -o /tmp/arsenal.zip -d .

THE JOB (make it drop cleanly into ANY app, self-contained):
1. Open code/the-living-logger.html and take the region between <!-- @episode-start:rest-timer --> and <!-- @episode-end:rest-timer -->.
2. Bring EVERYTHING that region needs to work on its own: the HTML, every CSS rule it uses (search the file's <style> for each class name in the region), AND every JS function it calls (search the <script>; follow helper calls one level deep so nothing is left undefined). If unsure, grab more, not less.
3. RE-SKIN it to THIS app, do not paste copper-on-black into a light app. Map the colors and the two or three fonts to the target's existing design tokens (CSS variables, Tailwind theme, whatever they use). Keep the shape and the motion, change only the palette and type so it looks native here.
4. Wire it into one screen and make it self-contained: no reference to the-radar's other regions, no dead variables. It must run even if this is the only piece installed.
5. Respect reduced-motion (keep the @media (prefers-reduced-motion) guard).
Add only. Never rebuild or break what already exists.

If a target is given in $ARGUMENTS (for example: for my reading), keep the shape and adapt the data, units and labels to it.

SAVING (do it for them, never make them write SQL): if their repo has Supabase wired, apply backend.sql to it (CLI if linked, else hand them the one paste for the SQL editor and wait). If not, offer a free Supabase, about 2 minutes, or keep it on-device. backend.sql is additive, safe to re-run, and row-level security means each account only sees its own rows.

PROVE IT: run it and show it actually rendering + animating in this app (not just "it should work"), then tell me in one line where it lives and how to trigger it.
