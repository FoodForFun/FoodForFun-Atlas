# FoodForFun Atlas — Deployment

This document describes the current deployment architecture, Vercel configuration, environment handling, and review workflow for FoodForFun Atlas.

## Deployment Architecture

FoodForFun Atlas uses three environments:

```text
Local development
      ↓
Preview deployment
      ↓
Production deployment
```

- Local development runs on the developer's computer.
- Preview Deployments are created from non-production branches and Pull Requests.
- Production Deployments are created from the `main` branch.
- GitHub stores and manages the source code.
- Vercel builds and hosts the Next.js application.

## Current Vercel Project Configuration

| Setting | Current configuration |
| --- | --- |
| GitHub repository | `FoodForFun/FoodForFun-Atlas` |
| Framework Preset | Next.js |
| Root Directory | Repository root |
| Production Branch | `main` |
| Build Command | Detected Next.js default |
| Install Command | Detected npm default |
| Output Directory | Detected Next.js default |
| Custom `vercel.json` | Not currently required |
| Public Production URL | `https://food-for-fun-atlas.vercel.app` |
| Custom domain | Not currently configured |

The repository is connected to Vercel. Pull Requests receive isolated Preview
Deployments, and reviewed changes from `main` are published to the stable
Production alias.

## Environments

### Local

Local is used for development and validation on the developer's computer before code is pushed.

Install the committed dependency graph and start the development server:

```bash
npm ci
npm run dev
```

Run the standard local validation commands before sharing a change:

```bash
npm audit --audit-level=high
npm run lint
npm test
npm run build
git diff --check
git status
```

Local secrets belong in `.env.local`. This file must never be committed.

### Preview

Preview Deployments are used to review changes before they are merged. Vercel creates them from non-production branches and Pull Requests without changing the public Production Deployment.

Contributors should verify that:

- the deployment reaches the Ready state;
- the Preview URL loads successfully;
- the expected change is visible;
- unrelated behavior remains unchanged;
- no secrets or local files are exposed; and
- browser and deployment logs show no relevant errors.

Temporary or commit-specific Preview URLs should not be permanently committed to documentation.

### Production

Production represents the `main` branch and the current public version of FoodForFun Atlas.

Production changes should normally occur only after:

- the Pull Request is reviewed;
- the Application and Database GitHub Actions jobs pass;
- local validation passes;
- the Preview Deployment is verified; and
- the Pull Request is merged into `main`.

After a merge, verify that the resulting Production Deployment succeeds and that the public site works as expected.

## Environment Variables and Secrets

- Public reads and protected Admin sessions require `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Local, Preview, and Production
  environments.
- Do not commit `.env.local`.
- Do not commit passwords, API keys, tokens, or credentials.
- Do not add empty placeholder variables to Vercel.
- Configure Vercel environment variables only when the related service is implemented.
- Keep Preview and Production values separated when appropriate.
- Never expose service-role or administrative keys to browser code.
- Redeploy after changing environment variables when required for the new values to take effect.

Before opening a Pull Request, inspect the diff and repository status for secrets, generated files, and local environment files.

Application deployment and database deployment remain separate operations.
Vercel builds must not apply Supabase migrations, alter Production data, or use
service-role credentials. Database changes require their own reviewed migration,
isolated local pgTAP validation, backup-aware operational approval, and explicit
Production execution outside the application deployment workflow.

## Deployment Review Workflow

1. Create or update a focused branch.
2. Push the branch to GitHub.
3. Wait for the independent Application and Database GitHub Actions jobs.
4. Wait for the Vercel Preview Deployment.
5. Review the validation and deployment logs.
6. Open and test the Preview URL.
7. Record validation results in the Pull Request.
8. Merge only after review.
9. Verify the Production Deployment after merging.

Deployment checks should be recorded alongside the local validation commands and any relevant manual checks.

## Current Limitations

- The public homepage, Story routes, directories, entity pages, `/search`, and
  `/map` have read-only Supabase access.
- Public queries rely on Row Level Security, column grants, bounded database
  functions where required, and only the publishable public credential.
- Invite-only email/password authentication, Publisher TOTP, and protected
  Story, Source, Theme, relationship, and Place editing are implemented under
  `/admin`.
- Protected writes use reviewed Phase A database functions. The application
  does not use direct table writes, a service-role client, or Auth Admin APIs.
- User invitation and role management, image uploads, and revision screens are
  not implemented in the application.
- No custom domain is configured.
- No analytics or monitoring service is configured.
- Deployment success does not replace application, security, access-control, or content review.

These limitations should be addressed only through their related roadmap phases and focused GitHub Issues.
