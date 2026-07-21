# FoodForFun Atlas — Frontend Structure

**Document Version:** 0.1
**Project Version:** 0.1
**Status:** Draft
**Last Updated:** July 2026

---

## 1. Purpose of This Document

This document defines the public-facing website structure for FoodForFun Atlas.

It describes:

* the purpose of the public website;
* the main navigation;
* the required MVP pages;
* the content displayed on each page;
* the relationships between pages;
* mobile and accessibility principles;
* SEO responsibilities;
* and the boundary between the MVP and future frontend features.

This document is an information architecture and product specification.

It does not define final visual design or implementation code.

---

## 2. Frontend Objective

The FoodForFun Atlas website should help visitors move from one specific Story into a wider understanding of:

* a person;
* a shop or organization;
* a neighborhood;
* a place;
* a food;
* a theme;
* and similar experiences in other parts of the world.

The public website should support this discovery path:

```text
Story
  ↓
Person
  ↓
Organization
  ↓
Place
  ↓
Food
  ↓
Theme
  ↓
Related Story
```

The website should not behave like a simple YouTube archive.

It should turn separate pieces of content into a connected Atlas.

---

## 3. Core Frontend Principle

Every major public page should answer two questions:

1. What am I looking at?
2. Where can I go next?

A visitor should not reach the end of a Story and find no clear route to continue exploring.

The frontend should support discovery through:

* related Stories;
* Places;
* Themes;
* Foods;
* People;
* Organizations;
* search;
* and map navigation.

---

## 4. Editorial Position of the Website

The frontend should reflect the FoodForFun editorial style.

The experience should feel:

* calm;
* documentary-like;
* human;
* clear;
* restrained;
* spacious;
* and trustworthy.

The website should avoid:

* ranking language;
* exaggerated recommendation language;
* visual clutter;
* excessive animation;
* promotional restaurant design;
* star ratings;
* “must-eat” labels;
* and aggressive calls to action.

Food should be presented as an entry into human life, not as a product score.

---

## 5. Main Public Navigation

The first public navigation should remain simple.

Recommended primary navigation:

```text
Stories
Map
Explore
About
Search
```

The `Explore` menu may contain:

```text
Places
Themes
People
Organizations
Foods
```

During the first MVP, the public navigation may include only:

```text
Stories
Map
About
Search
```

Places and Themes may be reached through Story pages before they receive dedicated navigation items.

---

## 6. Recommended Route Structure

The MVP should use readable public routes.

```text
/
 /stories
 /stories/[slug]
 /places
 /places/[slug]
 /themes
 /themes/[slug]
 /map
 /search
 /about
```

Future routes may include:

```text
/people
/people/[slug]

/organizations
/organizations/[slug]

/foods
/foods/[slug]
```

Admin routes must remain separate:

```text
/admin
```

Public and admin page structures should not be mixed.

---

## 7. Public Page Hierarchy

```text
Home
├── Featured Story
├── Latest Stories
├── Explore by Place
├── Explore by Theme
└── About Atlas

Stories
├── Story Archive
└── Story Detail
    ├── Sources
    ├── Places
    ├── Themes
    ├── Related Stories
    └── Future entity connections

Map
├── Story markers
├── Place markers
└── Map result cards

Places
└── Place Detail
    ├── Description
    ├── Map
    └── Related Stories

Themes
└── Theme Detail
    └── Related Stories

Search
└── Search Results

About
└── Editorial and project information
```

---

## 8. Homepage

### Purpose

The homepage should introduce the project and provide several clear ways to begin exploring.

It should answer:

* What is FoodForFun Atlas?
* Why does it begin with food?
* What Story should I read first?
* Can I explore by location or theme?
* Where can I find more Stories?

The homepage should not try to display every available content type.

---

## 9. Homepage Hero

The first screen should contain:

```text
FoodForFun Atlas

Through food, understand people.
Through people, understand the world.

[Explore Stories]
[Open the Map]
```

A Chinese-language version may display:

```text
通过食物了解人，
通过人了解世界。
```

The hero may use:

* a documentary photograph;
* a quiet working scene;
* a shop before opening;
* a market or street environment;
* or a person preparing food.

