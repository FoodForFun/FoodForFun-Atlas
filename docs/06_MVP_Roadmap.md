# FoodForFun Atlas — MVP Roadmap

**Document Version:** 0.1
**Project Version:** 0.1
**Status:** Draft
**Last Updated:** July 2026

---

## 1. Purpose of This Document

This document turns the FoodForFun Atlas product vision, MVP scope, data model, admin workflow, and frontend structure into an executable development plan.

It defines:

* the order of development;
* project milestones;
* recommended GitHub Issues;
* version targets;
* completion criteria;
* testing requirements;
* and the conditions required before moving to the next phase.

The roadmap is designed for a small team and a developer who may be new to software development.

The project should progress through small, reviewable steps rather than attempting to build the full platform at once.

---

## 2. Roadmap Objective

The objective of the MVP roadmap is to deliver the smallest complete FoodForFun Atlas system that can:

```text
Create a Source
      ↓
Preserve transcript information
      ↓
Create an Atlas Story
      ↓
Connect the Story to Places and Themes
      ↓
Review and publish the Story
      ↓
Display it on the public website
      ↓
Discover it through Stories, Search, and Map
```

The MVP should be usable without direct database editing.

AI automation is not required for the first complete workflow.

---

## 3. Development Principles

The roadmap follows these principles:

1. Documentation comes before major implementation.
2. The manual editorial workflow comes before AI automation.
3. Database structure comes before visual polish.
4. Story pages come before advanced exploration features.
5. Security and privacy are part of the MVP, not post-launch additions.
6. Each GitHub Issue should produce one clear result.
7. Each phase must have measurable completion criteria.
8. New features should not begin before the current phase is stable.
9. AI tools may assist development, but all changes must be reviewed.
10. The project must remain understandable to the owner.

---

## 4. Recommended Technical Direction

The current recommended technical direction is:

```text
Frontend and Admin
Next.js

Database
Supabase PostgreSQL

Authentication
Supabase Auth

File Storage
Supabase Storage

Geographic Data
PostgreSQL coordinates
PostGIS when geographic requirements justify it

Hosting
Vercel

Repository and Project Management
GitHub

Development Assistance
ChatGPT
Codex
GitHub Copilot
```

This roadmap does not require all services to be configured immediately.

Each service should be introduced only when its related phase begins.

---

## 5. Development Environments

FoodForFun Atlas should use separate environments.

Recommended environments:

```text
Local Development
      ↓
Preview
      ↓
Production
```

### Local Development

Used on the developer’s computer.

Purpose:

* build features;
* test database changes;
* identify errors;
* and verify behavior before sharing.

### Preview

Created from GitHub branches or Pull Requests.

Purpose:

* review new features;
* inspect visual changes;
* test before merging;
* and share progress without affecting the public site.

### Production

The public FoodForFun Atlas website.

Production should only receive reviewed changes from the main branch.

---

## 6. Main Roadmap Phases

```text
Phase 0 — Documentation and Project Definition
Phase 1 — GitHub and Development Foundation
Phase 2 — Database Foundation
Phase 3 — Authentication and Admin Shell
Phase 4 — Source Management
Phase 5 — Story Management
Phase 6 — Public Story Website
Phase 7 — Places and Themes
Phase 8 — Search and Map
Phase 9 — Real Content Validation
Phase 10 — Security, Quality, and Launch
Phase 11 — AI-Assisted Workflow
```

Phases 0 through 10 form the core MVP.

Phase 11 begins after the manual MVP workflow is stable.

---

# Phase 0 — Documentation and Project Definition

## 7. Phase Objective

Create a clear written foundation before implementation begins.

The project should be understandable by:

* the project owner;
* a future developer;
* Codex;
* GitHub Copilot;
* and other AI development tools.

---

## 8. Required Documents

The initial documentation set should include:

```text
docs/
├── 01_Vision.md
├── 02_MVP_Scope.md
├── 03_Data_Model.md
├── 04_Admin_Workflow.md
├── 05_Frontend_Structure.md
└── 06_MVP_Roadmap.md
```

Future documentation may include:

```text
07_Technical_Architecture.md
08_GitHub_Workflow.md
09_Deployment_Guide.md
10_Editorial_Guidelines.md
11_AI_Workflow.md
12_Security_and_Privacy.md
```

---

## 9. Recommended GitHub Issues

```text
docs: add product vision
docs: define MVP scope
docs: define Atlas data model
docs: define admin workflow
docs: define frontend structure
docs: create MVP roadmap
docs: review documentation consistency
```

---

## 10. Phase Completion Criteria

Phase 0 is complete when:

* all six foundation documents exist;
* document names and numbering are consistent;
* the MVP scope matches the data model;
* the admin workflow matches the data model;
* the frontend only depends on planned public data;
* conflicting statements have been resolved;
* and the documents are committed to GitHub.

---

# Phase 1 — GitHub and Development Foundation

## 11. Phase Objective

Create a stable development project without building Atlas features yet.

This phase establishes:

* repository structure;
* development tools;
* branch workflow;
* environment variable handling;
* code quality checks;
* and preview deployment.

---

## 12. Recommended Repository Structure

