# FoodForFun Atlas - Phase J Canonical and Social Metadata

**Status:** Implemented

**Last Updated:** August 2026

## Scope

Phase J adds a validated `metadataBase` and shared canonical, Open Graph, and
Twitter metadata to the homepage, About, Search, public archives, and public
detail routes. Metadata titles and descriptions use existing visible page
language rather than separate promotional copy.

## Canonical URLs

Each public route declares its own canonical path. Story archive page one uses
`/stories`; later pages use their normalized `?page=` URL and a page-aware
title. Arbitrary Search queries remain `noindex, follow` and canonicalize to
`/search`. Missing detail records fall back to their public directory rather
than claiming a canonical URL for a record that does not exist.

## Social sharing boundary

Public pages use factual `website` Open Graph metadata. Published Story details
use `article`, their real publication timestamp, title, summary, and slug. A
Story cover is included only when its stored value is a bounded HTTP(S) URL;
otherwise both Open Graph and Twitter fall back to a text-only summary card.
No default image, author, or publication fact is invented.

## Boundaries

This phase adds no database write, migration, seed, generated image, structured
data, analytics, tracking, or third-party SEO service. Metadata URL resolution
continues to use the existing HTTPS-enforcing site URL helper.