The hero should not depend on a food glamour photograph.

---

## 10. Homepage Featured Story

The homepage should highlight one primary Story.

Recommended content:

* cover image;
* Story title;
* short summary;
* primary Place;
* one primary Theme;
* and a link to read the Story.

Example structure:

```text
Featured Story

Before Sunrise, the Breakfast Shop Is Already Open

Osaka, Japan

In a residential neighborhood, the shop begins preparing
rice balls and miso soup before most of the city is awake.

Morning Work

[Read the Story]
```

The featured Story should be selected manually where possible.

A recent published Story may be used as a fallback.

---

## 11. Homepage Latest Stories

The homepage should show a limited number of recent published Stories.

Recommended count:

```text
3 to 6 Stories
```

Each Story card should contain:

* cover image when available;
* title;
* short summary;
* primary Place;
* one primary Theme;
* and publication date when useful.

Cards should not display too many labels.

---

## 12. Homepage Explore by Place

The homepage may include a simplified geographic section.

Possible formats:

* a small map preview;
* a list of active cities;
* or a grid of Place cards.

Example:

```text
Explore by Place

Osaka — 8 Stories
Vancouver — 6 Stories
Taipei — 5 Stories
Tokyo — 4 Stories
```

The homepage should not attempt to show a fully interactive map if that creates unnecessary complexity.

A simple preview may link to the full Map page.

---

## 13. Homepage Explore by Theme

The homepage may show a small controlled set of Themes.

Example:

```text
Independent Operation
Family Business
Neighborhood Life
Morning Work
Food and Migration
Daily Labor
```

Each Theme card should include:

* Theme name;
* short description;
* related image when appropriate;
* and link to the Theme page.

The homepage should not display a large uncontrolled tag cloud.

---

## 14. Homepage Project Explanation

The homepage should contain a short explanation of the project.

Example:

```text
FoodForFun Atlas records the people, work, places, and communities
that exist around food.

It is not a restaurant ranking or review platform.
Each record begins with a specific Story and the people behind it.
```

The full explanation belongs on the About page.

---

## 15. Story Archive Page

### Route

```text
/stories
```

### Purpose

The Story archive allows visitors to browse published Stories.

The first version should prioritize clarity rather than advanced filtering.

---

### Required Story Archive Features

The page should:

* display only published Stories;
* sort by publication date;
* support pagination or incremental loading;
* link every card to a Story detail page;
* work on mobile;
* and display a clear empty state.

---

### Story Card Fields

A Story card should normally display:

```text
Cover Image
Title
Primary Place
Short Summary
Primary Theme
```

Optional:

```text
Publication Date
Reading Time
Original Language
```

The card should not display:

* star ratings;
* restaurant scores;
* price level;
* popularity rank;
* or too many Themes.

---

### Story Archive Filters

The MVP may initially support:

```text
Place
Theme
Language
Publication Date
```

Filters may be postponed if they complicate the first implementation.

Search remains a separate function.

---

## 16. Story Detail Page

### Route

```text
/stories/[slug]
```

### Purpose

The Story detail page is the most important public page in FoodForFun Atlas.

It should present a complete, readable, and trustworthy editorial record.

---

## 17. Story Page Header

Recommended header content:

```text
Primary Place
Story Title
Subtitle
Summary
Publication Date
Reading Time
```

Example:

```text
Osaka, Japan

Before Sunrise, the Breakfast Shop Is Already Open

A morning routine inside a small neighborhood shop.

Published July 2026
8 min read
```

The title should remain the strongest element.

Metadata should remain visually secondary.

---

## 18. Story Cover and Video

The Story page may include:

* cover image;
* image gallery;
* embedded YouTube video;
* audio;
* or other approved media.

The video should not automatically play.

The Story should remain readable even when the embedded Source becomes unavailable.

The video should support the Story rather than replace it.

---

## 19. Story Body

The body should be optimized for long-form reading.

It may contain:

* short section headings;
* photographs;
* quotations within copyright limits;
* captions;
* maps;
* and embedded Source media.

The body should not be a raw transcript.

The layout should support:

* readable line length;
* comfortable line spacing;
* clear paragraph separation;
* and strong mobile readability.