```text
foodforfun-atlas/
├── app/
├── components/
├── lib/
├── public/
├── docs/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
├── .env.example
├── .gitignore
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── package.json
```

This structure may change slightly after the Next.js project is initialized.

Changes should remain documented.

---

## 13. Foundation Tasks

### Repository

* confirm repository name;
* confirm private visibility during development;
* confirm README;
* add project documentation;
* add `.gitignore`;
* add `.env.example`;
* add contributing guidance;
* and add a changelog.

### Next.js

* create a supported Next.js project;
* use the App Router;
* enable TypeScript;
* enable linting;
* establish a basic directory structure;
* and verify local development.

### Deployment

* connect the repository to Vercel;
* create a preview deployment;
* verify that Pull Requests create previews;
* and prevent secret values from entering GitHub.

---

## 14. Recommended GitHub Issues

```text
chore: initialize Next.js project
chore: configure TypeScript
chore: configure linting
chore: add environment variable template
docs: add contribution guide
docs: add changelog
chore: configure Vercel preview deployment
test: verify local and preview environments
```

---

## 15. Phase Completion Criteria

Phase 1 is complete when:

* the project runs locally;
* a basic page loads;
* TypeScript is enabled;
* linting runs successfully;
* the repository contains no secrets;
* `.env.example` documents required variables;
* GitHub is connected to a preview deployment;
* and a small Pull Request can be previewed and merged.

---

# Phase 2 — Database Foundation

## 16. Phase Objective

Create the minimum database structure required for the Source-to-Story workflow.

The first database phase should not create every future table.

---

## 17. Phase-One Tables

Create:

```text
stories
sources
places
themes

story_sources
story_places
story_themes
```

These tables should match `03_Data_Model.md`.

---

## 18. Database Implementation Order

Recommended migration order:

```text
0001_create_stories
0002_create_sources
0003_create_places
0004_create_themes
0005_create_story_sources
0006_create_story_places
0007_create_story_themes
0008_add_indexes
0009_add_updated_at_functions
0010_add_initial_security_policies
0011_add_seed_data
```

Migration numbering may use timestamps if required by the database tooling.

The important requirement is that every database change is recorded.

---

## 19. Database Tasks

### Stories

Implement:

* UUID primary key;
* title;
* slug;
* summary;
* body;
* status;
* original language;
* publication timestamp;
* creation and update timestamps;
* and soft deletion.

### Sources

Implement:

* Source type;
* original title;
* URL;
* external identifier;
* language;
* descriptions;
* transcripts;
* processing status;
* availability status;
* and collection timestamps.

### Places

Implement:

* name;
* slug;
* Place type;
* parent relationship;
* country code;
* coordinates;
* location precision;
* verification;
* and timestamps.

### Themes

Implement:

* name;
* slug;
* description;
* Theme group;
* active status;
* and timestamps.

### Relationships

Implement:

* foreign keys;
* uniqueness constraints;
* relationship metadata;
* and deletion behavior.

---

## 20. Seed Data

Development seed data should include at least:

```text
3 Stories
3 Sources
3 Places
5 Themes
```

Example development records:

```text
Osaka Breakfast Shop
Vancouver Family Bakery
Taipei Market Stall
```

Seed data should be clearly identified as development data.

---

## 21. Recommended GitHub Issues

```text
db: create stories table
db: create sources table
db: create places table
db: create themes table
db: create story-source relationships
db: create story-place relationships
db: create story-theme relationships
db: add database indexes
db: add soft deletion support
db: add seed data
test: verify database constraints
docs: update database setup instructions
```

---

## 22. Phase Completion Criteria

Phase 2 is complete when:

* all seven phase-one tables exist;
* migrations can create the database from an empty state;
* seed data loads successfully;
* Story slugs are unique;
* relationship duplicates are prevented;
* foreign keys behave correctly;
* one Source can connect to multiple Stories;
* one Story can connect to multiple Sources;
* one Story can connect to multiple Places and Themes;
* and the database structure matches the documentation.

---

# Phase 3 — Authentication and Admin Shell

## 23. Phase Objective

Create a protected admin area before building content forms.

The admin shell should establish:

* sign-in;
* route protection;
* navigation;
* page layout;
* and basic permission behavior.

---

## 24. Admin Routes

Initial routes:

```text
/admin/login
/admin
/admin/sources
/admin/stories
/admin/places
/admin/themes
```

The pages may initially contain placeholders.

---

## 25. Authentication Tasks

Implement:

* email-based administrator authentication;
* protected admin routes;
* sign-out;
* unauthorized-access handling;
* and database role checks where required.

Public visitors must not access admin data.

---

## 26. Admin Shell Tasks

Build:

* admin header;
* admin navigation;
* desktop layout;
* basic mobile fallback;
* page titles;
* loading states;
* empty states;
* and error notices.

The admin interface does not need complete visual refinement.

Clarity is more important than styling.

---

## 27. Recommended GitHub Issues

```text
feat: add administrator sign-in
feat: protect admin routes
feat: add admin navigation
feat: add admin dashboard shell
feat: add sign-out
fix: handle unauthorized admin access
test: verify admin route protection
```

