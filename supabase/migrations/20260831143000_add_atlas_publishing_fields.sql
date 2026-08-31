create function private.valid_story_tags(candidate_tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(candidate_tags) <= 30
    and coalesce(bool_and(btrim(tag) <> '' and length(tag) <= 80), true)
  from unnest(candidate_tags) as tag;
$$;

alter table public.stories
  add column title_zh text,
  add column summary_zh text,
  add column body_zh text,
  add column seo_title_zh text,
  add column seo_description_zh text,
  add column tags text[] not null default '{}',
  add constraint stories_tags_values_check check (private.valid_story_tags(tags));

alter table public.places
  add column street_address text,
  add column postal_code text;

grant select (
  title_zh,
  summary_zh,
  body_zh,
  seo_title_zh,
  seo_description_zh,
  tags
) on table public.stories to anon, authenticated;

create or replace view public.editorial_stories
with (security_barrier = true)
as
select
  s.id,
  s.title,
  s.subtitle,
  s.slug,
  s.summary,
  s.body,
  s.atlas_insight,
  s.original_language,
  s.seo_title,
  s.seo_description,
  s.status,
  s.cover_image_url,
  s.published_at,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by,
  s.published_by,
  s.archived_at,
  s.archived_by,
  s.deleted_at,
  s.deleted_by,
  s.lock_version,
  s.title_zh,
  s.summary_zh,
  s.body_zh,
  s.seo_title_zh,
  s.seo_description_zh,
  s.tags
from public.stories as s
where private.has_editorial_role('contributor')
  and (s.deleted_at is null or private.has_editorial_role('publisher'));

create or replace view public.editorial_places
with (security_barrier = true)
as
select
  p.id,
  p.name,
  p.slug,
  p.place_type,
  p.parent_place_id,
  p.country_code,
  p.latitude,
  p.longitude,
  p.location_precision,
  p.is_verified,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.updated_by,
  p.deleted_at,
  p.deleted_by,
  p.lock_version,
  p.street_address,
  p.postal_code
from public.places as p
where private.has_editorial_role('contributor')
  and (p.deleted_at is null or private.has_editorial_role('publisher'));

create function public.create_atlas_story(payload jsonb)
returns table (entity_type text, entity_id uuid, lock_version integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_editorial_role('contributor') then
    raise exception 'Contributor role required' using errcode = '42501';
  end if;

  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object' then
    raise exception 'Story payload must be a JSON object' using errcode = '22023';
  end if;

  if exists (
    select 1 from pg_catalog.jsonb_object_keys(payload) as key_name
    where key_name not in (
      'title', 'subtitle', 'slug', 'summary', 'body', 'atlas_insight',
      'original_language', 'seo_title', 'seo_description', 'cover_image_url',
      'title_zh', 'summary_zh', 'body_zh', 'seo_title_zh',
      'seo_description_zh', 'tags'
    )
  ) then
    raise exception 'Story payload contains protected or unsupported fields'
      using errcode = '22023';
  end if;

  return query
  insert into public.stories (
    title, subtitle, slug, summary, body, atlas_insight, original_language,
    seo_title, seo_description, cover_image_url, title_zh, summary_zh, body_zh,
    seo_title_zh, seo_description_zh, tags
  ) values (
    payload ->> 'title', payload ->> 'subtitle', payload ->> 'slug',
    payload ->> 'summary', payload ->> 'body', payload ->> 'atlas_insight',
    payload ->> 'original_language', payload ->> 'seo_title',
    payload ->> 'seo_description', payload ->> 'cover_image_url',
    payload ->> 'title_zh', payload ->> 'summary_zh', payload ->> 'body_zh',
    payload ->> 'seo_title_zh', payload ->> 'seo_description_zh',
    coalesce(array(select jsonb_array_elements_text(payload -> 'tags')), '{}')
  )
  returning 'stories'::text, stories.id, stories.lock_version;
end;
$$;

create function public.update_atlas_story(
  target_story_id uuid,
  expected_lock_version integer,
  changes jsonb,
  confirmed boolean default false
)
returns table (entity_type text, entity_id uuid, lock_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_story public.stories%rowtype;
begin
  select s.* into current_story
  from public.stories as s
  where s.id = target_story_id
  for update;

  if not found then
    raise exception 'Story not found' using errcode = 'P0002';
  end if;
  if not private.can_update_story(target_story_id) then
    raise exception 'Story update is not permitted' using errcode = '42501';
  end if;
  if current_story.status = 'published'
    and (not private.publisher_has_aal2() or confirmed is not true) then
    raise exception 'Confirmed Publisher aal2 session required for published Story edits'
      using errcode = '42501';
  end if;
  if current_story.lock_version <> expected_lock_version then
    raise exception 'Story was changed by another editor' using errcode = '40001';
  end if;
  if changes is null or pg_catalog.jsonb_typeof(changes) <> 'object' then
    raise exception 'Changes must be a JSON object' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_object_keys(changes) as key_name
    where key_name not in (
      'title', 'subtitle', 'slug', 'summary', 'body', 'atlas_insight',
      'original_language', 'seo_title', 'seo_description', 'cover_image_url',
      'title_zh', 'summary_zh', 'body_zh', 'seo_title_zh',
      'seo_description_zh', 'tags'
    )
  ) then
    raise exception 'Story changes contain protected or unsupported fields'
      using errcode = '22023';
  end if;

  return query
  update public.stories as s set
    title = case when changes ? 'title' then changes ->> 'title' else s.title end,
    subtitle = case when changes ? 'subtitle' then changes ->> 'subtitle' else s.subtitle end,
    slug = case when changes ? 'slug' then changes ->> 'slug' else s.slug end,
    summary = case when changes ? 'summary' then changes ->> 'summary' else s.summary end,
    body = case when changes ? 'body' then changes ->> 'body' else s.body end,
    atlas_insight = case when changes ? 'atlas_insight' then changes ->> 'atlas_insight' else s.atlas_insight end,
    original_language = case when changes ? 'original_language' then changes ->> 'original_language' else s.original_language end,
    seo_title = case when changes ? 'seo_title' then changes ->> 'seo_title' else s.seo_title end,
    seo_description = case when changes ? 'seo_description' then changes ->> 'seo_description' else s.seo_description end,
    cover_image_url = case when changes ? 'cover_image_url' then changes ->> 'cover_image_url' else s.cover_image_url end,
    title_zh = case when changes ? 'title_zh' then changes ->> 'title_zh' else s.title_zh end,
    summary_zh = case when changes ? 'summary_zh' then changes ->> 'summary_zh' else s.summary_zh end,
    body_zh = case when changes ? 'body_zh' then changes ->> 'body_zh' else s.body_zh end,
    seo_title_zh = case when changes ? 'seo_title_zh' then changes ->> 'seo_title_zh' else s.seo_title_zh end,
    seo_description_zh = case when changes ? 'seo_description_zh' then changes ->> 'seo_description_zh' else s.seo_description_zh end,
    tags = case when changes ? 'tags'
      then coalesce(array(select jsonb_array_elements_text(changes -> 'tags')), '{}')
      else s.tags end
  where s.id = target_story_id
  returning 'stories'::text, s.id, s.lock_version;
end;
$$;

create function public.create_atlas_place(payload jsonb)
returns table (entity_type text, entity_id uuid, lock_version integer)
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.has_editorial_role('editor') then
    raise exception 'Editor role required' using errcode = '42501';
  end if;
  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object' then
    raise exception 'Place payload must be a JSON object' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_object_keys(payload) as key_name
    where key_name not in (
      'name', 'slug', 'place_type', 'parent_place_id', 'country_code',
      'latitude', 'longitude', 'location_precision', 'is_verified',
      'street_address', 'postal_code'
    )
  ) then
    raise exception 'Place payload contains protected or unsupported fields' using errcode = '22023';
  end if;
  return query
  insert into public.places (
    name, slug, place_type, parent_place_id, country_code, latitude, longitude,
    location_precision, is_verified, street_address, postal_code
  ) values (
    payload ->> 'name', payload ->> 'slug', payload ->> 'place_type',
    nullif(payload ->> 'parent_place_id', '')::uuid, payload ->> 'country_code',
    nullif(payload ->> 'latitude', '')::numeric, nullif(payload ->> 'longitude', '')::numeric,
    payload ->> 'location_precision', coalesce((payload ->> 'is_verified')::boolean, false),
    payload ->> 'street_address', payload ->> 'postal_code'
  ) returning 'places'::text, places.id, places.lock_version;
end;
$$;

create function public.update_atlas_place(
  target_place_id uuid,
  expected_lock_version integer,
  changes jsonb
)
returns table (entity_type text, entity_id uuid, lock_version integer)
language plpgsql security definer set search_path = ''
as $$
declare current_place public.places%rowtype;
begin
  select p.* into current_place from public.places p where p.id = target_place_id for update;
  if not found then raise exception 'Place not found' using errcode = 'P0002'; end if;
  if not private.has_editorial_role('editor') then raise exception 'Editor role required' using errcode = '42501'; end if;
  if current_place.deleted_at is not null then raise exception 'Deleted Place cannot be edited' using errcode = '55000'; end if;
  if current_place.lock_version <> expected_lock_version then raise exception 'Place changed' using errcode = '40001'; end if;
  if changes is null or pg_catalog.jsonb_typeof(changes) <> 'object' then
    raise exception 'Changes must be a JSON object' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_object_keys(changes) as key_name
    where key_name not in (
      'name', 'slug', 'place_type', 'parent_place_id', 'country_code',
      'latitude', 'longitude', 'location_precision', 'is_verified',
      'street_address', 'postal_code'
    )
  ) then raise exception 'Unsupported Place changes' using errcode = '22023'; end if;
  return query update public.places p set
    name = changes ->> 'name', slug = changes ->> 'slug',
    place_type = changes ->> 'place_type',
    parent_place_id = nullif(changes ->> 'parent_place_id', '')::uuid,
    country_code = changes ->> 'country_code',
    latitude = nullif(changes ->> 'latitude', '')::numeric,
    longitude = nullif(changes ->> 'longitude', '')::numeric,
    location_precision = changes ->> 'location_precision',
    is_verified = coalesce((changes ->> 'is_verified')::boolean, false),
    street_address = changes ->> 'street_address',
    postal_code = changes ->> 'postal_code'
  where p.id = target_place_id
  returning 'places'::text, p.id, p.lock_version;