---

## 20. Atlas Insight

The Story page may include a separate Atlas Insight section.

Example:

```text
Atlas Insight

For people who pass through this neighborhood every morning,
the shop is not only somewhere to buy breakfast.
It is part of the familiar rhythm by which the day begins.
```

Atlas Insight should:

* remain short;
* stay grounded in the Story;
* avoid moral judgment;
* avoid exaggerated praise;
* and not repeat the summary.

---

## 21. Story Connections

The Story page should display structured Atlas relationships.

The MVP should include:

```text
Sources
Places
Themes
```

Future versions may add:

```text
People
Organizations
Foods
Media
```

Example:

```text
Places
Osaka
Japan

Themes
Morning Work
Independent Operation
Neighborhood Life
```

Each public entity should link to its own page when that page exists.

---

## 22. Story Source Section

The Story page should clearly explain the Source relationship.

Recommended fields:

* original Source title;
* Source type;
* original publisher;
* original publication date;
* original language;
* Source URL when publicly available;
* translation note;
* editorial note;
* and last review date.

Example:

```text
Sources

Original video:
A Small Breakfast Shop Opening at 4 a.m.

Publisher:
Original YouTube Channel

Original language:
Japanese

Editorial note:
This Story was edited from the original video, transcript,
and FoodForFun research notes.
```

Raw transcripts and internal Source notes should not be public by default.

---

## 23. Related Stories

Every Story page should end with related Stories.

Related Stories should preferably be selected through:

```text
Shared Theme
Shared Place
Shared Organization Type
Shared Food
Similar Daily Work
Editorial Selection
```

The first MVP may use simple shared Place or Theme relationships.

Related Story cards should explain the connection where practical.

Example:

```text
Related through Morning Work
```

This is more useful than unexplained recommendations.

---

## 24. Place Archive Page

### Route

```text
/places
```

### Purpose

The Place archive allows visitors to explore geographic areas represented in Atlas.

The first version may display:

* countries;
* cities;
* and neighborhoods with published Stories.

It should not become a tourism directory.

---

### Place Card Fields

A Place card may include:

```text
Place Name
Place Type
Country
Story Count
Short Description
```

Optional:

```text
Representative Image
Primary Themes
```

---

## 25. Place Detail Page

### Route

```text
/places/[slug]
```

### Purpose

The Place page connects geographic context to published Stories.

---

### Place Page Structure

Recommended structure:

```text
Place Name
Native Name
Place Type
Country or Parent Place
Short Description
Map
Related Stories
Related Themes
Future Organizations and Foods
```

---

### Country Page Example

```text
Japan

Stories
Cities
Themes
Foods
```

---

### City Page Example

```text
Osaka

12 Stories
8 Places
5 Themes

Map
Featured Stories
Latest Stories
```

---

### Neighborhood Page Example

```text
Example Neighborhood

A residential district represented through several Atlas Stories.

Related Stories
Related Organizations
Related Themes
```

The Place page should not automatically include:

* hotel recommendations;
* top attractions;
* travel itineraries;
* reservation links;
* or best restaurant lists.

---

## 26. Theme Archive Page

### Route

```text
/themes
```

### Purpose

The Theme archive shows the controlled editorial topics that connect Stories across locations.

The Theme archive should not resemble a large hashtag directory.

Themes should be limited, intentional, and clearly defined.

---

### Theme Card Fields

```text
Theme Name
Short Description
Related Story Count
Representative Story or Image
```

---

## 27. Theme Detail Page

### Route

```text
/themes/[slug]
```

### Purpose

A Theme page connects Stories that may come from different countries, foods, or communities.

Example:

```text
Independent Operation

Stories about small shops or working spaces maintained
by one person or a very small team.
```

Recommended content:

* Theme definition;
* featured Stories;
* all related Stories;
* represented Places;
* and future related People, Organizations, and Foods.

Theme pages are one of the main ways Atlas can show common human experiences across different places.

---

## 28. Map Page

### Route

```text
/map
```

### Purpose

The map should help visitors understand where Stories take place.

It is an exploration tool, not primarily a navigation service.

---