---

## 28. Phase Completion Criteria

Phase 3 is complete when:

* an approved administrator can sign in;
* an unauthenticated user cannot access admin routes;
* sign-out works;
* admin navigation works;
* public pages remain accessible;
* and authentication failures display clear messages.

---

# Phase 4 — Source Management

## 29. Phase Objective

Allow the administrator to create, view, and edit Sources without direct database access.

The first implementation should remain manual.

---

## 30. Required Source Pages

```text
/admin/sources
/admin/sources/new
/admin/sources/[id]
```

---

## 31. Source List Requirements

Display:

* original title;
* Source type;
* language;
* transcript quality;
* processing status;
* connected Story count;
* updated date;
* and edit action.

Initial filters may include:

```text
Source Type
Processing Status
Transcript Quality
Has Story
```

---

## 32. Source Form Requirements

Support:

* Source type;
* original title;
* Source URL;
* external ID;
* publisher;
* original publication date;
* original language;
* original description;
* raw transcript;
* cleaned transcript;
* transcript quality;
* processing status;
* availability status;
* and rights notes.

Not every field needs to be required.

---

## 33. Source Validation

The system should check:

* required fields;
* valid URLs;
* duplicate URLs;
* duplicate YouTube Video IDs;
* valid processing statuses;
* and transcript quality values.

Possible duplicates should produce warnings rather than silent duplication.

---

## 34. Recommended GitHub Issues

```text
feat: add Source list page
feat: add Source creation form
feat: add Source edit page
feat: add transcript fields
feat: add Source status management
feat: add duplicate Source warning
feat: add Source list filters
test: verify Source creation and editing
```

---

## 35. Phase Completion Criteria

Phase 4 is complete when an administrator can:

1. open the Source list;
2. create a Source;
3. save a YouTube URL;
4. add transcript text;
5. mark transcript quality;
6. update processing status;
7. edit the Source later;
8. identify possible duplicate Sources;
9. and complete all actions without database access.

---

# Phase 5 — Story Management

## 36. Phase Objective

Create the complete manual Story editorial workflow.

This is the most important admin phase.

---

## 37. Required Story Pages

```text
/admin/stories
/admin/stories/new
/admin/stories/[id]
```

---

## 38. Story List Requirements

Display:

* title;
* status;
* primary Place;
* primary Themes;
* updated date;
* publication date;
* and action.

Initial filters:

```text
Status
Place
Theme
Original Language
```

---

## 39. Story Form Requirements

Support:

```text
Title
Slug
Subtitle
Summary
Body
Atlas Insight
Status
Original Language
Published At
SEO Title
SEO Description
```

The editor should be able to save incomplete drafts.

---

## 40. Relationship Management

The Story editor must allow the administrator to connect:

```text
Sources
Places
Themes
```

The administrator should be able to:

* search existing records;
* add and remove relationships;
* select a primary Source;
* select a primary Place;
* set relationship types;
* and set Theme relevance.

---

## 41. Story Validation

Draft saving should allow incomplete content.

Publication should require stronger validation.

Publication errors may include:

* missing title;
* missing slug;
* missing summary;
* missing body;
* no connected Source;
* invalid status;
* duplicate slug;
* or unsafe Place configuration.

Warnings may include:

* no Atlas Insight;
* no Theme;
* no SEO description;
* unverified Place;
* or poor transcript quality.

---

## 42. Story Status Workflow

Implement:

```text
DRAFT
NEEDS_REVIEW
APPROVED
PUBLISHED
ARCHIVED
```

Only `PUBLISHED` Stories should become public.

---

## 43. Preview

The administrator should have a protected Story preview.

If a full preview system is too complex initially, the first version may use:

* an authenticated preview page;
* or an admin-side visual preview.

Preview content must not appear in public search.

---

## 44. Recommended GitHub Issues

```text
feat: add Story list page
feat: add Story creation form
feat: add Story edit page
feat: add Story status workflow
feat: connect Stories to Sources
feat: connect Stories to Places
feat: connect Stories to Themes
feat: add Story publication validation
feat: add protected Story preview
test: prevent draft Stories from public access
test: verify Story relationships
```

---

## 45. Phase Completion Criteria

Phase 5 is complete when an administrator can:

1. create a Story;
2. save it as a draft;
3. edit all required content;
4. connect one or more Sources;
5. connect one or more Places;
6. connect one or more Themes;
7. select primary relationships;
8. move the Story through review statuses;
9. preview it;
10. publish it;
11. edit it after publication;
12. and archive it.

---

# Phase 6 — Public Story Website

## 46. Phase Objective

Allow visitors to read published Stories.

The public website should begin with Story pages, not with a highly polished homepage.

---

## 47. Development Order

Recommended order:

```text
1. Story Detail Page
2. Story Archive
3. Basic Homepage
4. About Page
5. Public Navigation
6. 404 and Error Pages
```

The Story detail page comes first because it is the main Atlas experience.

---

## 48. Story Detail Requirements

Display:

* primary Place;
* title;
* subtitle;
* summary;
* publication date;
* Story body;
* Atlas Insight;
* related Sources;
* related Places;
* related Themes;
* and related Stories.

