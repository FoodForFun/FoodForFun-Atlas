# FoodForFun Atlas — Admin Workflow

**Document Version:** 0.1
**Project Version:** 0.1
**Status:** Draft
**Last Updated:** July 2026

---

## 1. Purpose of This Document

This document defines the administrative and editorial workflow for FoodForFun Atlas.

It explains how an administrator moves content from original source material to a published Atlas Story.

The workflow is designed to:

* preserve original information;
* reduce data-entry mistakes;
* separate AI suggestions from verified records;
* prevent accidental publication;
* support future team collaboration;
* and keep the process understandable for non-technical editors.

This document describes the intended workflow and interface behavior.

It is not an implementation guide or source code specification.

---

## 2. Core Workflow

The core FoodForFun Atlas workflow is:

```text
Add Source
    ↓
Review Source Information
    ↓
Add or Clean Transcript
    ↓
Analyze Content
    ↓
Review Suggested Entities
    ↓
Create Story Draft
    ↓
Edit Story
    ↓
Review Relationships
    ↓
Run Publication Checks
    ↓
Preview
    ↓
Publish
```

The first MVP may perform some steps manually.

Automation should be added only after the manual workflow is proven reliable.

---

## 3. Main Admin User

The primary admin user is the FoodForFun editor or project administrator.

The admin should not need to understand database structure or write code.

The interface should guide the editor through the workflow in clear steps.

The admin should be able to:

* add a Source;
* preserve transcript information;
* create and edit a Story;
* connect the Story to structured Atlas data;
* review content;
* preview the public page;
* publish the Story;
* correct published information;
* and archive content when necessary.

---

## 4. Admin Navigation Structure

The first admin interface should contain:

```text
Atlas Admin
├── Dashboard
├── Sources
├── Stories
├── Atlas Data
│   ├── Places
│   ├── Themes
│   ├── People
│   ├── Organizations
│   └── Foods
├── Media
└── Settings
```

The first MVP may initially include only:

```text
Dashboard
Sources
Stories
Places
Themes
Settings
```

People, Organizations, Foods, and Media may be added after the basic Story workflow is stable.

---

## 5. Dashboard

### Purpose

The Dashboard should tell the editor what requires attention.

It should not prioritize decorative analytics.

The main question it should answer is:

> What should I work on next?

---

### Recommended Dashboard Sections

```text
Needs Attention
├── Sources missing transcripts
├── Sources ready for review
├── Stories waiting for editing
├── Stories waiting for approval
├── Stories ready to publish
└── Records with privacy or rights warnings
```

---

### Example Dashboard Cards

```text
3 Sources Missing Transcripts
5 Stories Need Review
2 Stories Ready to Publish
1 Location Needs Verification
```

Each card should link directly to the relevant filtered list.

---

### Recent Activity

The Dashboard may also show:

* recently created Sources;
* recently updated Stories;
* recently published Stories;
* and recent admin actions.

Example:

| Item                    | Status       | Updated    | Action   |
| ----------------------- | ------------ | ---------- | -------- |
| Osaka Breakfast Shop    | Needs Review | Today      | Continue |
| Vancouver Family Bakery | Draft        | Yesterday  | Edit     |
| Taipei Market Stall     | Published    | 3 days ago | View     |

---

## 6. Source Workflow

A Source is the starting point for Atlas content.

The Source workflow should remain separate from the Story workflow.

---

## 7. Step One — Add Source

The editor begins by selecting:

```text
Add Source
```

The first screen should remain simple.

For a YouTube Source, the main input may be:

```text
YouTube URL
[________________________________]

[Continue]
```

For non-YouTube Sources, the editor may select a Source type.

---

### Supported Source Types

The first version should support:

```text
YOUTUBE_VIDEO
INTERVIEW
FIELD_NOTE
WEBSITE
ARTICLE
PHOTO
MANUAL_ENTRY
```

The interface should display understandable names rather than database values.

Example:

| System Value  | Admin Label   |
| ------------- | ------------- |
| YOUTUBE_VIDEO | YouTube Video |
| FIELD_NOTE    | Field Note    |
| MANUAL_ENTRY  | Manual Entry  |