### Basic Map Features

The MVP map should:

* display public Atlas locations;
* respect location precision;
* show Story or Place markers;
* group overlapping locations where necessary;
* open a short preview card;
* and link to Story or Place pages.

---

### Map Marker Card

A marker card may display:

```text
Story Title
Primary Place
Short Summary
Primary Theme
[Read Story]
```

Example:

```text
Before Sunrise, the Breakfast Shop Is Already Open

Osaka, Japan

A small neighborhood shop begins preparing breakfast
before most of the city is awake.

Morning Work

[Read Story]
```

---

### Map Privacy Rules

The map must respect:

```text
EXACT
NEIGHBORHOOD
CITY
REGION
HIDDEN
```

Rules:

* `EXACT` may display the actual public coordinates.
* `NEIGHBORHOOD` should use an approximate point.
* `CITY` should use a city-level marker.
* `REGION` should use a broad regional marker.
* `HIDDEN` must not display a marker.

The frontend must never infer or reveal hidden coordinates.

---

### Map Non-Goals

The MVP map will not provide:

* driving directions;
* restaurant navigation;
* reservation actions;
* real-time location tracking;
* public user check-ins;
* advanced route planning;
* or 3D map experiences.

---

## 29. Search Page

### Route

```text
/search
```

Possible query format:

```text
/search?q=osaka
```

### Purpose

Search should help visitors find Stories and structured Atlas records.

---

### MVP Search Scope

The first search version should include:

```text
Story Titles
Story Summaries
Place Names
Theme Names
```

Future versions may include:

```text
Story Body
People
Organizations
Foods
Source Titles
Semantic Search
```

---

### Search Input

Recommended placeholder:

```text
Search stories, places, and themes
```

Future version:

```text
Search stories, people, places, foods, and themes
```

---

### Search Result Groups

Results should be grouped by content type.

Example:

```text
Stories
Places
Themes
```

Future:

```text
People
Organizations
Foods
```

The visitor should understand why each result matched.

---

### Search Result Card

A Story result may display:

```text
Title
Summary
Primary Place
Primary Theme
```

A Place result may display:

```text
Place Name
Place Type
Country
Story Count
```

A Theme result may display:

```text
Theme Name
Description
Story Count
```

---

### Empty Search State

Instead of displaying only:

```text
No Results
```

The page should provide useful next steps.

Example:

```text
No exact results were found.

Try:
- a broader Place name;
- a Food name;
- a related Theme;
- or browsing the Map.
```

The page may also show featured Themes or recent Stories.

---

## 30. About Page

### Route

```text
/about
```

### Purpose

The About page explains the project, editorial position, methodology, and boundaries.

---

### Recommended About Sections

```text
What Is FoodForFun Atlas?
Why Begin with Food?
How We Work
Editorial Principles
Sources and Transparency
Privacy
Corrections
Technology and AI
Contact
```

---

### About Page Core Statement

The page should clearly say:

```text
FoodForFun Atlas is not a restaurant ranking or review platform.

It records the people, work, places, and communities that exist around food.
```

---

### Corrections

The About page should explain how a visitor can report:

* factual errors;
* incorrect names;
* location concerns;
* rights concerns;
* outdated business information;
* or privacy issues.

A correction method should exist before public launch.

---

## 31. Future Person Page

### Route

```text
/people/[slug]
```

### Purpose

A Person page should present only relevant, reviewed, and publicly appropriate information.

It is not intended to become a complete biography.

---

### Planned Person Page Content

```text
Display Name
Native Name
Public Role
Short Biography
Primary Place
Related Organizations
Related Stories
Related Themes
```

If the full name is not public, the page should use:

* public alias;
* partial name;
* role description;
* or anonymous identity.

The frontend must not reveal hidden identity data.

---

## 32. Future Organization Page

### Route

```text
/organizations/[slug]
```

### Purpose

An Organization page should document a shop, market stall, farm, workshop, or community organization.

It should not operate as a commercial listing or rating page.

---

### Planned Organization Page Content

```text
Organization Name
Native Name
Organization Type
Place
Operating Status
Short Description
Related People
Related Stories
Related Foods
Last Verification Date
Official Links
```