The page should work without a cover image.

Embedded video should not autoplay.

---

## 49. Story Archive Requirements

The Story archive must:

* display only published Stories;
* sort by publication date;
* support pagination or incremental loading;
* show clear cards;
* and work on mobile.

---

## 50. Homepage Requirements

The first homepage should include:

* project name;
* core statement;
* featured Story;
* latest Stories;
* link to Stories;
* link to Map;
* and brief project explanation.

The homepage does not need advanced animation or personalization.

---

## 51. About Page Requirements

Explain:

* what Atlas is;
* what it is not;
* why it begins with food;
* how Sources are used;
* editorial principles;
* privacy approach;
* correction method;
* and contact information.

---

## 52. Recommended GitHub Issues

```text
feat: add published Story detail page
feat: add Story archive
feat: add public navigation
feat: add basic homepage
feat: add About page
feat: add related Stories
feat: add public Source information
feat: add 404 page
feat: add error page
test: exclude unpublished Stories
test: verify mobile Story layout
```

---

## 53. Phase Completion Criteria

Phase 6 is complete when:

* published Stories have stable URLs;
* draft Stories return 404 publicly;
* the Story archive displays published content;
* Story pages are readable on mobile;
* Source information is visible;
* Place and Theme relationships are clickable;
* the homepage is not empty;
* the About page explains the project;
* and basic errors are handled.

---

# Phase 7 — Places and Themes

## 54. Phase Objective

Turn the website from a simple Story publication into a connected Atlas.

---

## 55. Required Public Pages

```text
/places
/places/[slug]
/themes
/themes/[slug]
```

The Place and Theme archive pages may be postponed if direct detail pages are sufficient for the first test.

---

## 56. Place Page Requirements

Display:

* name;
* native name when available;
* Place type;
* parent Place;
* country;
* description;
* public map position;
* and related published Stories.

The frontend must respect location precision.

---

## 57. Theme Page Requirements

Display:

* Theme name;
* description;
* related published Stories;
* represented Places;
* and Story count.

Inactive Themes may remain visible when they are already connected to published Stories, depending on editorial policy.

---

## 58. Recommended GitHub Issues

```text
feat: add Place detail page
feat: add Place archive
feat: add Theme detail page
feat: add Theme archive
feat: add Place hierarchy navigation
feat: add Place and Theme Story counts
test: respect public location precision
test: exclude draft Stories from entity pages
```

---

## 59. Phase Completion Criteria

Phase 7 is complete when:

* Place links open valid Place pages;
* Theme links open valid Theme pages;
* only published Stories appear;
* location precision is respected;
* Stories can be discovered from Places;
* Stories can be discovered from Themes;
* and duplicate Place or Theme records do not appear in the test content.

---

# Phase 8 — Search and Map

## 60. Phase Objective

Allow visitors to actively explore Atlas content.

---

## 61. Basic Search Requirements

Search should initially cover:

```text
Story titles
Story summaries
Place names
Theme names
```

Search should:

* exclude draft content;
* group result types;
* display useful result cards;
* and handle no-result searches.

The MVP does not require semantic search.

---

## 62. Map Requirements

The map should:

* display public Places connected to published Stories;
* respect exact, neighborhood, city, region, and hidden precision;
* display Story or Place preview cards;
* work on mobile;
* and link to public pages.

The MVP map does not require navigation or route planning.

---

## 63. Map Data Rules

```text
EXACT
Display reviewed public coordinates.

NEIGHBORHOOD
Display an approximate neighborhood location.

CITY
Display a city-level point.

REGION
Display a broad regional point.

HIDDEN
Do not display.
```

The system should not create false accuracy by slightly moving a private exact coordinate.

Approximate public coordinates should be stored or generated according to a documented policy.

---

## 64. Recommended GitHub Issues

```text
feat: add basic public search
feat: group search results by type
feat: add search empty state
feat: add public map
feat: add map Story cards
feat: add map Place cards
feat: respect map privacy settings
test: exclude private content from search
test: exclude hidden Places from map
test: verify mobile map behavior
```

---

## 65. Phase Completion Criteria

Phase 8 is complete when:

* visitors can search Stories;
* visitors can find Places and Themes;
* search excludes unpublished content;
* map markers display correctly;
* hidden locations never appear;
* city-level Stories do not expose exact coordinates;
* map cards link to public pages;
* and map behavior is usable on mobile.

---

# Phase 9 — Real Content Validation

## 66. Phase Objective

Test the complete system with real FoodForFun content.

This phase is required before AI automation.

---

## 67. Initial Content Target

The MVP test should include at least:

```text
10 Sources
10 Published Stories
5 Places
5 Themes
```

The sample should include varied content.

---

## 68. Recommended Content Variety

Include:

* multiple countries or regions;
* multiple languages;
* Sources with good transcripts;
* Sources with poor transcripts;
* Sources with no transcript;
* precise locations;
* city-level locations;
* one Source producing multiple Stories;
* multiple Sources contributing to one Story;
* and both current and unavailable Sources.

---

## 69. Workflow Measurements

For each Story, record approximately:

```text
Time to add Source
Time to prepare transcript
Time to create Story
Time to create relationships
Time to review
Time to publish
```

The goal is not to pressure the editor.

The goal is to identify repetitive work that AI may later reduce.

---

## 70. Content Validation Questions

After processing the first real Stories, review:

1. Which fields are frequently empty?
2. Which fields are confusing?
3. Where do duplicate Places appear?
4. Which Themes overlap?
5. Is the Source-to-Story distinction clear?
6. Does the editor understand publication status?
7. Are Story pages useful without People and Foods?
8. Does the map reveal too much location information?
9. Which tasks consume the most time?
10. Which tasks are stable enough for automation?

---

## 71. Recommended GitHub Issues

```text
content: add first real Source
content: publish first Atlas Story
content: process initial 10 Stories
fix: resolve issues found during content testing
docs: record editorial workflow findings
docs: revise MVP fields based on real use
data: review duplicate Places
data: review duplicate Themes
```

Content Issues may be stored separately from technical Issues if preferred.

---

## 72. Phase Completion Criteria

Phase 9 is complete when:

* at least 10 real Stories are published;
* all public Stories have Sources;
* all Places have reviewed precision;
* Themes have been consolidated;
* the administrator can complete the workflow without developer help;
* major form problems have been corrected;
* and the project has identified which tasks should be automated next.

---

# Phase 10 — Security, Quality, and Launch

## 73. Phase Objective

Prepare FoodForFun Atlas for public access.

Launch should not occur only because the pages look complete.

Security, privacy, backup, accessibility, and reliability must be reviewed.

---

## 74. Security Review

Verify:

* administrator routes are protected;
* anonymous users cannot write data;
* draft Stories are private;
* raw transcripts are private;
* hidden coordinates are private;
* environment variables are secure;
* database Row Level Security is enabled;
* Storage rules are correct;
* and no credentials exist in Git history.

---

## 75. Privacy Review

Verify:

* private residences are not exposed;
* anonymous identities remain anonymous;
* uncertain names are not shown as verified;
* internal notes are not public;
* rights notes are not public;
* and correction contact information exists.

---

## 76. Content Review

Verify:

* every Story has a Source;
* every Story has been reviewed;
* every public location is appropriate;
* unavailable Sources are labeled correctly;
* Source attribution is visible;
* and Stories follow FoodForFun editorial principles.

---

## 77. Technical Review

Verify:

* production database exists;
* migrations can reproduce the structure;
* backups are configured;
* error logging exists;
* 404 and error pages work;
* sitemap exists;
* robots.txt exists;
* canonical URLs are correct;
* images are optimized;
* and mobile layouts work.

---

## 78. Accessibility Review

Verify:

* heading order;
* keyboard navigation;
* visible focus states;
* image alt text;
* text contrast;
* form labels;
* responsive text;
* and usable map alternatives where practical.

---

## 79. Performance Review

Verify:

* Story pages load efficiently;
* images use appropriate sizes;
* videos do not autoplay;
* unnecessary scripts are removed;
* map code is not loaded on unrelated pages;
* and public pages do not depend on large client-side data downloads.

---

## 80. Launch Tasks

Recommended launch tasks:

```text
Configure production domain
Verify HTTPS
Configure production environment variables
Run production database migrations
Load reviewed content
Configure backups
Submit sitemap
Test social sharing previews
Test mobile devices
Test public and admin permissions
Create release notes
Tag the first public release
```

---

## 81. Recommended GitHub Issues

```text
security: review Row Level Security
security: audit environment variables
security: test draft content privacy
security: test hidden location privacy
perf: optimize public images
perf: reduce unnecessary client scripts
seo: add sitemap
seo: add robots.txt
seo: add canonical metadata
a11y: review public pages
chore: configure production domain
chore: prepare launch checklist
release: prepare version 1.0.0
```

---

## 82. Phase Completion Criteria

Phase 10 is complete when:

* production is deployed;
* at least 10 Stories are public;
* admin routes are protected;
* database backups exist;
* hidden content remains private;
* critical errors have been tested;
* the website works on mobile;
* basic accessibility checks pass;
* SEO foundation exists;
* and the project owner can independently publish a Story.

---

# Phase 11 — AI-Assisted Workflow

## 83. Phase Objective

Reduce repetitive editorial work without replacing human review.

This phase begins only after the manual workflow is stable.

---

## 84. AI Implementation Order

Recommended order:

```text
1. Transcript Cleaning
2. Internal Content Summary
3. Theme Suggestions
4. Place Suggestions
5. Story Outline
6. Story Draft
7. SEO Draft
8. Duplicate Entity Suggestions
9. Translation Assistance
```

Do not begin with autonomous Agent workflows.

---

## 85. Transcript Cleaning

AI may:

* remove timestamps;
* merge broken sentences;
* remove obvious duplication;
* preserve speaker meaning;
* and identify uncertain sections.

The original transcript must remain unchanged.

---

## 86. Content Summary

AI may create an internal summary to help the editor understand the Source.

This summary should not automatically become public text.

---

## 87. Entity Suggestions

AI may suggest:

* Places;
* Themes;
* People;
* Organizations;
* and Foods.