---

## 8. YouTube Source Information

When a YouTube URL is entered, the system may later retrieve:

* video title;
* YouTube Video ID;
* channel name;
* publication date;
* description;
* thumbnail;
* duration;
* and available language information.

During the first MVP, this information may be entered manually.

Automation must not prevent manual correction.

---

### Source Form Fields

Recommended fields:

```text
Source Type
Original Title
Source URL
External ID
Publisher or Channel
Original Publication Date
Original Language
Original Description
Availability Status
Rights Note
```

---

### Required Source Fields

The minimum required fields should be:

```text
source_type
processing_status
collected_at
```

For a YouTube Source, the URL or Video ID should normally also be required.

---

### Duplicate Source Check

Before saving, the system should search for an existing Source with the same:

* URL;
* YouTube Video ID;
* or external identifier.

If a possible duplicate exists, the editor should see:

```text
Possible Existing Source

This YouTube video may already exist in Atlas.

[Open Existing Source]
[Continue Anyway]
[Cancel]
```

The system should discourage duplicate Sources but should allow the editor to continue when the records are genuinely different.

---

## 9. Step Two — Review Source Information

After saving the basic Source, the editor reviews the captured information.

Recommended page structure:

```text
Source Information

Original Title
Publisher
Publication Date
Original Language
Source URL
Original Description
Thumbnail
Availability Status
Rights Notes
```

The editor should be able to correct automatic metadata.

Automatic data should never be treated as permanently verified without review.

---

### Source Save Options

The page should provide:

```text
[Save Draft]
[Continue to Transcript]
```

At this stage, a Source exists, but no Story is required.

---

## 10. Step Three — Transcript Management

Transcript information is one of the most important Source assets.

The system should support:

```text
1. Import available captions
2. Upload a transcript file
3. Paste transcript text
4. Record that no transcript exists
```

---

### Transcript Fields

The system should preserve:

```text
raw_transcript
cleaned_transcript
transcript_quality
```

---

### Raw Transcript

The raw transcript should preserve the original text as closely as possible.

It may contain:

* timestamps;
* caption line breaks;
* repeated phrases;
* automatic transcription errors;
* music labels;
* and speaker labels.

The raw transcript should not be overwritten by cleaning or AI processing.

---

### Cleaned Transcript

The cleaned transcript may:

* remove timestamps;
* combine broken sentences;
* remove obvious duplicated caption fragments;
* remove irrelevant caption markers;
* and improve readability without changing meaning.

The cleaned transcript should remain traceable to the original transcript.

---

### Transcript Quality

The editor should select:

```text
GOOD
USABLE
POOR
MISSING
```

Admin labels may display:

| System Value | Admin Label |
| ------------ | ----------- |
| GOOD         | Good        |
| USABLE       | Usable      |
| POOR         | Poor        |
| MISSING      | Missing     |

---

### Transcript Warning

When transcript quality is `POOR` or `MISSING`, the interface should show:

```text
This Source has limited transcript information.
Story drafts and AI analysis may be incomplete or inaccurate.
```

This warning should not prevent manual processing.

---

## 11. Step Four — Source Processing Status

Recommended Source status flow:

```text
NEW
    ↓
TRANSCRIPT_MISSING
or
READY_FOR_REVIEW
    ↓
PROCESSED
    ↓
ARCHIVED
```

Future AI-related states may include:

```text
AI_PROCESSING
AI_PROCESSED
PROCESSING_FAILED
```

---

### Status Meanings

| Status             | Meaning                                              |
| ------------------ | ---------------------------------------------------- |
| NEW                | Source has been created but not fully prepared       |
| TRANSCRIPT_MISSING | Transcript is required or unavailable                |
| READY_FOR_REVIEW   | Source information is ready for editorial processing |
| PROCESSED          | Source has been reviewed and used                    |
| ARCHIVED           | Source is retained but no longer active              |
| AI_PROCESSING      | AI analysis is currently running                     |
| AI_PROCESSED       | AI suggestions are ready                             |
| PROCESSING_FAILED  | Automated processing failed                          |