If an Organization closes, the page may remain as a historical record.

The operating status should be clearly displayed.

---

## 33. Future Food Page

### Route

```text
/foods/[slug]
```

### Purpose

A Food page should connect the ways a Food appears in different Stories.

It should not attempt to provide one final or uncontested definition.

---

### Planned Food Page Content

```text
Canonical Name
Native Names
English Name
Short Description
Related Places
Related Stories
Related Organizations
Related Foods
```

The page should focus on Atlas records rather than copying encyclopedia content.

---

## 34. Global Header

The public header should include:

* FoodForFun Atlas logo or wordmark;
* primary navigation;
* search access;
* and mobile menu.

The header should remain visually simple.

It should not contain:

* account login for public users;
* shopping cart;
* ratings;
* reservation actions;
* or excessive navigation categories.

---

## 35. Global Footer

The footer should include:

```text
About
Editorial Principles
Corrections
Privacy
Contact
YouTube
Social Links
Copyright
```

Future additions may include:

```text
API
Data Policy
Contributor Guidelines
GitHub
```

Only public and useful links should be included.

---

## 36. Breadcrumbs

Breadcrumbs may be useful on structured pages.

Example:

```text
Home / Places / Japan / Osaka
```

Example:

```text
Home / Themes / Morning Work
```

Story pages may use simpler navigation to avoid visual clutter.

Breadcrumbs should be added when they improve orientation.

---

## 37. Language Strategy

The MVP may use one primary interface language.

The frontend should still support:

* original-language names;
* language metadata;
* and future translation expansion.

The first version should not rely on machine translation at page load.

Translated content should be reviewed before publication.

Future URL strategies may include:

```text
/en/stories/[slug]
/zh/stories/[slug]
/ja/stories/[slug]
```

This should be implemented only when multilingual publishing becomes a confirmed requirement.

---

## 38. Mobile-First Requirements

Many visitors may arrive from:

* YouTube descriptions;
* Instagram;
* social sharing;
* mobile search;
* and messaging apps.

The public frontend must prioritize mobile usability.

---

### Mobile Requirements

The website should provide:

* readable body text;
* comfortable line spacing;
* buttons large enough to tap;
* images sized correctly;
* responsive video embeds;
* a usable mobile map;
* simple navigation;
* and fast loading.

---

### Mobile Story Layout

On smaller screens:

* metadata should wrap clearly;
* related entity labels should not overflow;
* long titles should remain readable;
* the map may open in a separate section;
* Story cards should use one column;
* and videos should not exceed the screen width.

---

## 39. Accessibility

The frontend should support basic accessibility from the beginning.

Required principles:

* semantic heading order;
* meaningful link text;
* keyboard-accessible navigation;
* sufficient text contrast;
* alt text for informative images;
* captions or transcript access for video where possible;
* visible focus states;
* and form labels.

Images used only for decoration may use empty alt text.

Alt text should describe relevant content, not repeat nearby captions unnecessarily.

---

## 40. Performance

The public website should remain fast and stable.

Priority areas:

* optimized images;
* responsive image sizes;
* limited third-party scripts;
* no autoplay video;
* server-rendered Story pages;
* cached public content where appropriate;
* and minimal client-side JavaScript.

Complex animations should not delay reading or navigation.

---

## 41. SEO Responsibilities

Every important public page should have:

* a clear page title;
* meta description;
* canonical URL;
* social sharing metadata;
* and indexable server-rendered content.

The website should generate:

```text
sitemap.xml
robots.txt
```

Story pages should use:

* stable slugs;
* descriptive titles;
* accurate summaries;
* and structured heading hierarchy.

SEO must not change the editorial position of the project.

---

## 42. Social Sharing

Story pages should display useful social previews.

Recommended preview content:

```text
Story Title
Primary Image
Short Summary
FoodForFun Atlas Name
```

The preview should not use exaggerated clickbait.

Future social sharing buttons may be added, but they are not required for the core MVP.

---

## 43. Public Data Rules

The frontend should only display content intended for public access.

It must not expose:

* draft Stories;
* raw transcripts;
* internal editorial notes;
* hidden coordinates;
* AI suggestions;
* rights review notes;
* user IDs;
* admin history;
* or unpublished entities.