Every suggestion should include:

```text
Suggested Value
Confidence
Evidence Summary
Possible Existing Match
```

Suggestions must remain pending until human review.

---

## 88. Story Draft Assistance

AI may suggest:

* title;
* subtitle;
* summary;
* Story structure;
* body draft;
* Atlas Insight;
* SEO title;
* and SEO description.

The editor must be able to:

* accept;
* modify;
* reject;
* or regenerate each section.

AI must not overwrite verified human edits automatically.

---

## 89. AI Tracking

The system should record:

```text
Model Name
Prompt Version
Processing Time
Source Used
Suggestion Type
Review Result
Created At
Reviewed At
```

This makes AI behavior reviewable and easier to improve.

---

## 90. Recommended GitHub Issues

```text
ai: design suggestion data structure
ai: add transcript cleaning
ai: add internal Source summary
ai: add Theme suggestions
ai: add Place suggestions
ai: add Story draft suggestions
ai: add suggestion review interface
ai: record model and prompt versions
test: ensure AI cannot publish
test: preserve original transcripts
docs: add AI workflow documentation
```

---

## 91. Phase Completion Criteria

Phase 11 is complete when:

* manual processing still works;
* AI failures do not block the editor;
* original Source content remains preserved;
* AI suggestions remain separate from verified data;
* editors can accept, modify, or reject suggestions;
* AI cannot publish;
* model and prompt versions are recorded;
* and AI measurably reduces repetitive work.

---

# GitHub Project Structure

## 92. Recommended GitHub Project Columns

Use a simple workflow:

```text
Backlog
Ready
In Progress
Review
Done
```

### Backlog

Tasks not yet approved for active work.

### Ready

Tasks that are clearly defined and can begin.

### In Progress

Tasks currently being worked on.

### Review

Tasks awaiting code, content, or design review.

### Done

Tasks that meet their completion criteria.

---

## 93. Recommended GitHub Labels

Keep labels limited and useful.

### Work Type

```text
type: feature
type: bug
type: documentation
type: database
type: security
type: content
type: testing
type: maintenance
```

### Area

```text
area: admin
area: frontend
area: database
area: search
area: map
area: auth
area: ai
area: deployment
```

### Priority

```text
priority: critical
priority: high
priority: normal
priority: low
```

### Status or Review

```text
needs: decision
needs: review
blocked
```

Do not create labels that duplicate Project columns unnecessarily.

---

## 94. GitHub Milestones

Recommended Milestones:

```text
M0 — Documentation
M1 — Project Foundation
M2 — Database
M3 — Admin Sources
M4 — Admin Stories
M5 — Public Stories
M6 — Places and Themes
M7 — Search and Map
M8 — Content Validation
M9 — Launch
M10 — AI Assistance
```

Each Issue should normally belong to one Milestone.

---

# Git Branch Workflow

## 95. Branch Strategy

Use:

```text
main
  └── feature branches
```

Recommended branch names:

```text
feature/source-form
feature/story-editor
feature/place-page
feature/basic-search
fix/draft-story-access
docs/mvp-roadmap
db/create-stories-table
```

Do not maintain multiple permanent development branches unless the project becomes larger.

---

## 96. Development Flow

```text
Create Issue
    ↓
Move Issue to Ready
    ↓
Create Branch from main
    ↓
Make One Focused Change
    ↓
Commit Changes
    ↓
Push Branch
    ↓
Open Pull Request
    ↓
Review and Test
    ↓
Merge into main
    ↓
Delete Branch
    ↓
Move Issue to Done
```

---

## 97. Pull Request Requirements

Every Pull Request should explain:

```text
What changed?
Why was it needed?
How was it tested?
What documentation changed?
Are there screenshots?
Are there database migrations?
Are there security or privacy effects?
```

A Pull Request should not combine unrelated features.

---

# Commit Rules

## 98. Commit Format

Recommended format:

```text
type: short description
```

Examples:

```text
feat: add Source creation form
fix: prevent draft Stories from public access
db: create story_sources table
docs: add MVP roadmap
test: verify hidden Places are excluded
security: restrict anonymous database writes
```

---

## 99. Commit Scope

A Commit should represent one understandable change.

Avoid:

```text
update
changes
fix stuff
work today
more updates
```

Good Commits make it easier to:

* review AI-generated changes;
* locate errors;
* restore earlier behavior;
* and understand project history.

---

# Version Plan

## 100. Recommended Version Sequence

```text
v0.1.0 — Documentation foundation
v0.2.0 — Development and database foundation
v0.3.0 — Source management
v0.4.0 — Story management
v0.5.0 — Public Story website
v0.6.0 — Places and Themes
v0.7.0 — Search and Map
v0.8.0 — Real content validation
v0.9.0 — Launch candidate
v1.0.0 — First public stable release
v1.1.0 — Initial AI assistance
```

The exact numbering may change, but releases should represent meaningful stages.

---

## 101. Version Meaning

### Major Version

Example:

```text
v1.0.0
v2.0.0
```

Used for major stable releases or substantial incompatible changes.

### Minor Version

Example:

```text
v0.5.0
v1.1.0
```

Used for meaningful new features.

