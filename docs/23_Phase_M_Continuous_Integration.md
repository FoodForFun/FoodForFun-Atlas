# FoodForFun Atlas - Phase M Continuous Integration

**Status:** Implemented

**Last Updated:** August 2026

## Scope

Phase M adds reproducible GitHub Actions validation for every Pull Request and
every push to `main`. The workflow checks the application and the complete
database migration history in separate jobs without depending on Production
credentials or state.

## Application job

The Application job runs on Ubuntu 24.04 with Node.js 22.18.0 and safe build-only
Supabase placeholders. It performs the locked sequence:

1. install dependencies with `npm ci`;
2. reject high-severity dependency advisories;
3. run ESLint;
4. run the aggregate application test suite; and
5. create the production Next.js build.

The aggregate `npm test` script provides one CI entry point for the current
authentication, editorial, public, and Search suites. Future test groups must be
added to that aggregate script as part of their implementation.

## Database job

The Database job installs the same locked dependencies, starts a fresh local
Supabase stack, applies all repository migrations and the empty local seed, and
runs the complete pgTAP suite. Cleanup runs even after a failed step and removes
the disposable stack without creating a backup.

The job does not link a Supabase project, reset a remote database, push a
migration, or use a service-role key. It validates repository state only.

## Workflow hardening

The workflow has read-only repository contents permission, disables checkout
credential persistence, and pins reusable Actions to immutable commit SHAs.
Concurrent runs for the same workflow and ref cancel older in-progress work.
Application and database jobs also have explicit time limits.

`actions/checkout` uses the Node.js 24-based v6.0.2 release so successful jobs do
not retain the deprecated Node.js 20 action-runtime annotation.

## Operational boundary

CI verifies that the application builds and that a fresh local database can be
reproduced. It does not deploy the application, apply Production migrations,
configure backups or domains, load content, or prove the state of any remote
Supabase project. Vercel deployment checks remain a separate GitHub integration,
and every remote database operation still requires explicit authorization.