Public pages should use approved queries, views, or APIs.

---

## 44. Loading States

Public pages should provide understandable loading behavior.

Examples:

```text
Loading Stories…
Loading Map…
Searching…
```

The interface should avoid blank screens.

Where possible, server-rendered content should reduce visible loading states.

---

## 45. Empty States

The website should handle pages with limited content.

Example Place page:

```text
No published Stories are currently connected to this Place.
```

Example Theme page:

```text
This Theme has been created, but no published Stories are available yet.
```

Empty pages should not appear broken.

Where useful, they may suggest:

* recent Stories;
* nearby Places;
* or other Themes.

---

## 46. Error Pages

The frontend should include:

```text
404 — Page Not Found
500 — Temporary Error
Unavailable Story
Unavailable Source
```

Error pages should:

* explain the issue simply;
* provide navigation back to Stories or Home;
* and avoid exposing technical details.

---

## 47. Unpublished Story Behavior

Unpublished Stories must not be accessible publicly.

When a public visitor requests an unpublished Story slug, the system should normally return:

```text
404
```

It should not reveal:

* the Story title;
* the Story status;
* or whether a private draft exists.

Authorized preview links should use a separate protected mechanism.

---

## 48. Archived Story Behavior

An archived Story may be:

* removed entirely from public access;
* or retained at its direct URL with an archival notice.

The initial MVP should choose one consistent policy.

Recommended MVP behavior:

```text
Archived Stories are removed from public browsing and return 404.
```

A future version may support public archival notices when editorially appropriate.

---

## 49. Source Unavailability on Public Pages

If an original Source becomes unavailable, the Story page may display:

```text
The original Source is currently unavailable.
This Atlas Story remains available as an edited record.
```

The page should not remove the Story automatically.

The Source link should not be displayed as active when it no longer works.

---

## 50. Frontend Visual Direction

The visual system should use:

* generous spacing;
* clear typography;
* restrained color;
* documentary photography;
* simple grid layouts;
* and minimal interface decoration.

The site should feel closer to:

* an editorial publication;
* a cultural archive;
* or a documentary project;

than to:

* a food delivery platform;
* a restaurant directory;
* or a travel booking website.

---

## 51. Photography Direction

Preferred images include:

* people working;
* shop interiors;
* preparation processes;
* streets and neighborhoods;
* ordinary tools;
* environmental context;
* and food within daily life.

Food close-ups may be used, but they should not dominate every page.

Images should support the Story rather than function only as decoration.

---

## 52. Homepage Wireframe

```text
┌────────────────────────────────────┐
│ FoodForFun Atlas        Search  ☰ │
├────────────────────────────────────┤
│                                    │
│ Through food, understand people.   │
│ Through people, understand the     │
│ world.                             │
│                                    │
│ [Explore Stories] [Open the Map]   │
│                                    │
├────────────────────────────────────┤
│ Featured Story                     │
│                                    │
│ [Image]                            │
│ Story Title                        │
│ Place · Primary Theme              │
│ Short Summary                      │
│ [Read Story]                       │
├────────────────────────────────────┤
│ Explore by Place                   │
│                                    │
│ [Map Preview or Place Cards]       │
├────────────────────────────────────┤
│ Explore by Theme                   │
│                                    │
│ [Theme] [Theme] [Theme]            │
├────────────────────────────────────┤
│ Latest Stories                     │
│                                    │
│ [Card] [Card] [Card]               │
├────────────────────────────────────┤
│ What Is FoodForFun Atlas?          │
│                                    │
│ Short Project Explanation          │
│ [Learn More]                       │
└────────────────────────────────────┘
```

---

## 53. Story Page Wireframe

