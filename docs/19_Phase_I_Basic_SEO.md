# FoodForFun Atlas - Phase I Basic SEO

**Status:** Implemented

**Last Updated:** August 2026

## Scope

Phase I adds Next.js metadata routes at `/sitemap.xml` and `/robots.txt` and
marks public Search results as `noindex, follow`. Both metadata routes use the
existing validated canonical site URL helper.

## Sitemap boundary

The sitemap always contains the homepage, Story archive, Place directory,
Theme directory, and About page. It adds at most 1,000 RLS-filtered published
Stories and the existing public directory results for Places and Themes. Those
directory helpers include only records connected to a published Story.

Dynamic entries are sorted, URL-encoded, and deduplicated. If public data is
unavailable, sitemap generation fails safely to the five static entries instead
of exposing an internal error or making the metadata route unavailable.

## Crawl boundary

Robots may crawl the public site, but `/admin`, `/auth`, and `/search` are
disallowed. Search also emits an explicit `noindex` directive while retaining
`follow` so useful public links can still be discovered. The robots response
references the canonical sitemap and host.

## Boundaries

This phase adds no database write, migration, seed, analytics, tracking, or
third-party SEO service. Per-page canonical URLs and richer social-sharing
metadata remain separate focused tasks.
