# FoodForFun Atlas - Phase K Related Stories

**Status:** Implemented

**Last Updated:** August 2026

## Scope

Phase K completes the Related Stories requirement on public Story Detail pages.
It uses shared Place and Theme relationships already stored in the Atlas and
shows at most three existing Story cards after the current Story.

## Public data boundary

The server reads `story_places`, `story_themes`, and `stories` through the
anonymous public client. Existing column grants and Row Level Security restrict
results to relationships belonging to published, due, non-deleted Stories.
Each relationship query is capped at 50 rows, and the final candidate query is
capped at 100 rows. The current Story is excluded in both the relationship
query and the pure ranking layer.

If any related-content read fails, the page keeps the complete current Story
and omits the Related Stories section. No database or configuration detail is
shown to the visitor.

## Ranking and explanation

Candidates rank first by their total shared Place and Theme count, then by
shared Theme count, shared Place count, publication date, and title. Names are
sorted and deduplicated so the result is deterministic. Every displayed card
explains its shared relationship, for example `Related through Fast Food and
Norway`, instead of presenting an unexplained recommendation.

## Boundaries

This phase adds no database write, migration, seed, AI recommendation,
personalization, behavior tracking, user profile, or map integration.