The manual workflow must continue to work even when AI processing fails.

---

## 12. Step Five — AI Analysis

AI analysis is not required for the first manual MVP.

When introduced, AI should create suggestions rather than verified records.

The editor may select:

```text
Analyze with AI
```

The AI analysis may generate:

* internal content summary;
* suggested Story angle;
* People suggestions;
* Organization suggestions;
* Place suggestions;
* Food suggestions;
* Theme suggestions;
* Story draft;
* SEO draft;
* translation suggestions;
* and warnings about uncertain information.

---

## 13. AI Analysis Output Structure

AI output should be divided into clear sections.

Recommended structure:

```text
Content Summary
Story Suggestions
People Suggestions
Organization Suggestions
Place Suggestions
Food Suggestions
Theme Suggestions
Uncertainties
Warnings
```

AI should not return only one long unstructured response.

---

### Suggested Entity Information

Each AI suggestion should include:

```text
Suggested Value
Entity Type
Confidence
Evidence Summary
Possible Existing Match
Review Status
```

Example:

```text
Suggested Place: Osaka
Confidence: High
Evidence: Mentioned repeatedly in transcript and description
Possible Match: Osaka City
Status: Pending Review
```

---

### AI Confidence

Suggested confidence levels:

```text
HIGH
MEDIUM
LOW
```

Confidence must not be interpreted as factual verification.

It is only an indication of the AI system’s certainty.

---

## 14. AI Review Actions

For each suggestion, the editor should be able to:

```text
[Use Existing Record]
[Create New Record]
[Edit Suggestion]
[Ignore]
```

The system should search existing records before creating a new one.

This is especially important for:

* Places;
* Themes;
* People;
* Organizations;
* and Foods.

---

## 15. Step Six — Create Story Draft

After Source information is prepared, the editor may select:

```text
Create Story Draft
```

The Story draft may be:

* created manually;
* created from a template;
* or generated from AI suggestions.

The initial status must be:

```text
DRAFT
```

When AI-generated content is used, the Story may later support an additional status:

```text
AI_PROCESSED
```

AI must not create a published Story automatically.

---

## 16. Story Editor Structure

The Story editor should be divided into clear sections or tabs.

Recommended structure:

```text
Story Editor
├── Content
├── Connections
├── Media
├── SEO
├── Review
└── History
```

The MVP may initially combine some sections, but the information should remain logically separated.

---

## 17. Content Tab

The Content section should include:

```text
Title
Subtitle
Summary
Body
Atlas Insight
Original Language
Status
Publication Date
```

---

### Title

The title should:

* describe the Story accurately;
* remain calm and specific;
* avoid exaggerated emotional language;
* and differ from the original YouTube title when necessary.

---

### Subtitle

The subtitle may provide:

* location context;
* time context;
* or a short supporting description.

It should not repeat the title.

---

### Summary

The summary should:

* briefly explain what the Story is about;
* work on Story cards;
* work in search results;
* and normally remain shorter than the full introduction.

---

### Body

The body is the edited public Story.

It should not be a direct transcript copy.

The editor may structure it around:

* daily routine;
* place;
* work;
* people;
* business;
* community;
* change;
* and the role of food in the Story.

---

### Atlas Insight

Atlas Insight is a short editorial observation.

It should connect the Story to a broader human or social understanding without forcing an emotional conclusion.

Recommended example:

```text
For the people who pass through this neighborhood each morning,
the shop is not only a place to buy breakfast.
It is also part of the rhythm by which the day begins.
```

Not recommended:

```text
The owner’s incredible perseverance has inspired everyone.
```

Atlas Insight should remain specific, restrained, and evidence-based.

---

## 18. Story Status Workflow

Recommended Story workflow:

```text
DRAFT
    ↓
NEEDS_REVIEW
    ↓
APPROVED
    ↓
PUBLISHED
    ↓
ARCHIVED
```

---

### DRAFT

Used when:

* content is incomplete;
* relationships are incomplete;
* or the editor is still working.

