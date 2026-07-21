# FoodForFun Atlas — MVP Scope

**Document Version:** 0.1
**Project Version:** 0.1
**Status:** Draft
**Last Updated:** July 2026

---

## 1. Purpose of This Document

This document defines the scope of the first working version of FoodForFun Atlas.

Its purpose is to prevent the project from becoming too large before the core workflow has been tested.

The MVP should prove that FoodForFun can consistently transform source material into structured, connected, and publishable Atlas stories.

The MVP is not intended to include every future feature.

---

## 2. MVP Objective

The first version of FoodForFun Atlas must support the following complete workflow:

```text
YouTube video or manual source
          ↓
Create a Source record
          ↓
Add or preserve transcript information
          ↓
Create an Atlas Story
          ↓
Connect the Story to places and themes
          ↓
Review the content
          ↓
Publish the Story
          ↓
Discover it through the website, search, and map
```

The MVP succeeds when this workflow can be completed reliably without requiring direct database editing.

---

## 3. Primary MVP User

The primary user of the MVP is the FoodForFun editor or administrator.

The editor should be able to:

* sign in securely;
* add source material;
* create and edit stories;
* connect stories to structured Atlas data;
* review unpublished content;
* publish stories;
* and correct published information.

The public visitor should be able to:

* read published stories;
* browse a story list;
* explore stories by location;
* perform basic searches;
* understand the source of a story;
* and continue to related content.

---

## 4. Core MVP Content Model

The MVP will begin with the following primary content types:

### Story

The edited public narrative presented on the website.

### Source

The original material used to create a Story.

Examples include:

* YouTube videos;
* transcripts;
* field notes;
* interviews;
* websites;
* and manual entries.

### Place

A country, city, neighborhood, market, street, or other geographic area connected to a Story.

### Theme

An editorial topic used to connect stories across different locations.

Examples include:

* independent operation;
* family business;
* morning work;
* neighborhood life;
* migration;
* and community relationships.

---

## 5. MVP Phase-One Database Tables

The first database implementation should contain:

```text
stories
sources
places
themes

story_sources
story_places
story_themes
```

These tables are enough to test the minimum Atlas workflow.

The following content types should be planned in the data model but may be added after the basic workflow is stable:

```text
people
organizations
foods
media
```

The MVP must not depend on these later tables before a Story can be published.

---

## 6. Must-Have Features

The following features are required for the MVP.

---

### 6.1 Project Foundation

The project must include:

* one GitHub repository;
* a clear README;
* project documentation;
* environment variable guidance;
* database migration files;
* a development environment;
* a test or preview deployment;
* and a production deployment process.

The project should use one repository unless a clear technical requirement later justifies separation.

---

### 6.2 Administrator Authentication

The administrator must be able to sign in to a protected management area.

Required behavior:

* unauthenticated visitors cannot access admin pages;
* only approved administrator accounts can edit content;
* authentication errors are displayed clearly;
* and public visitors cannot modify Atlas records.

The first version only requires email-based authentication.

Social login is not required.

---

### 6.3 Source Management

The administrator must be able to:

* create a Source;
* edit a Source;
* view a Source list;
* record the source type;
* record the original title;
* record a URL;
* record a YouTube Video ID when applicable;
* record the original language;
* record the original publication date;
* store the original description;
* store transcript text;
* and connect one Source to one or more Stories.

The first version may require YouTube information to be entered manually.

Automatic metadata and subtitle retrieval are not required for the initial MVP.

---

### 6.4 Story Management

The administrator must be able to:

* create a Story;
* edit an existing Story;
* save a Story as a draft;
* review the Story;
* publish the Story;
* archive the Story;
* and edit a Story after publication.

The minimum Story fields are:

```text
title
slug
summary
body
status
original_language
published_at
created_at
updated_at
```

The following fields should also be supported where practical:

```text
subtitle
atlas_insight
seo_title
seo_description
```

---

### 6.5 Story Status Workflow

The MVP should support the following statuses:

```text
DRAFT
NEEDS_REVIEW
APPROVED
PUBLISHED
ARCHIVED
```

Only Stories with the status `PUBLISHED` may appear on the public website.

