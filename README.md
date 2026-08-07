# FoodForFun Atlas

We are not building another food media platform.

We are building a new way to understand humanity through food.

> Through food, understand people. Through people, understand the world.

## Our Vision

FoodForFun Atlas is building a global food knowledge network powered by AI.

We believe food is one of the best ways to understand humanity.

Every dish tells the story of a place, its people, its history, and its culture.

Our mission is to preserve culinary knowledge, connect people across cultures, and help everyone discover that we have far more in common than we imagine.

---

## Our Principles

- 🌍 Food connects humanity.
- 📖 Every dish has a story.
- 🤝 Respect every culture.
- 🔍 Stay curious.
- ❤️ Share knowledge, not stereotypes.

---

## Project Status

🚧 This project is currently under active design and development.

## Local environment setup

Copy `.env.example` to `.env.local` for local development and configure both public Supabase variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Never commit `.env.local` or use a service-role or administrative credential for public Story access.

## Public Atlas

The server-rendered homepage presents a bounded selection of published Stories and entry points derived from their Place and Theme relationships. Global navigation connects the homepage with the paginated `/stories` archive, the published-content directories at `/places` and `/themes`, and the linkable public search at `/search?q=...`.

`/stories/[slug]` displays one publicly readable Story with its related Places, active Themes, and public Source metadata. Place and Theme detail pages connect visitors back to related published Stories. Search covers Story titles and summaries, Place names, and Theme names, with bounded groups for each public record type. These read-only queries select only the fields needed by each page and rely on database Row Level Security and column grants to exclude drafts, future publications, inactive Themes, Source transcripts, and internal Source fields.

Database writes, authentication, and administration are not implemented yet.

## Project Documentation

- [Contribution Guide](CONTRIBUTING.md)
- [Vision](docs/01_Vision.md)
- [MVP Scope](docs/02_MVP_Scope.md)
- [Data Model](docs/03_Data_Model.md)
- [Admin Workflow](docs/04_Admin_Workflow.md)
- [Admin and Authentication Architecture Proposal](docs/09_Admin_Authentication_Architecture.md)
- [Frontend Structure](docs/05_Frontend_Structure.md)
- [MVP Roadmap](docs/06_MVP_Roadmap.md)
- [Deployment](docs/07_Deployment.md)
- [Environment Testing](docs/08_Environment_Testing.md)

Version: 0.1
