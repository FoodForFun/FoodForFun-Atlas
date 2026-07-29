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
| Custom domain | Not currently configured |

The repository is already connected to Vercel. The initial Production Deployment from `main` completed successfully, and the current homepage loads correctly.

## Environments

### Local

Local is used for development and validation on the developer's computer before code is pushed.

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Run the standard local validation commands before sharing a change:

```bash
npm run lint
npm run build
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
- local validation passes;
- the Preview Deployment is verified; and
- the Pull Request is merged into `main`.

After a merge, verify that the resulting Production Deployment succeeds and that the public site works as expected.

## Environment Variables and Secrets

- Do not commit `.env.local`.
- Do not commit passwords, API keys, tokens, or credentials.
- Do not add empty placeholder variables to Vercel.
- Configure Vercel environment variables only when the related service is implemented.
- Keep Preview and Production values separated when appropriate.
- Never expose service-role or administrative keys to browser code.
- Redeploy after changing environment variables when required for the new values to take effect.

Before opening a Pull Request, inspect the diff and repository status for secrets, generated files, and local environment files.

## Deployment Review Workflow

1. Create or update a focused branch.
2. Push the branch to GitHub.
3. Wait for the Vercel Preview Deployment.
4. Review the deployment status and logs.
5. Open and test the Preview URL.
6. Record validation results in the Pull Request.
7. Merge only after review.
8. Verify the Production Deployment after merging.

Deployment checks should be recorded alongside the local validation commands and any relevant manual checks.

## Current Limitations

- The foundation homepage is currently minimal.
- No database is connected.
- No authentication is configured.
- No Supabase environment variables are configured.
- No custom domain is configured.
- No analytics or monitoring service is configured.
- Deployment success does not replace application, security, access-control, or content review.

These limitations should be addressed only through their related roadmap phases and focused GitHub Issues.