A published Story should not become publicly inaccessible merely because one of its original Sources later becomes unavailable.

---

### 6.6 Source and Story Relationships

The system must support:

```text
One Source → Multiple Stories
Multiple Sources → One Story
```

This is required because:

* one video may contain several separate stories;
* one Story may use a video, interview, and field notes;
* and a follow-up video may add information to an existing Story.

The relationship between Source and Story must not be limited to one-to-one.

---

### 6.7 Place Management

The administrator must be able to:

* create a Place;
* edit a Place;
* assign a place type;
* record country information;
* store latitude and longitude when appropriate;
* control public location precision;
* and connect a Story to one or more Places.

The MVP should support location precision levels such as:

```text
EXACT
NEIGHBORHOOD
CITY
REGION
HIDDEN
```

The system must not display a more precise public location than the stored visibility setting permits.

---

### 6.8 Theme Management

The administrator must be able to:

* create a Theme;
* edit a Theme;
* deactivate a Theme;
* connect multiple Themes to a Story;
* and reuse existing Themes across Stories.

The system should encourage reuse rather than allowing many near-duplicate Themes.

Examples that should normally be consolidated include:

```text
one-person shop
solo operation
single-owner shop
independent operation
```

A single approved Theme should be used whenever these refer to the same editorial concept.

---

### 6.9 Public Homepage

The MVP homepage must include:

* the FoodForFun Atlas name;
* the core project statement;
* at least one featured Story;
* recent Stories;
* a route to the Story archive;
* a route to the map;
* and a short explanation of the project.

The homepage must not depend on personalized recommendations.

---

### 6.10 Story Archive

The public website must include a Story list page.

It must:

* display only published Stories;
* sort Stories by publication date;
* support basic pagination or incremental loading;
* show a title;
* show a summary;
* show the primary Place when available;
* and link to the Story detail page.

---

### 6.11 Story Detail Page

Every published Story must have a stable public URL.

The page should display:

* title;
* subtitle when available;
* summary;
* body;
* Atlas Insight when available;
* publication date;
* related Places;
* related Themes;
* Source information;
* and related Stories.

Unpublished Stories must not be publicly accessible through guessed URLs.

---

### 6.12 Place Page

Each public Place should have a page that may display:

* the Place name;
* Place type;
* country;
* map position when public;
* a short description;
* and related published Stories.

The page should not automatically become a tourism guide.

---

### 6.13 Basic Search

The MVP must include keyword search.

The first search version should search:

* Story titles;
* Story summaries;
* Place names;
* and Theme names.

The search system does not need AI or semantic search.

Search results should only contain public content.

---

### 6.14 Basic Map

The MVP must include a public map showing Stories connected to public Places.

The map should:

* display public locations;
* respect location precision settings;
* link map markers to Stories or Place pages;
* work on mobile devices;
* and avoid exposing hidden or private locations.

The first version does not need navigation, directions, or advanced geographic analysis.

---

### 6.15 About and Editorial Information

The public website must include an About page explaining:

* what FoodForFun Atlas is;
* what it is not;
* why food is used as the starting point;
* how content is collected and edited;
* how sources are handled;
* and how corrections can be submitted.

---

### 6.16 Basic SEO

The MVP should support:

* page titles;
* meta descriptions;
* stable slugs;
* sitemap generation;
* robots.txt;
* social sharing metadata;
* and readable server-rendered Story pages.

SEO must not require exaggerated or misleading titles.

---

### 6.17 Responsive Design

The public website must work on:

* mobile phones;
* tablets;
* and desktop screens.

Priority should be given to mobile Story reading because many visitors may arrive from YouTube or social media links.

---

### 6.18 Error Handling

The MVP must provide understandable responses for:

* missing pages;
* invalid Story slugs;
* failed sign-in;
* failed form submission;
* unavailable Source links;
* missing map coordinates;
* and temporary database errors.

Errors should not expose confidential system information.

---

### 6.19 Security and Privacy

Before public launch, the MVP must include:

* protected admin routes;
* secure environment variable handling;
* restricted database write permissions;
* configured Row Level Security;
* safe file access rules where files are used;
* no private credentials in GitHub;
* and location privacy controls.

