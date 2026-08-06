create table public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  summary text not null,
  body text not null,
  status text not null default 'draft',
  cover_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stories_slug_key unique (slug),
  constraint stories_status_check check (status in ('draft', 'published')),
  constraint stories_published_at_check check (
    status <> 'published' or published_at is not null
  )
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  place_type text,
  parent_place_id uuid,
  country_code text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  location_precision text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_slug_key unique (slug),
  constraint places_parent_place_id_fkey foreign key (parent_place_id)
    references public.places (id) on delete set null,
  constraint places_country_code_check check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  constraint places_latitude_check check (
    latitude is null or latitude between -90 and 90
  ),
  constraint places_longitude_check check (
    longitude is null or longitude between -180 and 180
  ),
  constraint places_location_precision_check check (
    location_precision is null
    or location_precision in ('exact', 'neighborhood', 'city', 'region', 'hidden')
  ),
  constraint places_coordinates_precision_check check (
    (latitude is null) = (longitude is null)
    and (
      latitude is null
      or location_precision in ('exact', 'neighborhood', 'city', 'region')
    )
  )
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  theme_group text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint themes_slug_key unique (slug)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  original_title text,
  source_url text,
  external_id text,
  publisher text,
  original_published_at timestamptz,
  original_language text,
  original_description text,
  raw_transcript text,
  cleaned_transcript text,
  transcript_quality text,
  processing_status text not null default 'pending',
  availability_status text,
  rights_note text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_places (
  story_id uuid not null,
  place_id uuid not null,
  created_at timestamptz not null default now(),
  constraint story_places_pkey primary key (story_id, place_id),
  constraint story_places_story_id_fkey foreign key (story_id)
    references public.stories (id) on delete cascade,
  constraint story_places_place_id_fkey foreign key (place_id)
    references public.places (id) on delete cascade
);

create table public.story_themes (
  story_id uuid not null,
  theme_id uuid not null,
  created_at timestamptz not null default now(),
  constraint story_themes_pkey primary key (story_id, theme_id),
  constraint story_themes_story_id_fkey foreign key (story_id)
    references public.stories (id) on delete cascade,
  constraint story_themes_theme_id_fkey foreign key (theme_id)
    references public.themes (id) on delete cascade
);

create table public.story_sources (
  story_id uuid not null,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  constraint story_sources_pkey primary key (story_id, source_id),
  constraint story_sources_story_id_fkey foreign key (story_id)
    references public.stories (id) on delete cascade,
  constraint story_sources_source_id_fkey foreign key (source_id)
    references public.sources (id) on delete cascade
);

create index stories_status_idx on public.stories (status);
create index stories_published_at_idx on public.stories (published_at desc);
create index stories_published_lookup_idx
  on public.stories (published_at desc)
  where status = 'published';
create index places_parent_place_id_idx on public.places (parent_place_id);
create index story_places_place_id_idx on public.story_places (place_id);
create index story_themes_theme_id_idx on public.story_themes (theme_id);
create index story_sources_source_id_idx on public.story_sources (source_id);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger stories_set_updated_at
before update on public.stories
for each row execute function public.set_updated_at();

create trigger places_set_updated_at
before update on public.places
for each row execute function public.set_updated_at();

create trigger themes_set_updated_at
before update on public.themes
for each row execute function public.set_updated_at();

create trigger sources_set_updated_at
before update on public.sources
for each row execute function public.set_updated_at();

alter table public.stories enable row level security;
alter table public.places enable row level security;
alter table public.themes enable row level security;
alter table public.sources enable row level security;
alter table public.story_places enable row level security;
alter table public.story_themes enable row level security;
alter table public.story_sources enable row level security;

create policy stories_public_read_published
on public.stories
for select
to anon, authenticated
using (
  status = 'published'
  and published_at <= pg_catalog.now()
);

create policy places_public_read
on public.places
for select
to anon, authenticated
using (true);

create policy themes_public_read
on public.themes
for select
to anon, authenticated
using (is_active = true);

create policy sources_public_read
on public.sources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.story_sources as ss
    join public.stories as s on s.id = ss.story_id
    where ss.source_id = sources.id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
  )
);

create policy story_places_public_read_published
on public.story_places
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.stories as s
    where s.id = story_places.story_id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
  )
);

create policy story_themes_public_read_published
on public.story_themes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.stories as s
    where s.id = story_themes.story_id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
  )
);

create policy story_sources_public_read_published
on public.story_sources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.stories as s
    where s.id = story_sources.story_id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
  )
);

revoke all on table public.stories from anon, authenticated;
revoke all on table public.places from anon, authenticated;
revoke all on table public.themes from anon, authenticated;
revoke all on table public.sources from anon, authenticated;
revoke all on table public.story_places from anon, authenticated;
revoke all on table public.story_themes from anon, authenticated;
revoke all on table public.story_sources from anon, authenticated;

grant select on table public.stories to anon, authenticated;
grant select on table public.places to anon, authenticated;
grant select on table public.themes to anon, authenticated;
grant select (
  id,
  source_type,
  original_title,
  source_url,
  external_id,
  publisher,
  original_published_at,
  original_language,
  original_description,
  availability_status
) on table public.sources to anon, authenticated;
grant select on table public.story_places to anon, authenticated;
grant select on table public.story_themes to anon, authenticated;
grant select on table public.story_sources to anon, authenticated;

revoke all on function public.set_updated_at() from public;