Draft Stories must remain private.

---

### NEEDS_REVIEW

Used when:

* the first edit is complete;
* Sources are connected;
* and another editorial check is required.

---

### APPROVED

Used when:

* content is ready;
* required checks have passed;
* and the Story may be published.

---

### PUBLISHED

Used when:

* the Story is publicly available;
* a publication date is recorded;
* and public pages may display it.

---

### ARCHIVED

Used when:

* the Story should no longer appear in normal public browsing;
* but the content and relationships should remain preserved.

Archiving should not permanently delete the Story.

---

## 19. Connections Tab

The Connections section manages links between the Story and Atlas entities.

The MVP should include:

```text
Sources
Places
Themes
```

Later phases may include:

```text
People
Organizations
Foods
Media
```

---

## 20. Source Connections

The editor should be able to:

* search existing Sources;
* connect multiple Sources;
* identify the primary Source;
* assign a Source role;
* and remove a relationship without deleting the Source.

Recommended Source roles:

```text
PRIMARY
SUPPORTING
REFERENCE
FOLLOW_UP
```

At least one Source should normally be required before publication.

---

## 21. Place Connections

The editor should be able to:

* search existing Places;
* create a Place when no match exists;
* select the primary Place;
* assign a relationship type;
* and control display order.

Recommended relationship types:

```text
PRIMARY_LOCATION
FILMING_LOCATION
RELATED_LOCATION
ORIGIN_LOCATION
BACKGROUND_LOCATION
```

---

### Place Creation Check

Before creating a new Place, the interface should search:

* name;
* native name;
* country;
* and known aliases.

Possible duplicate results should be shown clearly.

---

### Location Privacy

When a Place is connected, the editor should see:

```text
Location Precision
Verification Status
Public Map Preview
```

The interface should warn the editor when:

* coordinates are more precise than the public visibility level;
* a private residence is set to `EXACT`;
* or the location has not been verified.

---

## 22. Theme Connections

The editor should be able to:

* search active Themes;
* select multiple Themes;
* mark one or more as primary;
* review Theme definitions;
* and request a new Theme when necessary.

Recommended relevance levels:

```text
PRIMARY
SECONDARY
BACKGROUND
```

---

### Creating a New Theme

A new Theme should not be created directly without checking existing Themes.

The interface should show:

```text
Possible Existing Themes

Independent Operation
Family Business
Neighborhood Shop
```

The editor should decide whether the new idea is genuinely distinct.

---

## 23. Future People Workflow

When People are added, the editor should be able to:

* search existing People;
* create a public name;
* use a partial name;
* use a public alias;
* record an anonymous identity;
* assign a role in the Story;
* and mark a primary person.

The system must not require a full legal name.

---

### Identity Levels

```text
PUBLIC_NAME
PUBLIC_ALIAS
PARTIAL_NAME
ANONYMOUS
```

The public display must follow the chosen identity level.

---

## 24. Future Organization Workflow

When Organizations are added, the editor should be able to:

* search existing Organizations;
* create a shop or organization;
* connect it to a Place;
* record operating status;
* record a public website;
* record the last verification date;
* and connect People to the Organization.

The system should not treat an Organization as a geographic Place.

---

## 25. Future Food Workflow

When Foods are added, the editor should be able to:

* search existing Food records;
* view native and translated names;
* mark primary or secondary importance;
* and connect the Food to multiple Stories.

The system should avoid creating duplicate Foods based only on translation differences.

---

## 26. Media Tab

The Media section may manage:

* cover images;
* Story images;
* embedded videos;
* audio;
* subtitle files;
* and supporting documents.

Each Media record should include where practical:

```text
Title
Alt Text
Caption
Credit
Rights Status
Storage Location
Original URL
```

---

### Rights Status

Recommended values:

```text
OWNED
LICENSED
PUBLIC_DOMAIN
EMBED_ONLY
PENDING_REVIEW
DO_NOT_PUBLISH
```

---

### Publication Rules

Media with the following status must block public publication:

```text
DO_NOT_PUBLISH
```

Media with this status should produce a warning or block depending on policy:

```text
PENDING_REVIEW
```

Embedded YouTube content may use:

```text
EMBED_ONLY
```

This means the video may be embedded from its original platform but should not be copied into Atlas storage.

---

## 27. SEO Tab

The SEO section should include:

```text
SEO Title
SEO Description
URL Slug
Social Sharing Image
Search Preview
```

---

### SEO Title

The SEO title may be more descriptive than the editorial Story title.

Example editorial title:

```text
Before Sunrise, the Breakfast Shop Is Already Open
```

Example SEO title:

```text
Inside an Osaka Neighborhood Breakfast Shop | FoodForFun Atlas
```

The SEO title should remain truthful and restrained.

---

### SEO Description

The SEO description should summarize:

* the Story;
* location;
* people or work involved;
* and the reason the page may be relevant.

It should not use exaggerated clickbait.

---

### Slug

The editor should see a warning before changing the slug of a published Story.

A published slug should remain stable unless redirects are implemented.

---

## 28. Review Tab

The Review section should run checks before publication.

Checks should be divided into:

```text
Content
Relationships
Privacy
Rights
SEO
Technical
```

---

## 29. Content Checks

Recommended checks:

* title exists;
* summary exists;
* body exists;
* Story is not empty;
* original language is selected;
* publication date is valid;
* and Atlas Insight has been reviewed when present.

---

## 30. Relationship Checks

Recommended checks:

* at least one Source is connected;
* a primary Source is selected;
* at least one Place is connected;
* a primary Place is selected;
* at least one Theme is connected;
* and no required relationship is broken.

Some relationship checks may be warnings rather than errors.

---

## 31. Privacy Checks

Recommended checks:

* hidden locations are not displayed;
* private residences are not published at exact precision;
* uncertain identities are not shown as verified names;
* sensitive personal details are not exposed;
* and internal notes are not included in public content.

---

## 32. Rights Checks

Recommended checks:

* cover image rights are known;
* image credits are present where required;
* `DO_NOT_PUBLISH` media is not used;
* copied Source material is not presented as original Atlas photography;
* and original video attribution is present when needed.

---

## 33. SEO Checks

Recommended checks:

* slug is valid;
* SEO title exists;
* SEO description exists;
* social image is available when required;
* and the title is not misleading.

SEO checks may initially appear as warnings rather than publication blockers.

---

## 34. Review Result Levels

Checks should use:

```text
ERROR
WARNING
PASSED
```

---

### Error

An Error blocks publication.

Examples:

* no Story title;
* no Story body;
* no Source relationship;
* unpublished media rights violation;
* private exact location exposed;
* invalid slug;
* or database validation failure.

---

### Warning

A Warning allows publication but requires attention.

Examples:

* no Atlas Insight;
* no SEO description;
* transcript quality is poor;
* Place is unverified;
* or no cover image is available.

---

### Passed

Passed confirms that the check is complete.

---

## 35. Preview

Before publication, the editor should be able to preview the Story as it will appear publicly.

The preview should show:

* desktop layout;
* mobile layout where practical;
* title;
* summary;
* body;
* connections;
* Source information;
* map information;
* and media.

A preview URL must remain private and difficult to guess.

---

## 36. Publish Action

The Publish action should require a deliberate confirmation.

Example:

```text
Publish Story?

This Story will become publicly accessible.

[Cancel]
[Publish]
```

The confirmation should display unresolved warnings.

Errors must block the action.

---

### On Publication

The system should:

* change status to `PUBLISHED`;
* set `published_at` when missing;
* create or update the public page;
* include the Story in public search;
* include the Story in relevant Place and Theme pages;
* and record the publishing user.

---

## 37. Editing a Published Story

Published Stories may require corrections.

The editor should be able to:

* update content;
* update relationships;
* correct a location;
* update Source information;
* and publish the revision.

Changes should not automatically alter the public slug.

---

### Major Corrections

For significant corrections, the system may later support:

```text
Correction Note
Corrected At
Corrected By
```

The MVP may initially record changes in the edit history.

---

## 38. Archiving a Story