end;
$$;

create function private.enforce_atlas_publish_requirements()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if nullif(btrim(new.title_zh), '') is null
      or nullif(btrim(new.summary_zh), '') is null
      or nullif(btrim(new.body_zh), '') is null then
      raise exception 'Chinese title, summary, and body are required before publishing'
        using errcode = '23514';
    end if;
    if cardinality(new.tags) = 0 then
      raise exception 'At least one tag is required before publishing'
        using errcode = '23514';
    end if;
    if not exists (select 1 from public.story_places sp where sp.story_id = new.id and sp.is_primary) then
      raise exception 'A primary Place is required before publishing'
        using errcode = '23514';
    end if;
    if not exists (select 1 from public.story_themes st where st.story_id = new.id) then
      raise exception 'At least one Theme is required before publishing'
        using errcode = '23514';
    end if;
    if not exists (select 1 from public.story_sources ss where ss.story_id = new.id) then
      raise exception 'At least one Source is required before publishing'
        using errcode = '23514';
    end if;
    if exists (
      select 1
      from public.story_sources ss
      join public.sources src on src.id = ss.source_id
      where ss.story_id = new.id
        and lower(src.source_type) in ('youtube', 'youtube_video')
        and (nullif(btrim(src.external_id), '') is null or nullif(btrim(src.source_url), '') is null)
    ) then
      raise exception 'YouTube Sources require both an original video ID and URL'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function public.import_approved_atlas_package(payload jsonb)
