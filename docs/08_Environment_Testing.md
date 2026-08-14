# FoodForFun Atlas — Environment Testing

This document defines the standard checks for the Local, Preview, and Production environments and explains how contributors should record their results.

## Purpose of Each Environment

### Local

Local testing verifies a change on a contributor's computer before it is shared. It confirms that dependencies install, development tools run, the application starts, and the repository is ready for review.

### Preview

Preview testing verifies a branch or Pull Request in a Vercel-hosted environment before merge. It allows reviewers to inspect the proposed change without affecting the public Production site.

### Production

Production testing verifies the version deployed from `main` at the public URL. It confirms that the reviewed and merged version is available while Preview Deployments remain separate.

## Standard Local Validation Commands

Run the following commands from the repository root:

```bash
npm ci
npm audit --audit-level=high
npm run dev
npm run lint
npm test
npm run build
git diff --check
git status
```

Stop the development server after completing the manual Local checks.

Database or authorization changes also require:

```bash
npx --no-install supabase db start
npx --no-install supabase test db
npx --no-install supabase stop --no-backup
```

These commands use only local Docker services. Do not add a Supabase access
token, project reference, database password, or service-role credential for
local validation.

## Automated Pull Request Validation

GitHub Actions runs two independent jobs for every Pull Request and push to
`main`:

- Application installs the lockfile, audits dependencies, lints, runs every
  application test, and builds the production application with safe
  placeholders.
- Database starts isolated local Postgres from the committed migrations and
  empty seed, then runs every pgTAP file.

The workflow has read-only repository permission, pins its reusable Actions to
immutable commits, and has no Production or remote Supabase credentials. A
green workflow does not replace manual responsive, accessibility, Preview, or
Production verification.

## Local Environment Checks

Confirm that:

- dependencies install successfully;
- the development server starts;
- the homepage loads successfully;
- the page displays `FoodForFun Atlas`;
- public search handles normal results, no results, empty and invalid queries, and refreshable query URLs;
- public search groups Story, Place, and Theme results and remains usable at 390px width;
- missing routes display the public not-found state;
- lint passes;
- the production build passes;
- no relevant browser or server errors appear; and
- no secrets or local environment files are committed.

## Preview Environment Checks

Confirm that:

- the Application and Database GitHub Actions jobs pass;
- Vercel creates a Preview Deployment;
- the deployment reaches the Ready state;
- the Preview URL loads successfully;
- the expected change is visible;
- Preview remains separate from Production;
- no relevant deployment or browser errors appear; and
- no secrets or local files are exposed.

Temporary or commit-specific Preview URLs must not be permanently committed to documentation.

## Production Environment Checks

Confirm that:

- the Production Deployment is created from `main`;
- the deployment reaches the Ready state;
- the public URL loads successfully;
- the expected merged version is visible; and
- Preview Deployments do not replace Production.

Production verification is normally performed after the reviewed Pull Request is merged into `main`.

## Recording Results in Pull Requests

The Pull Request description should state:

- each command that was run;
- whether each command passed;
- the manual checks performed and their results;
- the Preview Deployment status;
- Production verification when applicable;
- known limitations; and
- any checks that could not be completed, including the reason.

Use stable descriptions of deployment results rather than permanently recording temporary or commit-specific Preview URLs.

## Current Limitations

Automated validation covers application logic, migrations, the empty seed,
database authorization assertions, and production compilation. It does not
exercise real Production credentials, browser-based Admin sessions, image
uploads, full accessibility compliance, performance under real traffic,
backup restoration, or Production security configuration. These require
focused manual or environment-specific review.