A Story may be archived when:

* it should no longer appear in normal public browsing;
* it contains information requiring further review;
* it has been replaced;
* or the project decides to preserve it without active promotion.

Archiving should:

* remove it from public indexes;
* preserve the record;
* preserve relationships;
* preserve edit history;
* and allow later restoration.

---

## 39. Source Unavailability

A YouTube video or website may later become unavailable.

The editor should be able to change:

```text
availability_status
```

to:

```text
UNAVAILABLE
PRIVATE
UNKNOWN
```

The related Story should remain available unless there is another editorial or rights reason to remove it.

The Source page should clearly indicate that the original material is no longer available.

---

## 40. One Source Creating Multiple Stories

The system must support one Source contributing to several Stories.

Example:

```text
One market documentary
├── Story about a fish vendor
├── Story about a breakfast stall
└── Story about the market’s changing neighborhood
```

The Source page should display all connected Stories.

---

## 41. Multiple Sources Creating One Story

The system must support several Sources contributing to one Story.

Example:

```text
Story
├── Original YouTube video
├── Follow-up interview
├── Field notes
└── Supporting article
```

The editor should identify which Source is primary.

---

## 42. Autosave

The Story editor should autosave draft changes where practical.

The interface should display:

```text
Saved
Saving
Save Failed
```

Autosave failure must be visible.

The editor should not assume work has been saved when it has not.

---

## 43. Edit History

The system should record at minimum:

```text
created_at
created_by
updated_at
updated_by
```

Future history may include:

* content versions;
* changed fields;
* publication history;
* status changes;
* and rollback.

The first MVP does not require Google Docs-style comparison.

---

## 44. Admin Roles

The system should plan for three roles:

```text
CONTRIBUTOR
EDITOR
PUBLISHER
```

---

### Contributor

May:

* create Sources;
* create Stories;
* edit drafts;
* and submit Stories for review.

May not publish.

---

### Editor

May:

* review Sources;
* edit Stories;
* review relationships;
* manage Places and Themes;
* and approve content.

May not necessarily publish.

---

### Publisher

May:

* publish Stories;
* archive Stories;
* correct published content;
* and manage publication-level settings.

During the first MVP, one administrator may hold all roles.

---

## 45. Admin Permission Rules

Unauthenticated users must not access admin pages.

Authenticated users should only receive permissions assigned to their role.

The public client must not be able to:

* create Sources;
* edit Stories;
* read draft content;
* access raw transcripts;
* read AI suggestions;
* or view internal rights notes.

Permissions should be enforced in both:

* the application;
* and the database.

---

## 46. Error Handling

Admin errors should explain:

* what failed;
* what was not saved;
* and what action the editor should take.

Examples:

```text
The Story could not be saved.
Your text is still available on this page.
Please try again.
```

```text
This slug is already in use.
Choose another slug or open the existing Story.
```

```text
The Source could not be connected.
The Story was saved without this relationship.
```

Technical database details should not be exposed to the editor.

---

## 47. Manual Workflow Requirement

Every critical editorial task should remain possible without AI.

The editor must be able to:

* create a Source manually;
* paste a transcript;
* create a Story manually;
* add Places and Themes manually;
* review content;
* and publish manually.

AI is an assistant, not a required dependency.

---

## 48. MVP Admin Pages

The initial implementation should prioritize:

```text
/admin/login
/admin
/admin/sources
/admin/sources/new
/admin/sources/[id]
/admin/stories
/admin/stories/new
/admin/stories/[id]
/admin/places
/admin/themes
```

Future pages may include:

```text
/admin/people
/admin/organizations
/admin/foods
/admin/media
/admin/ai-review
/admin/settings
```

---

## 49. Source List Page

The Source list should display:

| Field             | Purpose                        |
| ----------------- | ------------------------------ |
| Title             | Identify the Source            |
| Source Type       | YouTube, interview, note, etc. |
| Language          | Original language              |
| Transcript        | Available or missing           |
| Processing Status | Current workflow state         |
| Connected Stories | Number of Stories              |
| Updated At        | Last activity                  |
| Action            | Open or continue               |