```text
┌────────────────────────────────────┐
│ FoodForFun Atlas        Search  ☰ │
├────────────────────────────────────┤
│ Primary Place                      │
│                                    │
│ Story Title                        │
│                                    │
│ Subtitle                           │
│ Summary                            │
│ Publication Date · Reading Time    │
│                                    │
│ [Cover Image]                      │
├────────────────────────────────────┤
│ Story Body                         │
│                                    │
│ Paragraphs                         │
│ Images                             │
│ Embedded Video                     │
│ Additional Sections                │
├────────────────────────────────────┤
│ Atlas Insight                      │
│                                    │
│ Short Editorial Observation        │
├────────────────────────────────────┤
│ Places                             │
│ Themes                             │
│ Future People / Shops / Foods      │
├────────────────────────────────────┤
│ Sources                            │
│ Original Source and Editorial Note │
├────────────────────────────────────┤
│ Related Stories                    │
│                                    │
│ [Card] [Card] [Card]               │
└────────────────────────────────────┘
```

---

## 54. Map Page Wireframe

```text
┌────────────────────────────────────┐
│ FoodForFun Atlas        Search  ☰ │
├────────────────────────────────────┤
│ Explore the Atlas                  │
│                                    │
│ [Search Place]                     │
│ [Theme Filter]                     │
│                                    │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │             MAP                │ │
│ │                                │ │
│ │      ●       ●        ●        │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│ Selected Result                    │
│ [Story Card]                       │
└────────────────────────────────────┘
```

---

## 55. Search Page Wireframe

```text
┌────────────────────────────────────┐
│ FoodForFun Atlas        Search  ☰ │
├────────────────────────────────────┤
│ Search the Atlas                   │
│                                    │
│ [ Osaka________________________ ]  │
│                                    │
│ Stories                            │
│ [Result]                           │
│ [Result]                           │
│                                    │
│ Places                             │
│ [Result]                           │
│                                    │
│ Themes                             │
│ [Result]                           │
└────────────────────────────────────┘
```

---

## 56. MVP Frontend Priorities

### P0 — Required

```text
Homepage
Story Archive
Story Detail Page
Place Detail Page
Search
Map
About
404 Page
Responsive Navigation
```

---

### P1 — Add After Core Stability

```text
Place Archive
Theme Archive
Theme Detail Page
Improved Related Stories
Story Preview
Social Sharing
Advanced Filters
```

---

### P2 — Future

```text
People Pages
Organization Pages
Food Pages
Multilingual Interface
Semantic Search
Personalized Recommendations
Public Collections
Advanced Map Exploration
```

---

## 57. Frontend Non-Goals for the MVP

The first frontend will not include:

* public user accounts;
* comments;
* ratings;
* bookmarks;
* follows;
* personalized feeds;
* restaurant rankings;
* reservations;
* delivery links;
* travel itineraries;
* public submissions;
* AI chat;
* complex animation;
* or native mobile applications.

---

## 58. Frontend Completion Criteria

The initial frontend is complete when:

### Navigation

* visitors can reach Stories, Map, Search, and About;
* navigation works on mobile and desktop;
* and broken links are not present.

### Stories

* published Stories have stable URLs;
* unpublished Stories remain private;
* Story pages are readable on mobile;
* Source information is visible;
* Place and Theme relationships are displayed;
* and related Stories are available.

### Places and Map

* Place pages display related Stories;
* map markers respect location precision;
* hidden locations are not shown;
* and map cards link to public pages.

### Search

* visitors can search published Stories;
* visitors can find Places and Themes;
* draft content is excluded;
* and empty results provide useful guidance.

### About and Trust

* the project purpose is clear;
* editorial principles are explained;
* correction information is available;
* and Source transparency is visible.

### Technical

* pages load reliably;
* mobile layouts work;
* images are optimized;
* important pages have SEO metadata;
* 404 and error pages exist;
* and private data is not exposed.

---

## 59. Frontend Decision Principle

When deciding whether to add a public interface element, ask:

> Does this help the visitor better understand the Story, the people behind it, the place where it happened, or the relationships connecting it to other Stories?

If the element mainly adds visual complexity or commercial behavior, it may not belong in FoodForFun Atlas.

---

## 60. Core Frontend Statement

The FoodForFun Atlas frontend is an exploration system built around Stories.

Its purpose is not only to display content, but to reveal the relationships between food, people, work, places, and communities.

Every page should remain readable, calm, trustworthy, and connected.

A visitor should be able to begin with one specific Story and leave with a broader understanding of the world around it.
