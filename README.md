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

Copy `.env.example` to `.env.local` for local development and configure the two
public Supabase variables. The site URL is optional locally and should be the
canonical HTTPS origin when Auth email flows are enabled in a deployed
environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Never commit `.env.local` or use a service-role or administrative credential for public Story access.

## Public Atlas

The server-rendered homepage presents a bounded selection of published Stories and entry points derived from their Place and Theme relationships. Global navigation connects the homepage with the paginated `/stories` archive, the published-content directories at `/places` and `/themes`, and the linkable public search at `/search?q=...`.

`/stories/[slug]` displays one publicly readable Story with its related Places, active Themes, and public Source metadata. Place and Theme detail pages connect visitors back to related published Stories. Search covers Story titles and summaries, Place names, and Theme names, with bounded groups for each public record type. These read-only queries select only the fields needed by each page and rely on database Row Level Security and column grants to exclude drafts, future publications, inactive Themes, Source transcripts, and internal Source fields.

The public application still has no database writes. Phase A database
authorization and RPC privilege remediation are applied in Production. Phase B
adds invite-only Supabase email/password authentication and a minimal `/admin`
shell that requires an active database membership. Phase B.5 adds member-only TOTP enrollment,
challenge, and MFA status routes so Publisher sessions can reach `aal2` before
sensitive work. Phase C adds the reviewed Story Editor application layer on the
existing protected Phase A RPCs: member-only list/create/edit/preview,
optimistic concurrency, role-aware workflow transitions, and confirmed
Publisher AAL2 publication and recovery actions. It does not add user
management, direct table writes, image uploads, or the Source/Place/Theme
editors. Phase D adds member-only Source list/create/edit routes with separate
public-safe metadata and private transcript/rights forms, duplicate warnings,
independent lock versions, and Publisher AAL2 confirmation for Sources connected
to published or scheduled Stories. Phase E adds protected Story connections to
existing Sources, Places, and Themes with per-relationship concurrency and
Publisher AAL2 confirmation for published changes. Phase F adds a protected
Theme list/create/edit workspace,
role-aware read-only access, duplicate warnings, optimistic concurrency, and
Publisher AAL2 confirmation before inactive Themes return to public discovery.
Phase G adds a protected Place list/create/edit workspace with hierarchy checks,
duplicate warnings, optimistic concurrency, and explicit public location
precision controls.

## Project Documentation

- [Contribution Guide](CONTRIBUTING.md)
- [Vision](docs/01_Vision.md)
- [MVP Scope](docs/02_MVP_Scope.md)
- [Data Model](docs/03_Data_Model.md)
- [Admin Workflow](docs/04_Admin_Workflow.md)
- [Approved Admin and Authentication Architecture](docs/09_Admin_Authentication_Architecture.md)
- [Phase A Authorization and Data Safety](docs/10_Phase_A_Authorization_Data_Safety.md)
- [Phase B Authentication and Admin Shell](docs/11_Phase_B_Authentication_Admin_Shell.md)
- [Phase B.5 Publisher MFA](docs/12_Phase_B5_Publisher_MFA.md)
- [Phase C Story Editor MVP](docs/13_Phase_C_Story_Editor.md)
- [Phase D Source Editor MVP](docs/14_Phase_D_Source_Editor.md)
- [Phase E Story Relationships MVP](docs/15_Phase_E_Story_Relationships.md)
- [Phase F Theme Editor MVP](docs/16_Phase_F_Theme_Editor.md)
- [Phase G Place Editor MVP](docs/17_Phase_G_Place_Editor.md)
- [Frontend Structure](docs/05_Frontend_Structure.md)
- [MVP Roadmap](docs/06_MVP_Roadmap.md)
- [Deployment](docs/07_Deployment.md)
- [Environment Testing](docs/08_Environment_Testing.md)

Version: 0.1