Recommended filters:

```text
Source Type
Language
Processing Status
Transcript Quality
Has Story
Collected Date
```

---

## 50. Story List Page

The Story list should display:

| Field         | Purpose               |
| ------------- | --------------------- |
| Title         | Story identification  |
| Status        | Editorial state       |
| Primary Place | Main location         |
| Themes        | Main Themes           |
| Updated At    | Last edit             |
| Published At  | Publication date      |
| Action        | Edit, review, or view |

Recommended filters:

```text
Status
Place
Theme
Original Language
Published Date
Updated Date
```

---

## 51. Place Management Page

The Place management page should support:

* search;
* create;
* edit;
* hierarchy review;
* verification;
* location precision;
* map preview;
* and related Story count.

The system should highlight possible duplicates.

---

## 52. Theme Management Page

The Theme page should support:

* search;
* create;
* edit;
* description;
* Theme group;
* active or inactive status;
* related Story count;
* and duplicate review.

Inactive Themes should remain connected to existing Stories but should not be suggested for new assignments.

---

## 53. Workflow Metrics

The project may later measure:

* time from Source creation to publication;
* time spent cleaning transcripts;
* number of rejected AI suggestions;
* number of duplicate Place warnings;
* number of Stories waiting for review;
* and number of publication errors.

These metrics should improve the workflow.

They should not become performance pressure that reduces editorial quality.

---

## 54. MVP Workflow Example

A YouTube video about a breakfast shop in Osaka is added.

### Step 1 — Add Source

```text
Source Type: YouTube Video
URL: Original video URL
Language: Japanese
Status: NEW
```

### Step 2 — Review Source

The editor confirms:

* title;
* channel;
* publication date;
* description;
* and Video ID.

### Step 3 — Add Transcript

The editor imports or pastes the Japanese transcript.

```text
Transcript Quality: USABLE
```

### Step 4 — Process Source

The Source becomes:

```text
READY_FOR_REVIEW
```

### Step 5 — Create Story Draft

The editor creates:

```text
Title: Before Sunrise, the Breakfast Shop Is Already Open
Status: DRAFT
```

### Step 6 — Connect Data

```text
Primary Source: Original YouTube Video
Primary Place: Osaka
Themes:
- Morning Work
- Independent Operation
- Neighborhood Life
```

### Step 7 — Review

The system checks:

* Story body exists;
* Source exists;
* Place exists;
* Theme exists;
* location precision is safe;
* and no publication rights error exists.

### Step 8 — Approve

The Story moves to:

```text
APPROVED
```

### Step 9 — Publish

The Story becomes publicly accessible.

```text
Status: PUBLISHED
Published At: Stored in UTC
```

---

## 55. Workflow Non-Goals

The first admin workflow will not require:

* real-time collaborative editing;
* public user submissions;
* complex enterprise approval chains;
* AI autonomous publication;
* automatic copyright decisions;
* automatic identity verification;
* automatic exact-location confirmation;
* bulk publishing;
* social media scheduling;
* or a complete mobile admin application.

---

## 56. Admin Workflow Completion Criteria

The initial admin workflow is complete when an administrator can:

1. sign in;
2. create a Source;
3. edit Source information;
4. add transcript information;
5. create a Story;
6. connect Sources;
7. connect Places;
8. connect Themes;
9. save a draft;
10. move the Story through review;
11. pass publication checks;
12. preview the Story;
13. publish it;
14. edit it after publication;
15. and archive it without direct database access.

---

## 57. Workflow Decision Principle

When designing an admin feature, ask:

> Does this make it easier to preserve accurate source material, make a clear editorial decision, or publish a reliable Story?

If it does not support one of these purposes, it may not belong in the initial admin workflow.

---

## 58. Core Admin Workflow Statement

The FoodForFun Atlas admin system is not simply a collection of database forms.

It is an editorial workflow that transforms original material into reviewed, connected, and publishable Stories.

The system should guide the editor clearly, preserve the original Source, prevent accidental publication, and keep human judgment at the center of every important decision.
