# Contributing to FoodForFun Atlas

Thank you for contributing to FoodForFun Atlas. This guide describes the workflow and review standards for making focused, understandable, and safe changes.

## Project Context

FoodForFun Atlas is a human-centered knowledge network that uses food as a starting point for documenting people, places, communities, and everyday life. The project prioritizes truthful storytelling, source transparency, privacy, maintainability, and a stable Source-to-Story publishing workflow.

Before beginning work, read [README.md](README.md) and the files in [`docs/`](docs/) that are relevant to the Issue. In particular, use the vision, MVP scope, data model, workflow, frontend structure, and roadmap documents to understand existing decisions. Do not expand or change the MVP scope as part of an unrelated contribution.

## GitHub Issue Workflow

Every contribution should be connected to a clearly defined GitHub Issue. Use the Issue to understand the purpose, requirements, acceptance criteria, dependencies, and affected areas before writing code or documentation.

The expected workflow is:

1. Select an Issue that is ready for work.
2. Read the Issue, `README.md`, and relevant files in `docs/`.
3. Create a focused branch from `main`.
4. Make only the changes required by the Issue.
5. Run the relevant validation and review the diff.
6. Push the branch and open a Pull Request linked to the Issue.
7. Address review feedback and merge the approved Pull Request.
8. Close the Issue and delete the completed branch.

Do not combine unrelated work in one Issue or Pull Request. If a security finding is discovered, report it in a separate GitHub Issue rather than expanding the current Issue.

## Branch Workflow and Naming

Create short-lived branches from an up-to-date `main` branch. Keep each branch focused on one Issue and delete it after its Pull Request is merged.

Use one of these recommended patterns:

```text
feature/short-description
fix/short-description
docs/short-description
chore/short-description
db/short-description
security/short-description
test/short-description
```

Use lowercase, hyphen-separated wording that describes the change, such as `docs/add-contribution-guide` or `fix/draft-story-access`. Do not create permanent development branches unless the project workflow is intentionally revised.

## Commit Messages

Use this format:

```text
type: short description
```

Examples:

```text
feat: add Story creation form
fix: prevent draft Stories from public access
docs: add contribution guide
chore: add environment variable template
db: create stories table
test: verify admin route protection
security: restrict anonymous database writes
```

Each commit should represent one understandable change. Do not use vague messages such as `update`, `changes`, or `fix stuff`.

## Pull Request Requirements

Keep each Pull Request focused on its linked Issue. The description must explain:

- what changed;
- why it changed;
- how it was tested;
- whether documentation changed;
- whether dependencies were added; and
- whether there are security or privacy effects.

Include screenshots, migration notes, or other evidence when they are relevant. Review the complete diff before requesting review, and address validation failures or clearly explain any check that cannot be run.

## Testing Commands

Run the checks relevant to the change. The current standard validation commands are:

```bash
npm ci
npm audit --audit-level=high
npm run lint
npm test
npm run build
git diff --check
git status
```

Add or update focused tests when behavior changes. Also perform manual, database, access, content, or mobile testing when the affected area requires it. Record the commands and manual checks in the Pull Request.

For database or authorization changes, also run the committed migrations and
pgTAP tests against isolated local Postgres:

```bash
npx --no-install supabase db start
npx --no-install supabase test db
npx --no-install supabase stop --no-backup
```

GitHub Actions repeats the application and database validation from a fresh
checkout. It never replaces the focused manual, Preview, access-control, or
responsive checks required by the affected Issue.

## Documentation Expectations

Documentation is part of the change, not a separate afterthought. Update `README.md`, the relevant files in `docs/`, setup instructions, examples, or comments whenever behavior, workflows, configuration, data structures, security assumptions, or contributor expectations change.

Keep documentation consistent with the implementation and preserve established product terminology. If no documentation change is needed, state that in the Pull Request and explain why.

## Security and Secret Handling

- Never commit `.env.local`.
- Never commit passwords, API keys, tokens, or credentials.
- Never expose service-role or administrative keys in source code, browser code, logs, screenshots, Issues, or Pull Requests.
- Use documented environment variables and safe example values for local setup.
- Do not run destructive dependency fixes without review. Inspect proposed changes and obtain review before using commands that may broadly update, remove, or replace dependencies.
- Report security findings in a separate GitHub Issue. Do not include sensitive exploit details or live secrets in public text.

Before opening a Pull Request, inspect the diff and repository status for accidental secrets, generated files, or local environment files. If a secret is exposed, stop using it and arrange for it to be revoked or rotated; deleting it from the latest commit is not sufficient.

## AI-Assisted Development Review

AI-generated changes must be reviewed by a person before merging. Treat AI output as a suggestion, not as verified work.

The reviewer should confirm that the change:

- satisfies the Issue and matches project documentation;
- stays within the requested scope;
- is understandable and maintainable;
- does not invent facts or overwrite verified human work;
- does not add unnecessary dependencies;
- does not expose secrets or weaken access, security, or privacy controls; and
- includes appropriate tests and documentation.

Do not merge a change only because it was generated successfully or because automated checks pass.

## Definition of Done

An Issue is complete only when:

- its acceptance criteria are met;
- tests pass;
- documentation is updated where required;
- the Pull Request is reviewed and merged;
- the Issue is closed; and
- the completed branch is deleted.

Until every item is complete, the Issue remains in progress or review rather than done.