returns table (story_id uuid, status text, lock_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  story_payload jsonb;
  source_payload jsonb;
  place_payload jsonb;
  theme_payload jsonb;
  imported_story public.stories%rowtype;
  related_id uuid;
  parent_id uuid;
  item_order integer := 0;
begin
  if not private.has_editorial_role('editor') then
    raise exception 'Editor role required' using errcode = '42501';
  end if;
  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object'
    or coalesce((payload ->> 'editorial_approved')::boolean, false) is not true then
    raise exception 'An editorially approved Atlas package is required' using errcode = '22023';
  end if;
  story_payload := payload -> 'story';
  if pg_catalog.jsonb_typeof(story_payload) <> 'object'
    or nullif(btrim(story_payload ->> 'title'), '') is null
    or nullif(btrim(story_payload ->> 'summary'), '') is null
    or nullif(btrim(story_payload ->> 'body'), '') is null
    or nullif(btrim(story_payload ->> 'title_zh'), '') is null
    or nullif(btrim(story_payload ->> 'summary_zh'), '') is null
    or nullif(btrim(story_payload ->> 'body_zh'), '') is null
    or nullif(btrim(story_payload ->> 'slug'), '') is null
    or (story_payload ->> 'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or pg_catalog.jsonb_typeof(story_payload -> 'tags') <> 'array'
    or pg_catalog.jsonb_array_length(story_payload -> 'tags') = 0 then
    raise exception 'Complete bilingual Story fields, slug, and tags are required' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(payload -> 'sources') <> 'array'
    or pg_catalog.jsonb_typeof(payload -> 'places') <> 'array'
    or pg_catalog.jsonb_typeof(payload -> 'themes') <> 'array'
    or pg_catalog.jsonb_array_length(payload -> 'sources') = 0
    or pg_catalog.jsonb_array_length(payload -> 'places') = 0
    or pg_catalog.jsonb_array_length(payload -> 'themes') = 0 then
    raise exception 'Sources, Places, and Themes are required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from pg_catalog.jsonb_array_elements(payload -> 'sources') source
    where lower(source ->> 'source_type') in ('youtube', 'youtube_video')
      and nullif(btrim(source ->> 'external_id'), '') is not null
      and nullif(btrim(source ->> 'source_url'), '') is not null
      and (source ->> 'source_url') ~ '^https://(www\.)?(youtube\.com/watch\?|youtu\.be/)'
  ) then
    raise exception 'The original YouTube URL and video ID are required' using errcode = '22023';
  end if;
  if lower(payload -> 'sources' -> 0 ->> 'source_type') not in ('youtube', 'youtube_video') then
    raise exception 'The original YouTube Source must be first' using errcode = '22023';
  end if;
  if not exists (
    select 1 from pg_catalog.jsonb_array_elements(payload -> 'places') place
    where coalesce((place ->> 'is_primary')::boolean, false)
  ) then
    raise exception 'A primary Place is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from pg_catalog.jsonb_array_elements(payload -> 'themes') theme
    where theme ->> 'theme_group' in ('cuisine', 'food')
  ) or not exists (
    select 1 from pg_catalog.jsonb_array_elements(payload -> 'themes') theme
    where theme ->> 'theme_group' = 'content_topic'
  ) then
    raise exception 'Food/cuisine and content-topic Theme categories are required' using errcode = '22023';
  end if;

  insert into public.stories (
    title, title_zh, subtitle, slug, summary, summary_zh, body, body_zh,
    atlas_insight, original_language, seo_title, seo_title_zh,
    seo_description, seo_description_zh, cover_image_url, tags, status
  ) values (
    story_payload ->> 'title', story_payload ->> 'title_zh', story_payload ->> 'subtitle',
    story_payload ->> 'slug', story_payload ->> 'summary', story_payload ->> 'summary_zh',
    story_payload ->> 'body', story_payload ->> 'body_zh', story_payload ->> 'atlas_insight',
    story_payload ->> 'original_language', story_payload ->> 'seo_title',
    story_payload ->> 'seo_title_zh', story_payload ->> 'seo_description',
    story_payload ->> 'seo_description_zh', story_payload ->> 'cover_image_url',
    array(select btrim(tag) from pg_catalog.jsonb_array_elements_text(story_payload -> 'tags') as tag),
    'approved'
  ) returning * into imported_story;

  item_order := 0;
  for source_payload in select value from pg_catalog.jsonb_array_elements(payload -> 'sources') loop
    if nullif(btrim(source_payload ->> 'source_type'), '') is null
      or (source_payload ->> 'source_url') !~ '^https?://' then
      raise exception 'Every Source requires a supported type and HTTP(S) URL' using errcode = '22023';
    end if;
    related_id := null;
    if nullif(btrim(source_payload ->> 'external_id'), '') is not null then
      select s.id into related_id from public.sources s
      where lower(s.source_type) = lower(source_payload ->> 'source_type')
        and s.external_id = source_payload ->> 'external_id'
        and s.deleted_at is null limit 1;
    end if;
    if related_id is null and nullif(btrim(source_payload ->> 'source_url'), '') is not null then
      select s.id into related_id from public.sources s
      where s.source_url = source_payload ->> 'source_url' and s.deleted_at is null limit 1;
    end if;
    if related_id is null then
      insert into public.sources (
        source_type, source_url, external_id, original_title, publisher,
        original_published_at, original_language, availability_status
      ) values (
        source_payload ->> 'source_type', source_payload ->> 'source_url',
        nullif(source_payload ->> 'external_id', ''), nullif(source_payload ->> 'original_title', ''),
        nullif(source_payload ->> 'publisher', ''), nullif(source_payload ->> 'original_published_at', '')::timestamptz,
        nullif(source_payload ->> 'original_language', ''), coalesce(nullif(source_payload ->> 'availability_status', ''), 'available')
      ) returning id into related_id;
      insert into public.source_private_details (source_id) values (related_id);
    end if;
    insert into public.story_sources (story_id, source_id, is_primary, source_role, display_order)
    values (imported_story.id, related_id, item_order = 0, case when item_order = 0 then 'primary' else 'supporting' end, item_order);
    item_order := item_order + 1;
  end loop;

  item_order := 0;
  for place_payload in select value from pg_catalog.jsonb_array_elements(payload -> 'places') loop
    if nullif(btrim(place_payload ->> 'name'), '') is null
      or (place_payload ->> 'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'Every Place requires a name and safe slug' using errcode = '22023';
    end if;
    related_id := null;
    parent_id := null;
    select p.id into related_id from public.places p
    where p.slug = place_payload ->> 'slug' and p.deleted_at is null limit 1;
    if nullif(btrim(place_payload ->> 'parent_slug'), '') is not null then
      select p.id into parent_id from public.places p
      where p.slug = place_payload ->> 'parent_slug' and p.deleted_at is null limit 1;
    end if;
    if related_id is null then
      insert into public.places (
        name, slug, place_type, parent_place_id, country_code, street_address,
        postal_code, latitude, longitude, location_precision, is_verified
      ) values (
        place_payload ->> 'name', place_payload ->> 'slug', nullif(place_payload ->> 'place_type', ''),
        parent_id, nullif(place_payload ->> 'country_code', ''), nullif(place_payload ->> 'street_address', ''),
        nullif(place_payload ->> 'postal_code', ''), nullif(place_payload ->> 'latitude', '')::numeric,
        nullif(place_payload ->> 'longitude', '')::numeric,
        nullif(place_payload ->> 'location_precision', ''), coalesce((place_payload ->> 'is_verified')::boolean, false)
      ) returning id into related_id;
    end if;
    insert into public.story_places (story_id, place_id, is_primary, relationship_type, display_order)
    values (
      imported_story.id, related_id,
      coalesce((place_payload ->> 'is_primary')::boolean, false),
      case when coalesce((place_payload ->> 'is_primary')::boolean, false) then 'featured' else 'mentioned' end,
      item_order
    );
    item_order := item_order + 1;
  end loop;

  item_order := 0;
  for theme_payload in select value from pg_catalog.jsonb_array_elements(payload -> 'themes') loop
    if nullif(btrim(theme_payload ->> 'name'), '') is null
      or (theme_payload ->> 'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or (theme_payload ->> 'theme_group') not in ('cuisine', 'food', 'content_topic') then
      raise exception 'Every Theme requires a name, safe slug, and supported category group' using errcode = '22023';
    end if;
    related_id := null;
    select t.id into related_id from public.themes t
    where t.slug = theme_payload ->> 'slug' and t.deleted_at is null limit 1;
    if related_id is null then
      insert into public.themes (name, slug, description, theme_group)
      values (
        theme_payload ->> 'name', theme_payload ->> 'slug',
        nullif(theme_payload ->> 'description', ''), nullif(theme_payload ->> 'theme_group', '')
      ) returning id into related_id;
    end if;
    insert into public.story_themes (story_id, theme_id, relevance, display_order)
    values (imported_story.id, related_id, 'primary', item_order);
    item_order := item_order + 1;
  end loop;

  return query select imported_story.id, imported_story.status, imported_story.lock_version;
end;
$$;

create trigger stories_enforce_atlas_publish_requirements
before update of status on public.stories
for each row execute function private.enforce_atlas_publish_requirements();

revoke all on function public.create_atlas_story(jsonb) from public;
revoke all on function public.update_atlas_story(uuid, integer, jsonb, boolean) from public;
revoke all on function public.create_atlas_place(jsonb) from public;
revoke all on function public.update_atlas_place(uuid, integer, jsonb) from public;
revoke all on function private.enforce_atlas_publish_requirements() from public;
revoke all on function private.valid_story_tags(text[]) from public;
revoke all on function public.import_approved_atlas_package(jsonb) from public;
grant execute on function public.create_atlas_story(jsonb) to authenticated;
grant execute on function public.update_atlas_story(uuid, integer, jsonb, boolean) to authenticated;
grant execute on function public.create_atlas_place(jsonb) to authenticated;
grant execute on function public.update_atlas_place(uuid, integer, jsonb) to authenticated;
grant execute on function public.import_approved_atlas_package(jsonb) to authenticated;