---

## 7. Should-Have Features

The following features are valuable but may be postponed if they threaten the MVP schedule.

---

### 7.1 Cover Images

Stories should support cover images.

The system should record:

* image path;
* alt text;
* credit;
* and rights status.

However, the initial Story workflow should remain usable when a cover image is unavailable.

---

### 7.2 Preview Before Publication

The administrator should be able to preview a Story before publishing it.

If full preview functionality delays the MVP, a protected draft page may be used temporarily.

---

### 7.3 Basic Content Validation

The system should warn the editor when:

* a Story has no Source;
* a Story has no summary;
* a Story has no Place;
* a Story has no Theme;
* a published Story has no SEO description;
* or a location has not been verified.

Critical publishing errors should be distinguished from optional warnings.

---

### 7.4 Soft Deletion

Important content should use soft deletion where practical.

A record marked as deleted should be recoverable and should not immediately destroy its relationships.

---

### 7.5 Change History

The system should record:

* who created a Story;
* who last edited it;
* when it was created;
* and when it was updated.

A full document comparison interface is not required for the initial MVP.

---

### 7.6 Featured Story Selection

An administrator should be able to select a featured Story for the homepage.

If this is not implemented initially, the most recent approved Story may be used as a temporary fallback.

---

## 8. Planned After the Core MVP

The following features are part of the broader Atlas direction but should normally be built after the basic workflow has been tested with real content.

---

### 8.1 People

Future support should include:

* public names;
* aliases;
* anonymous identities;
* biographies;
* roles;
* related Stories;
* and related Organizations.

---

### 8.2 Organizations

Future support should include:

* shops;
* market stalls;
* family businesses;
* farms;
* community kitchens;
* and related organizations.

Organization pages should act as records, not review listings.

---

### 8.3 Foods

Future support should connect Stories through:

* dishes;
* ingredients;
* drinks;
* preparation methods;
* and regional food names.

The system should avoid presenting disputed origins as unquestioned facts.

---

### 8.4 Media Library

Future support should manage:

* images;
* audio;
* videos;
* subtitles;
* rights status;
* captions;
* credits;
* and reusable media relationships.

---

### 8.5 AI-Assisted Workflow

AI may later assist with:

* transcript cleaning;
* summaries;
* entity suggestions;
* Theme suggestions;
* Story drafts;
* SEO drafts;
* translation;
* and duplicate detection.

AI must not independently publish or verify uncertain facts.

---

### 8.6 YouTube Automation

Future workflow automation may include:

* retrieving video metadata;
* importing subtitles;
* tracking Source availability;
* generating publication drafts;
* and connecting Atlas records to YouTube production workflows.

Manual operation must remain available when automation fails.

---

### 8.7 Multilingual Content

Future versions may support:

* multilingual Story content;
* translated interface text;
* original-language names;
* localized SEO;
* and language-specific URLs.

The first MVP may use one primary interface language.

---

### 8.8 Semantic Search

Future search may support questions such as:

```text
Show me stories about family-run shops in changing neighborhoods.
```

This should only be added after structured data and basic search are reliable.

---

### 8.9 Editorial Analytics

Future analytics may include:

* Story readership;
* internal search behavior;
* map interactions;
* related-content navigation;
* Source processing time;
* and editorial workflow performance.

Analytics should support decisions rather than become the main purpose of the platform.

---

### 8.10 Public API

A controlled API may later expose selected public Atlas data.

The MVP does not require a public API.

---

## 9. Explicitly Out of Scope for the MVP

The following features must not be included in the initial MVP unless the scope document is formally revised.

---

### 9.1 User Accounts

The MVP will not include public user registration.

---

### 9.2 Comments and Ratings

The MVP will not include:

* public comments;
* restaurant ratings;
* star scores;
* popularity rankings;
* or user reviews.

---

### 9.3 Restaurant Recommendations

The MVP will not provide:

* “best restaurant” rankings;
* must-eat lists;
* price comparisons;
* reservation services;
* delivery links;
* or commercial restaurant recommendations.

---

### 9.4 Social Network Features

The MVP will not include:

