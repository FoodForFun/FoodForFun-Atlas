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
npm install
npm run dev
npm run lint
npm run build
git diff --check
git status
```

Stop the development server after completing the manual Local checks.

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

The current foundation verification does not yet cover:

- database operations;
- authentication;
- administrative access;
- Story creation or editing;
- image uploads;
- maps;
- mobile interaction;
- accessibility compliance;
- performance under real traffic; or
- production security controls for future services.

These areas should be verified through their related roadmap phases and focused GitHub Issues when they are implemented.
