# Weekly Wiki Roundup — Reusable Prompt

A reusable prompt for generating the **Dev Diary** weekly roundup on the
`tommyroar.github.io` GitHub wiki, styled like an entertainment blog.

Run it at the end of each ISO week (or whenever you want a recap). Paste the
prompt below into Claude Code from the repo root.

---

## The Prompt

> Summarize this week's major project updates into a new entertainment-blog-styled
> "Dev Diary" post on the GitHub wiki, and update the wiki Home page to link it.
>
> **Gather the material:**
> 1. Find the current ISO week and its Monday–Sunday date range:
>    `date +"%G-W%V"` and `date -j -v-mon -f "%Y-%m-%d" "$(date +%Y-%m-%d)" "+%Y-%m-%d"` (start).
> 2. List this week's commits, newest first:
>    `git log --since="<monday>" --until="<next-monday>" --date=short --pretty=format:"%h|%ad|%s%n%b"`.
> 3. **Ignore the noise.** Automated commits matching `uptime: <timestamp> [skip ci]`
>    (and any other bot/CI churn) are NOT stories — but DO count them and give the
>    bots a fun shout-out line. The real headlines are `feat:`, `fix:`, reverts,
>    new workflows, new targets, and anything human-authored. Read `git show --stat`
>    on the substantive commits to get the real details.
>
> **Write the post (entertainment-blog voice):**
> - Treat features/fixes like celebrities, premieres, scandals, cameos, spinoffs.
>   Use a "breakout star", "scandal of the week", "cameo that got cut" (for reverts),
>   "season finale teaser", star ratings, emoji, and a "by the numbers" table.
> - Keep every claim factually grounded in the actual commits — the *framing* is
>   playful, the *facts* are real. Reference real file/workflow/target names.
> - End with a "Next Week On…" teaser of open threads (pending secrets, TBD URLs, etc.)
>   and a footer linking back to this prompt.
>
> **Publish to the wiki** (the wiki is a separate git repo; default branch `master`):
> 1. `cd /tmp && rm -rf wiki-clone && git clone git@github.com:tommyroar/tommyroar.github.io.wiki.git wiki-clone`
> 2. Write the post to `/tmp/wiki-clone/Dev-Diary-<YYYY>-W<WW>.md`.
> 3. Add a bullet for it under "Dev Diary — Weekly Roundups" in `/tmp/wiki-clone/Home.md`
>    (newest at top), linking `[Dev Diary <YYYY>-W<WW>](Dev-Diary-<YYYY>-W<WW>)` with a one-line teaser.
> 4. Commit and push from the wiki clone:
>    `git -C /tmp/wiki-clone add -A && git -C /tmp/wiki-clone commit -m "Dev Diary <YYYY>-W<WW>" && git -C /tmp/wiki-clone push`
>
> Report the published wiki URL:
> `https://github.com/tommyroar/tommyroar.github.io/wiki/Dev-Diary-<YYYY>-W<WW>`

---

## Notes & conventions

- **Wiki pages are a separate repo.** `…/tommyroar.github.io.wiki.git`, default
  branch `master`. Page filename → page title with dashes shown as spaces. Internal
  wiki links use the page name without `.md` (e.g. `[text](Dev-Diary-2026-W22)`).
- **Naming:** `Dev-Diary-<ISO-year>-W<ISO-week>.md` (e.g. `Dev-Diary-2026-W22.md`).
- **Noise filter:** the uptime probe commits dozens of `[skip ci]` rows weekly —
  count them for a bot shout-out, never list them individually.
- **Tone:** playful framing, factual substance. Don't invent features that didn't ship.
- **First run reference:** `Dev-Diary-2026-W22` (week of May 25–31, 2026).