* user profiles;
* follows;
* private messages;
* activity feeds;
* public collections;
* or creator communities.

---

### 9.5 Native Mobile Applications

The MVP will be a responsive website.

Separate iOS and Android applications are out of scope.

---

### 9.6 Advanced Recommendation Algorithms

The MVP will not use personalized recommendation systems.

Related Stories may use simple shared Place or Theme relationships.

---

### 9.7 Real-Time Collaboration

The MVP will not support multiple editors working in the same document at the same time.

---

### 9.8 Complex Approval Chains

The MVP will not require multi-level enterprise approval.

A simple editorial status workflow is sufficient.

---

### 9.9 Fully Autonomous AI Agents

The MVP will not permit AI agents to:

* publish content;
* contact people;
* change verified records;
* merge identities;
* or make legal and copyright decisions without human approval.

---

### 9.10 Self-Hosted AI Models

The MVP will not require FoodForFun to operate its own large language model infrastructure.

---

### 9.11 Microservices

The MVP will not be divided into multiple independent backend services unless a specific unavoidable requirement appears.

---

### 9.12 Custom Map Infrastructure

The MVP will not operate a self-hosted map tile server or custom geographic platform.

---

### 9.13 Large Global Food Encyclopedia

The MVP will only record Foods that are directly relevant to existing FoodForFun content.

It will not attempt to catalog all global foods.

---

### 9.14 Live Business Information

The MVP will not promise real-time accuracy for:

* operating hours;
* menu prices;
* temporary closures;
* reservations;
* or inventory.

Where business information is displayed, the last verification date should be made clear.

---

## 10. Content Target for MVP Launch

Before public launch, the MVP should contain at least:

```text
10 published Stories
10 connected Sources
5 Places
5 Themes
```

The content set should include varied examples:

* more than one country or region;
* more than one language;
* both precise and approximate locations;
* different Story lengths;
* and different types of daily food-related work.

The initial content set should test the system, not merely fill the homepage.

---

## 11. MVP Completion Criteria

The MVP is considered complete when all of the following are true.

### Editorial Workflow

* an administrator can create a Source;
* an administrator can preserve transcript information;
* an administrator can create and edit a Story;
* a Story can connect to Sources, Places, and Themes;
* a Story can move through the editorial workflow;
* and a Story can be published without direct database access.

### Public Website

* published Stories have stable public pages;
* draft Stories remain private;
* visitors can browse Stories;
* visitors can search public content;
* visitors can use a basic map;
* visitors can open Place pages;
* and visitors can view Source information.

### Content

* at least 10 real Stories have been processed;
* all public Stories have at least one Source;
* locations have been reviewed;
* no private location is exposed;
* and duplicate Places and Themes have been reviewed.

### Technical

* the production site is deployed;
* admin access is protected;
* environment secrets are not committed;
* database migrations are stored in GitHub;
* basic backups are configured;
* mobile pages are usable;
* and critical errors are handled.

### Documentation

* the README is current;
* product vision is documented;
* MVP scope is documented;
* data structure is documented;
* admin workflow is documented;
* and deployment instructions are documented.

---

## 12. Scope Change Rule

A feature should not be added to the MVP simply because it is interesting or technically possible.

Before adding a new feature, answer:

1. Is it required to complete the Source-to-Story publishing workflow?
2. Is it required for visitors to discover and read the first Stories?
3. Does delaying it prevent meaningful testing?
4. Does it introduce substantial maintenance or security work?
5. Can it be added after launch without rebuilding the foundation?

If the feature is not necessary to prove the core workflow, it should normally remain outside the MVP.

---

## 13. Priority Order

When development time is limited, priority should be:

```text
1. Accurate content and source preservation
2. Reliable admin workflow
3. Stable Story pages
4. Privacy and security
5. Search and map discovery
6. Visual refinement
7. Automation
8. Advanced features
```

A simple and reliable interface is more valuable than a visually impressive but incomplete system.

---

## 14. MVP Guiding Principle

The MVP is not a smaller version of every future feature.

It is the smallest complete system that proves the core value of FoodForFun Atlas:

> Source material can become accurate, connected, and discoverable stories about people and everyday life through food.
