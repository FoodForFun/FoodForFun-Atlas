# FoodForFun Atlas - Agent Guide

## Project purpose

FoodForFun Atlas is a human-centered food knowledge network. Preserve the project's emphasis on truthful storytelling, cultural respect, source transparency, privacy, and maintainability. Read `README.md` and the relevant files in `docs/` before changing product behavior or scope; do not expand the MVP as part of unrelated work.

## Stack and structure

- Next.js 16 App Router, React 19, and strict TypeScript.
- Supabase provides the database and Row Level Security (RLS).
- `app/` contains routes, layouts, global styles, and server-side application helpers.
- `app/_lib/stories.ts` is the read boundary for public Story data.
- `app/_lib/supabase/server.ts` creates the server-only public Supabase client.
- `supabase/migrations/` contains immutable, timestamped database migrations.
- `docs/` records product, data-model, workflow, frontend, deployment, and testing decisions.
- Use the `@/*` import alias for repository-root imports where it improves clarity.

## Implementation conventions

- Prefer Server Components. Add `"use client"` only when browser state, effects, or event handlers require it.
- Keep server-only data access out of client bundles; preserve `server-only` imports in server helpers.
- Select only the database columns a page needs and handle expected empty, not-found, configuration-error, and query-error states deliberately.
- Public Story access must continue to rely on RLS. Never emulate access control only in UI code.
- Keep pages semantic and accessible: meaningful headings, labels, link text, alternative text, and status/error messaging are required.
- Follow the existing formatting style: two-space indentation, double quotes, semicolons, trailing commas, and focused, descriptive names.
- Avoid new dependencies unless they are necessary and justified.
- Update relevant documentation when behavior, configuration, data structures, security assumptions, or workflows change.

## Database and security rules

- Never expose a Supabase service-role or administrative credential to browser code.
- Never commit `.env.local`, secrets, tokens, production data, or credentials. Use `.env.example` for documented variable names and safe placeholders.
- Treat migrations as append-only once shared. Add a new timestamped migration instead of rewriting migration history.
- Review every schema or policy change for anonymous read/write behavior, draft visibility, future publication dates, and least privilege.
- Preserve verified human content and provenance; do not invent facts or silently overwrite editorial work.

## Autonomous workflow

When the user gives a clear implementation goal, handle the normal development workflow autonomously.

### Before implementation

- Read `README.md`, `CONTRIBUTING.md`, this file, and the relevant files in `docs/`.
- Inspect the current Git status and branch, preserving unrelated user work.
- Sync the latest `main` when it is safe to do so.
- Use an existing GitHub Issue when one clearly matches the requested work. Do not create duplicate Issues.
- If no suitable Issue exists and GitHub CLI is available, create one with a concise objective, scope, and acceptance criteria.
- Create a focused branch from the latest `main`, using the branch naming conventions in `CONTRIBUTING.md`.

### During implementation

- Make only the changes required for the requested goal.
- Preserve unrelated user work.
- Run routine Git, npm, validation, and testing commands directly instead of asking the user to copy commands manually.
- On Windows PowerShell, use `npm.cmd` rather than `npm` for npm commands.
- Install dependencies only when necessary; keep additions minimal and justified.
- Update documentation when implementation decisions materially change it.
- Follow `CONTRIBUTING.md` for commit, pull-request, documentation, and definition-of-done conventions.

### Before finishing

- Run `npm.cmd audit`, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.
- Inspect `git status` and the complete diff.
- Perform relevant local functional testing.
- Restore unrelated generated files, such as `next-env.d.ts`, when they are not part of the requested change.
- Verify that `.env.local`, credentials, secrets, tokens, and local-only files are not included.

There is no automated test script yet. For UI changes, also run `npm.cmd run dev` and manually verify the affected route, responsive behavior, loading/empty/error states, browser console, and accessibility basics. For database changes, verify the migration and RLS behavior with both allowed and denied cases.

Do not claim a check passed unless it was actually run. Report checks that could not be run and why.

If validation passes and GitHub access is available:

- Commit using the repository commit-message convention.
- Push the focused branch.
- Create or update the Pull Request.
- Include what changed, why, validation results, documentation effects, dependency effects, and security/privacy effects in the Pull Request description.
- Inspect available GitHub checks and Vercel Preview status.
- Stop before merging.

Never merge a Pull Request into `main` unless the user explicitly approves the merge.

## Actions requiring explicit user approval

Stop and ask before:

- merging into `main`;
- force-pushing;
- deleting remote branches, except after an approved merge;
- deleting or rewriting production data;
- dropping database tables or columns;
- running a linked Supabase database reset;
- applying a destructive migration;
- modifying production secrets or credentials;
- using a Supabase service-role or secret key;
- changing production infrastructure or domain configuration;
- running `npm audit fix --force`;
- performing major dependency upgrades not required by the requested task; or
- weakening authentication, authorization, RLS, or privacy controls.

Normal non-destructive migrations may be created and validated autonomously.

A remote database migration may be applied only when it is clearly non-destructive, matches the approved Issue scope, has passed a dry run or equivalent review, and does not delete or rewrite existing production data. Otherwise, ask first.

## GitHub workflow

When GitHub CLI is available, prefer it for routine repository workflow instead of requiring manual browser steps.

The agent may autonomously:

- inspect Issues and Pull Requests;
- create a focused Issue when one does not already exist;
- create branches;
- commit;
- push;
- create Pull Requests;
- update Pull Request descriptions; and
- inspect checks and review status.

The agent must not merge without explicit user approval.

## Completion report

At the end of a task, give the user a concise report containing:

- what was implemented;
- important design decisions;
- validation results;
- Preview status when available;
- the commit and Pull Request; and
- anything that still requires user approval.

Do not make the user repeat routine Git, npm, validation, or Pull Request steps that the agent can safely perform directly.