### Patch Version

Example:

```text
v0.5.1
v1.0.2
```

Used for fixes and small improvements.

---

## 102. Release Requirements

Before creating a Release:

* related Issues should be complete;
* required tests should pass;
* documentation should be updated;
* migrations should be reviewed;
* security effects should be considered;
* and release notes should explain the change.

Do not create a Release for every small Commit.

---

# Testing Strategy

## 103. Testing Levels

The MVP should use several types of testing.

```text
Manual Testing
Database Testing
Application Testing
Access Testing
Content Testing
Mobile Testing
```

---

## 104. Manual Testing

Verify the actual editor workflow:

```text
Sign in
Create Source
Add Transcript
Create Story
Connect Source
Connect Place
Connect Theme
Preview
Publish
Edit
Archive
```

This remains necessary even when automated tests exist.

---

## 105. Database Testing

Verify:

* required fields;
* unique slugs;
* relationship uniqueness;
* valid statuses;
* foreign keys;
* deletion behavior;
* and migration reliability.

---

## 106. Access Testing

Test as:

```text
Anonymous Visitor
Authenticated Administrator
Future Editor Role
```

Verify that each role can only access appropriate data.

---

## 107. Public Content Testing

Verify:

* draft Stories are hidden;
* archived Stories follow the selected policy;
* private Sources are not exposed;
* raw transcripts are not exposed;
* hidden locations are excluded;
* and unpublished Themes do not reveal private content.

---

## 108. Mobile Testing

At minimum, test:

* homepage;
* Story archive;
* Story page;
* map;
* search;
* admin sign-in;
* and Story editing fallback.

The public website has higher mobile priority than the admin interface.

---

# Working With Codex

## 109. Codex Task Size

Codex should receive small, clearly bounded tasks.

Not recommended:

```text
Build the complete FoodForFun Atlas platform.
```

Recommended:

```text
Read:
- README.md
- docs/02_MVP_Scope.md
- docs/03_Data_Model.md

Complete the GitHub Issue:
Create the stories table migration.

Requirements:
- UUID primary key
- unique slug
- documented Story statuses
- created_at and updated_at
- soft deletion
- no unrelated table changes
- add or update tests
- summarize all changes
```

---

## 110. Required Context for Codex

Before implementation, Codex should normally read:

```text
README.md
docs/01_Vision.md
docs/02_MVP_Scope.md
docs/03_Data_Model.md
Relevant workflow document
Relevant GitHub Issue
```

It should not need every document for every small task.

Provide only the relevant context.

---

## 111. Codex Review Questions

After Codex completes a task, review:

1. Did it only change the requested area?
2. Does it match the documentation?
3. Did it introduce new dependencies?
4. Are the dependencies necessary?
5. Did it expose any secrets?
6. Did it weaken privacy or access controls?
7. Did it add tests?
8. Did it update documentation where required?
9. Can the project owner explain the change?
10. Can the change be reversed safely?

Code should not be merged only because it runs.

---

# Weekly Development Rhythm

## 112. Recommended Weekly Process

For limited weekly development time:

```text
Choose 1–2 Issues
      ↓
Understand the purpose
      ↓
Move Issues to Ready
      ↓
Create branches
      ↓
Develop with AI assistance
      ↓
Test personally
      ↓
Review Pull Requests
      ↓
Update documentation
      ↓
Merge
      ↓
Record what was learned
```

Avoid working on database, map, AI, homepage design, and YouTube automation at the same time.

---

## 113. Suggested First Eight Weeks

### Week 1 — Documentation Review

* complete six foundation documents;
* check consistency;
* update README links;
* and commit documentation.

### Week 2 — Project Foundation

* initialize Next.js;
* configure TypeScript;
* configure linting;
* add environment variable template;
* and create Vercel preview deployment.

### Week 3 — Database Setup

* create Supabase project;
* configure local connection;
* create Stories and Sources migrations;
* and test migrations.

### Week 4 — Database Relationships

* create Places and Themes;
* create relationship tables;
* add seed data;
* and verify constraints.

### Week 5 — Authentication and Admin Shell

* add admin sign-in;
* protect routes;
* add admin navigation;
* and create dashboard placeholders.

### Week 6 — Source Management

* add Source list;
* add Source creation;
* add Source editing;
* and add transcript fields.

### Week 7 — Story Management

* add Story list;
* add Story form;
* add Source relationships;
* and add Place and Theme relationships.

### Week 8 — Story Publication

* add validation;
* add preview;
* add publication status;
* add public Story page;
* and test draft privacy.

This schedule is a planning guide rather than a deadline.

---

# Risk Management

## 114. Main Project Risks

### Scope Expansion

Risk:

New features are added before the core workflow is stable.

Response:

Use `02_MVP_Scope.md` and require a documented scope change.

---

### AI Over-Dependence

Risk:

The workflow becomes unusable without AI.

Response:

Maintain a complete manual workflow.

---

### Duplicate Data

Risk:

Places and Themes become inconsistent.

Response:

Search before creation and review duplicates during real-content testing.

---

### Privacy Exposure

Risk:

Private locations or identities become public.

Response:

Use explicit precision and identity controls, database policies, and publication checks.

---

### Documentation Drift

Risk:

The code and documentation describe different systems.

Response:

Require documentation review in relevant Pull Requests.

---

### Excessive Technical Complexity

Risk:

The project adds unnecessary services or frameworks.

Response:

Every new dependency must solve a documented requirement.

---

### Incomplete Ownership

Risk:

The project owner cannot understand or maintain AI-generated work.

Response:

Use small Issues, clear Pull Requests, comments where necessary, and regular explanations.

---

### Content Workflow Bottleneck

Risk:

Story preparation requires too much manual time.

Response:

Measure the real workflow first, then automate stable repetitive tasks.

---

## 115. Feature Admission Rule

Before adding a new feature to the MVP, answer:

1. Which documented user problem does it solve?
2. Which phase does it belong to?
3. What happens if it is delayed?
4. Does the core workflow require it?
5. What maintenance cost does it introduce?
6. Does it create privacy or security risk?
7. Can the current project owner understand and operate it?
8. Does it require updating the scope or data model?

A feature should not enter active development without a clear answer.

---

# Definition of Ready

## 116. When an Issue Is Ready

An Issue may move to `Ready` when:

* its purpose is clear;
* expected behavior is described;
* affected pages or tables are identified;
* completion criteria exist;
* major decisions have already been made;
* dependencies are known;
* and it is small enough for one focused Pull Request.

An Issue should not begin with unresolved product questions that can be answered through existing documents.

---

# Definition of Done

## 117. When an Issue Is Done

An Issue is complete when:

* the requested behavior works;
* the code has been reviewed;
* relevant tests pass;
* errors are handled;
* access and privacy have been considered;
* documentation has been updated when needed;
* a preview or migration has been checked;
* the Pull Request is merged;
* and the acceptance criteria are met.

“Code was generated” does not mean the Issue is done.

---

# MVP Launch Definition

## 118. The MVP Is Ready to Launch When

### Content Workflow

* an administrator can create a Source;
* an administrator can preserve transcript information;
* an administrator can create a Story;
* Sources, Places, and Themes can be connected;
* Stories can be reviewed and published;
* and no direct database editing is required.

### Public Website

* visitors can browse published Stories;
* visitors can open Story pages;
* visitors can explore Places and Themes;
* visitors can search;
* visitors can use the map;
* and visitors can understand the project.

### Content

* at least 10 real Stories are published;
* all Stories have reviewed Sources;
* all location precision has been checked;
* and duplicate Places and Themes have been reviewed.

### Security

* admin routes are protected;
* draft content is private;
* anonymous database writes are blocked;
* hidden locations remain hidden;
* and secrets are not exposed.

### Reliability

* migrations are stored;
* backups exist;
* major errors are handled;
* mobile pages work;
* and the project owner can operate the system.

---

# Post-MVP Direction

## 119. Recommended Order After Version 1.0

After the first public release, review real usage before selecting the next major feature.

Recommended order:

```text
People
Organizations
Foods
Media Library
Improved Editorial Review
AI Transcript Cleaning
AI Entity Suggestions
AI Story Draft Assistance
Multilingual Publishing
Semantic Search
Public API
```

This order may change based on real editorial needs.

---

## 120. Features That Should Remain Deferred

Even after launch, the following should not be prioritized without a strong reason:

* public ratings;
* restaurant rankings;
* user comments;
* social networking;
* personalized feeds;
* reservation integrations;
* delivery integrations;
* autonomous AI publishing;
* complex microservices;
* self-hosted AI infrastructure;
* and native mobile applications.

These features do not directly support the current Atlas mission.

---

## 121. Roadmap Review Schedule

The roadmap should be reviewed:

* after the documentation phase;
* after the database phase;
* after the first complete Story publication;
* after processing 10 real Stories;
* before public launch;
* and after the first public release.

Roadmap changes should be recorded in GitHub.

Major scope changes should also update:

```text
02_MVP_Scope.md
03_Data_Model.md
04_Admin_Workflow.md
05_Frontend_Structure.md
```

when affected.

---

## 122. Immediate Next Actions

After this roadmap is committed, the next actions should be:

```text
1. Review all six foundation documents
2. Add document links to README.md
3. Check document naming consistency
4. Create GitHub Milestone M0 — Documentation
5. Create documentation Issues
6. Commit the completed docs folder
7. Tag or record project version 0.1 documentation state
8. Begin Phase 1 — Development Foundation
```

No functional Atlas code is required before the documentation review is complete.

---

## 123. Roadmap Decision Principle

When deciding what to work on next, ask:

> What is the smallest next step that moves FoodForFun Atlas toward a complete, reliable Source-to-Story publishing workflow?

The next task should strengthen the complete workflow rather than create an isolated demonstration.

---

## 124. Core Roadmap Statement

FoodForFun Atlas should be developed as a sequence of small, understandable, and testable systems.

The project begins with documentation, then builds the database, admin workflow, Story website, exploration tools, and real content.

Automation comes after the process is understood.

The goal is not to build every possible feature.

The goal is to create a stable platform that can preserve Sources, publish connected Stories, and grow without losing its editorial purpose.
