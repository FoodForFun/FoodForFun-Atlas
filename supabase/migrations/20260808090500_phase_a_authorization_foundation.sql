-- Phase A: authorization and data-safety foundation.
-- This migration is additive and does not provision users or memberships.

create schema if not exists private;

revoke all on schema private from public;

create table private.editorial_audit_context (
  backend_pid integer primary key,
  operation text not null,
  constraint editorial_audit_context_operation_check check (
    operation in (
      'transition',
      'soft_delete',
      'restore',
      'revision_restore',
      'relationship_restore'
    )
  )
);

revoke all on table private.editorial_audit_context from public;

create table public.editorial_memberships (
  user_id uuid primary key references auth.users (id) on delete restrict,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default pg_catalog.now(),
  updated_by uuid references auth.users (id) on delete set null,
  lock_version integer not null default 1,
  constraint editorial_memberships_role_check check (
    role in ('contributor', 'editor', 'publisher')
  ),
  constraint editorial_memberships_lock_version_check check (lock_version > 0)
);

alter table public.stories
  drop constraint stories_status_check,
  add column subtitle text,
  add column atlas_insight text,
  add column original_language text,
  add column seo_title text,
  add column seo_description text,
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_by uuid references auth.users (id) on delete set null,
  add column published_by uuid references auth.users (id) on delete set null,
  add column archived_at timestamptz,
  add column archived_by uuid references auth.users (id) on delete set null,
  add column deleted_at timestamptz,
  add column deleted_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint stories_status_check check (
    status in ('draft', 'needs_review', 'approved', 'published', 'archived')
  ),
  add constraint stories_lock_version_check check (lock_version > 0),
  add constraint stories_archived_metadata_check check (
    (status = 'archived') = (archived_at is not null)
    and (archived_at is null) = (archived_by is null)
  ),
  add constraint stories_deleted_metadata_check check (
    (deleted_at is null) = (deleted_by is null)
  ),
  add constraint stories_published_by_check check (
    published_by is null or published_at is not null
  );

alter table public.places
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_by uuid references auth.users (id) on delete set null,
  add column deleted_at timestamptz,
  add column deleted_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint places_lock_version_check check (lock_version > 0),
  add constraint places_deleted_metadata_check check (
    (deleted_at is null) = (deleted_by is null)
  );

alter table public.themes
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_by uuid references auth.users (id) on delete set null,
  add column deleted_at timestamptz,
  add column deleted_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint themes_lock_version_check check (lock_version > 0),
  add constraint themes_deleted_metadata_check check (
    (deleted_at is null) = (deleted_by is null)
  );

alter table public.sources
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_by uuid references auth.users (id) on delete set null,
  add column deleted_at timestamptz,
  add column deleted_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint sources_lock_version_check check (lock_version > 0),
  add constraint sources_deleted_metadata_check check (
    (deleted_at is null) = (deleted_by is null)
  ),
  add constraint sources_availability_status_check check (
    availability_status is null
    or pg_catalog.lower(availability_status) in (
      'unknown',
      'available',
      'temporarily_unavailable',
      'unavailable',
      'removed',
      'archived'
    )
  ) not valid,
  add constraint sources_legacy_processing_status_check check (
    pg_catalog.lower(processing_status)
      in ('pending', 'processing', 'ready', 'failed', 'not_required')
  ) not valid,
  add constraint sources_legacy_transcript_quality_check check (
    transcript_quality is null
    or pg_catalog.lower(transcript_quality) in (
      'unreviewed',
      'machine_generated',
      'human_reviewed',
      'verified'
    )
  ) not valid;

create table public.source_private_details (
  source_id uuid primary key references public.sources (id) on delete restrict,
  raw_transcript text,
  cleaned_transcript text,
  transcript_quality text,
  processing_status text not null default 'pending',
  rights_status text not null default 'unreviewed',
  rights_note text,
  internal_note text,
  created_at timestamptz not null default pg_catalog.now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default pg_catalog.now(),
  updated_by uuid references auth.users (id) on delete set null,
  lock_version integer not null default 1,
  constraint source_private_details_lock_version_check check (lock_version > 0)
);

insert into public.source_private_details (
  source_id,
  raw_transcript,
  cleaned_transcript,
  transcript_quality,
  processing_status,
  rights_status,
  rights_note
)
select
  s.id,
  s.raw_transcript,
  s.cleaned_transcript,
  s.transcript_quality,
  s.processing_status,
  'unreviewed',
  s.rights_note
from public.sources as s
on conflict (source_id) do nothing;

alter table public.source_private_details
  add constraint source_private_details_transcript_quality_check check (
    transcript_quality is null
    or pg_catalog.lower(transcript_quality) in (
      'unreviewed',
      'machine_generated',
      'human_reviewed',
      'verified'
    )
  ) not valid,
  add constraint source_private_details_processing_status_check check (
    pg_catalog.lower(processing_status)
      in ('pending', 'processing', 'ready', 'failed', 'not_required')
  ) not valid,
  add constraint source_private_details_rights_status_check check (
    pg_catalog.lower(rights_status) in (
      'unreviewed',
      'permission_required',
      'permission_granted',
      'licensed',
      'public_domain',
      'fair_use',
      'cleared',
      'restricted'
    )
  ) not valid;

alter table public.story_places
  add column is_primary boolean not null default false,
  add column relationship_type text not null default 'featured',
  add column display_order integer not null default 0,
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_at timestamptz not null default pg_catalog.now(),
  add column updated_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint story_places_relationship_type_check check (
    relationship_type in ('featured', 'origin', 'setting', 'mentioned')
  ),
  add constraint story_places_display_order_check check (display_order >= 0),
  add constraint story_places_lock_version_check check (lock_version > 0);

alter table public.story_themes
  add column relevance text not null default 'related',
  add column display_order integer not null default 0,
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_at timestamptz not null default pg_catalog.now(),
  add column updated_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint story_themes_relevance_check check (
    relevance in ('primary', 'related', 'contextual')
  ),
  add constraint story_themes_display_order_check check (display_order >= 0),
  add constraint story_themes_lock_version_check check (lock_version > 0);

alter table public.story_sources
  add column is_primary boolean not null default false,
  add column source_role text not null default 'supporting',
  add column display_order integer not null default 0,
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_at timestamptz not null default pg_catalog.now(),
  add column updated_by uuid references auth.users (id) on delete set null,
  add column lock_version integer not null default 1,
  add constraint story_sources_source_role_check check (
    source_role in ('primary', 'supporting', 'context', 'fact_check')
  ),
  add constraint story_sources_primary_role_check check (
    is_primary = (source_role = 'primary')
  ),
  add constraint story_sources_display_order_check check (display_order >= 0),
  add constraint story_sources_lock_version_check check (lock_version > 0);

create table public.editorial_revisions (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id uuid not null,
  relationship_key jsonb,
  operation text not null,
  actor_id uuid references auth.users (id) on delete set null,
  occurred_at timestamptz not null default pg_catalog.now(),
  before_data jsonb,
  after_data jsonb,
  is_sensitive boolean not null default false,
  constraint editorial_revisions_entity_type_check check (
    entity_type in (
      'editorial_memberships',
      'stories',
      'places',
      'themes',
      'sources',
      'source_private_details',
      'story_places',
      'story_themes',
      'story_sources'
    )
  ),
  constraint editorial_revisions_operation_check check (
    operation in (
      'insert',
      'update',
      'transition',
      'soft_delete',
      'restore',
      'revision_restore',
      'relationship_insert',
      'relationship_update',
      'relationship_delete',
      'relationship_restore',
      'hard_delete'
    )
  ),
  constraint editorial_revisions_snapshot_check check (
    before_data is not null or after_data is not null
  )
);

create unique index story_places_one_primary_idx
  on public.story_places (story_id)
  where is_primary;
create unique index story_sources_one_primary_idx
  on public.story_sources (story_id)
  where is_primary;
create index editorial_memberships_active_role_idx
  on public.editorial_memberships (role, user_id)
  where is_active;
create index stories_admin_status_updated_idx
  on public.stories (status, updated_at desc)
  where deleted_at is null;
create index stories_created_by_idx
  on public.stories (created_by)
  where deleted_at is null;
create index stories_deleted_at_idx
  on public.stories (deleted_at)
  where deleted_at is not null;
create index places_deleted_at_idx
  on public.places (deleted_at)
  where deleted_at is not null;
create index themes_deleted_at_idx
  on public.themes (deleted_at)
  where deleted_at is not null;
create index sources_deleted_at_idx
  on public.sources (deleted_at)
  where deleted_at is not null;
create index sources_source_url_lookup_idx
  on public.sources (source_url)
  where deleted_at is null and source_url is not null;
create index sources_external_lookup_idx
  on public.sources (source_type, external_id)
  where deleted_at is null and external_id is not null;
create index sources_created_by_idx
  on public.sources (created_by)
  where deleted_at is null;
create index editorial_revisions_entity_lookup_idx
  on public.editorial_revisions (entity_type, entity_id, occurred_at desc);
create index editorial_revisions_actor_lookup_idx
  on public.editorial_revisions (actor_id, occurred_at desc)
  where actor_id is not null;

create function private.current_editorial_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select em.role
  from public.editorial_memberships as em
  where em.user_id = (select auth.uid())
    and em.is_active
$$;

create function private.has_editorial_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    case private.current_editorial_role()
      when 'publisher' then 3
      when 'editor' then 2
      when 'contributor' then 1
      else 0
    end
    >=
    case required_role
      when 'publisher' then 3
      when 'editor' then 2
      when 'contributor' then 1
      else 4
    end,
    false
  )
$$;

create function private.publisher_has_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_editorial_role('publisher')
    and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
$$;

create function private.can_update_story(target_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stories as s
    where s.id = target_story_id
      and s.deleted_at is null
      and case private.current_editorial_role()
        when 'publisher' then true
        when 'editor' then s.status in ('draft', 'needs_review', 'approved')
        when 'contributor' then
          s.created_by = (select auth.uid())
          and s.status in ('draft', 'needs_review')
        else false
      end
  )
$$;

create function private.can_manage_story_relationship(target_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stories as s
    where s.id = target_story_id
      and s.deleted_at is null
      and case private.current_editorial_role()
        when 'publisher' then true
        when 'editor' then s.status in ('draft', 'needs_review', 'approved')
        when 'contributor' then
          s.created_by = (select auth.uid())
          and s.status in ('draft', 'needs_review')
        else false
      end
  )
$$;

create function private.source_is_public(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.story_sources as ss
    join public.stories as s on s.id = ss.story_id
    where ss.source_id = target_source_id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
      and s.deleted_at is null
  )
$$;

-- Sources attached to scheduled Stories require publication-level assurance
-- even though anonymous RLS does not expose them until published_at is due.
create function private.source_requires_publication_assurance(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.story_sources as ss
    join public.stories as s on s.id = ss.story_id
    where ss.source_id = target_source_id
      and s.status = 'published'
      and s.deleted_at is null
  )
$$;

create function private.story_is_public(target_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stories as s
    where s.id = target_story_id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
      and s.deleted_at is null
  )
$$;

create function private.place_is_public(target_place_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.places as p
    where p.id = target_place_id
      and p.deleted_at is null
  )
$$;

create function private.theme_is_public(target_theme_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.themes as t
    where t.id = target_theme_id
      and t.is_active
      and t.deleted_at is null
  )
$$;

create function private.can_update_source(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sources as s
    where s.id = target_source_id
      and s.deleted_at is null
      and case private.current_editorial_role()
        when 'publisher' then true
        when 'editor' then
          not private.source_requires_publication_assurance(s.id)
        when 'contributor' then
          s.created_by = (select auth.uid())
          and not private.source_requires_publication_assurance(s.id)
        else false
      end
  )
$$;

create function private.can_read_source_private(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_editorial_role('contributor')
    and exists (
      select 1
      from public.sources as s
      where s.id = target_source_id
        and (
          s.deleted_at is null
          or private.has_editorial_role('publisher')
        )
    )
$$;

create function private.set_editorial_audit_operation(requested_operation text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if requested_operation not in (
    'transition',
    'soft_delete',
    'restore',
    'revision_restore',
    'relationship_restore'
  ) then
    raise exception 'Unsupported editorial audit operation'
      using errcode = '22023';
  end if;

  insert into private.editorial_audit_context (backend_pid, operation)
  values (pg_catalog.pg_backend_pid(), requested_operation)
  on conflict (backend_pid) do update
  set operation = excluded.operation;
end;
$$;

revoke all on function private.current_editorial_role() from public;
revoke all on function private.has_editorial_role(text) from public;
revoke all on function private.publisher_has_aal2() from public;
revoke all on function private.can_update_story(uuid) from public;
revoke all on function private.can_manage_story_relationship(uuid) from public;
revoke all on function private.source_is_public(uuid) from public;
revoke all on function private.source_requires_publication_assurance(uuid) from public;
revoke all on function private.story_is_public(uuid) from public;
revoke all on function private.place_is_public(uuid) from public;
revoke all on function private.theme_is_public(uuid) from public;
revoke all on function private.can_update_source(uuid) from public;
revoke all on function private.can_read_source_private(uuid) from public;
revoke all on function private.set_editorial_audit_operation(text) from public;

grant usage on schema private to anon, authenticated;
grant execute on function private.source_is_public(uuid) to anon, authenticated;
grant execute on function private.story_is_public(uuid) to anon, authenticated;
grant execute on function private.place_is_public(uuid) to anon, authenticated;
grant execute on function private.theme_is_public(uuid) to anon, authenticated;
grant execute on function private.current_editorial_role() to authenticated;
grant execute on function private.has_editorial_role(text) to authenticated;
grant execute on function private.publisher_has_aal2() to authenticated;
grant execute on function private.can_update_story(uuid) to authenticated;
grant execute on function private.can_manage_story_relationship(uuid) to authenticated;
grant execute on function private.can_update_source(uuid) to authenticated;
grant execute on function private.can_read_source_private(uuid) to authenticated;

create function private.set_entity_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    new.created_at := pg_catalog.now();
    new.updated_at := pg_catalog.now();
    new.lock_version := 1;
  else
    new.created_by := old.created_by;
    new.updated_by := auth.uid();
    new.created_at := old.created_at;
    new.updated_at := pg_catalog.now();
    new.lock_version := old.lock_version + 1;
  end if;

  return new;
end;
$$;

create function private.set_relationship_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := pg_catalog.now();
    new.lock_version := 1;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.lock_version := old.lock_version + 1;
  end if;

  new.updated_by := auth.uid();
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger stories_set_updated_at on public.stories;
drop trigger places_set_updated_at on public.places;
drop trigger themes_set_updated_at on public.themes;
drop trigger sources_set_updated_at on public.sources;

create trigger editorial_memberships_set_metadata
before insert or update on public.editorial_memberships
for each row execute function private.set_entity_metadata();

create trigger stories_set_metadata
before insert or update on public.stories
for each row execute function private.set_entity_metadata();

create trigger places_set_metadata
before insert or update on public.places
for each row execute function private.set_entity_metadata();

create trigger themes_set_metadata
before insert or update on public.themes
for each row execute function private.set_entity_metadata();

create trigger sources_set_metadata
before insert or update on public.sources
for each row execute function private.set_entity_metadata();

create trigger source_private_details_set_metadata
before insert or update on public.source_private_details
for each row execute function private.set_entity_metadata();

create trigger story_places_set_metadata
before insert or update on public.story_places
for each row execute function private.set_relationship_metadata();

create trigger story_themes_set_metadata
before insert or update on public.story_themes
for each row execute function private.set_relationship_metadata();

create trigger story_sources_set_metadata
before insert or update on public.story_sources
for each row execute function private.set_relationship_metadata();

revoke all on function private.set_entity_metadata() from public;
revoke all on function private.set_relationship_metadata() from public;

create function private.capture_editorial_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  revision_entity_id uuid;
  revision_relationship_key jsonb;
  revision_operation text;
  configured_operation text;
begin
  if tg_op = 'INSERT' then
    old_data := null;
    new_data := pg_catalog.to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    old_data := pg_catalog.to_jsonb(old);
    new_data := pg_catalog.to_jsonb(new);
  else
    old_data := pg_catalog.to_jsonb(old);
    new_data := null;
  end if;

  revision_entity_id := coalesce(
    nullif(coalesce(new_data, old_data) ->> 'id', '')::uuid,
    nullif(coalesce(new_data, old_data) ->> 'user_id', '')::uuid,
    nullif(coalesce(new_data, old_data) ->> 'story_id', '')::uuid,
    nullif(coalesce(new_data, old_data) ->> 'source_id', '')::uuid
  );

  if tg_table_name = 'story_places' then
    revision_relationship_key := pg_catalog.jsonb_build_object(
      'story_id', coalesce(new_data, old_data) ->> 'story_id',
      'place_id', coalesce(new_data, old_data) ->> 'place_id'
    );
  elsif tg_table_name = 'story_themes' then
    revision_relationship_key := pg_catalog.jsonb_build_object(
      'story_id', coalesce(new_data, old_data) ->> 'story_id',
      'theme_id', coalesce(new_data, old_data) ->> 'theme_id'
    );
  elsif tg_table_name = 'story_sources' then
    revision_relationship_key := pg_catalog.jsonb_build_object(
      'story_id', coalesce(new_data, old_data) ->> 'story_id',
      'source_id', coalesce(new_data, old_data) ->> 'source_id'
    );
  end if;

  select context.operation
  into configured_operation
  from private.editorial_audit_context as context
  where context.backend_pid = pg_catalog.pg_backend_pid()
  for update;

  if configured_operation is not null then
    delete from private.editorial_audit_context as context
    where context.backend_pid = pg_catalog.pg_backend_pid();
  end if;

  revision_operation := coalesce(
    configured_operation,
    case
      when tg_table_name in ('story_places', 'story_themes', 'story_sources')
        and tg_op = 'INSERT' then 'relationship_insert'
      when tg_table_name in ('story_places', 'story_themes', 'story_sources')
        and tg_op = 'UPDATE' then 'relationship_update'
      when tg_table_name in ('story_places', 'story_themes', 'story_sources')
        and tg_op = 'DELETE' then 'relationship_delete'
      when tg_op = 'INSERT' then 'insert'
      when tg_op = 'UPDATE' then 'update'
      else 'hard_delete'
    end
  );

  insert into public.editorial_revisions (
    entity_type,
    entity_id,
    relationship_key,
    operation,
    actor_id,
    before_data,
    after_data,
    is_sensitive
  )
  values (
    tg_table_name,
    revision_entity_id,
    revision_relationship_key,
    revision_operation,
    auth.uid(),
    old_data,
    new_data,
    tg_table_name in (
      'editorial_memberships',
      'sources',
      'source_private_details'
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger editorial_memberships_capture_revision
after insert or update or delete on public.editorial_memberships
for each row execute function private.capture_editorial_revision();

create trigger stories_capture_revision
after insert or update or delete on public.stories
for each row execute function private.capture_editorial_revision();

create trigger places_capture_revision
after insert or update or delete on public.places
for each row execute function private.capture_editorial_revision();

create trigger themes_capture_revision
after insert or update or delete on public.themes
for each row execute function private.capture_editorial_revision();

create trigger sources_capture_revision
after insert or update or delete on public.sources
for each row execute function private.capture_editorial_revision();

create trigger source_private_details_capture_revision
after insert or update or delete on public.source_private_details
for each row execute function private.capture_editorial_revision();

create trigger story_places_capture_revision
after insert or update or delete on public.story_places
for each row execute function private.capture_editorial_revision();

create trigger story_themes_capture_revision
after insert or update or delete on public.story_themes
for each row execute function private.capture_editorial_revision();

create trigger story_sources_capture_revision
after insert or update or delete on public.story_sources
for each row execute function private.capture_editorial_revision();

revoke all on function private.capture_editorial_revision() from public;

create function public.transition_story_status(
  target_story_id uuid,
  new_status text,
  expected_lock_version integer,
  requested_published_at timestamptz default null,
  confirmed boolean default false
)
returns table (
  story_id uuid,
  status text,
  published_at timestamptz,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_story public.stories%rowtype;
  editorial_role text;
  actor_id uuid;
  next_published_at timestamptz;
  next_published_by uuid;
  next_archived_at timestamptz;
  next_archived_by uuid;
begin
  actor_id := auth.uid();
  editorial_role := private.current_editorial_role();

  if actor_id is null or editorial_role is null then
    raise exception 'Editorial membership required' using errcode = '42501';
  end if;

  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if new_status not in ('draft', 'needs_review', 'approved', 'published', 'archived') then
    raise exception 'Unsupported Story status' using errcode = '22023';
  end if;

  select s.*
  into current_story
  from public.stories as s
  where s.id = target_story_id
  for update;

  if not found then
    raise exception 'Story not found' using errcode = 'P0002';
  end if;

  if current_story.deleted_at is not null then
    raise exception 'A soft-deleted Story must be restored before transition'
      using errcode = '55000';
  end if;

  if current_story.lock_version <> expected_lock_version then
    raise exception 'Story was changed by another editor'
      using errcode = '40001';
  end if;

  if current_story.status = new_status then
    raise exception 'Story is already in the requested status'
      using errcode = '22023';
  end if;

  if new_status <> 'published' and requested_published_at is not null then
    raise exception 'Publication time is accepted only when publishing'
      using errcode = '22023';
  end if;

  if current_story.status = 'draft' and new_status = 'needs_review' then
    if editorial_role = 'contributor' and current_story.created_by is distinct from actor_id then
      raise exception 'Contributors may submit only their own Stories'
        using errcode = '42501';
    end if;
  elsif current_story.status = 'needs_review' and new_status = 'draft' then
    if editorial_role = 'contributor' and current_story.created_by is distinct from actor_id then
      raise exception 'Contributors may withdraw only their own Stories'
        using errcode = '42501';
    end if;
  elsif current_story.status = 'needs_review' and new_status = 'approved' then
    if not private.has_editorial_role('editor') then
      raise exception 'Editor role required' using errcode = '42501';
    end if;
  elsif current_story.status = 'approved' and new_status = 'needs_review' then
    if not private.has_editorial_role('editor') then
      raise exception 'Editor role required' using errcode = '42501';
    end if;
  elsif current_story.status = 'approved' and new_status = 'published' then
    if not private.publisher_has_aal2() or confirmed is not true then
      raise exception 'Confirmed Publisher aal2 session required'
        using errcode = '42501';
    end if;
  elsif current_story.status = 'published' and new_status = 'approved' then
    if not private.publisher_has_aal2() or confirmed is not true then
      raise exception 'Confirmed Publisher aal2 session required'
        using errcode = '42501';
    end if;
  elsif new_status = 'archived' and current_story.status <> 'archived' then
    if not private.publisher_has_aal2() or confirmed is not true then
      raise exception 'Confirmed Publisher aal2 session required'
        using errcode = '42501';
    end if;
  elsif current_story.status = 'archived' and new_status = 'approved' then
    if not private.publisher_has_aal2() or confirmed is not true then
      raise exception 'Confirmed Publisher aal2 session required'
        using errcode = '42501';
    end if;
  else
    raise exception 'Invalid Story transition from % to %', current_story.status, new_status
      using errcode = '22023';
  end if;

  if new_status = 'published' then
    if requested_published_at is null then
      raise exception 'Publication time is required' using errcode = '22023';
    end if;

    if pg_catalog.btrim(current_story.title) = ''
      or pg_catalog.btrim(current_story.slug) = ''
      or pg_catalog.btrim(current_story.summary) = ''
      or pg_catalog.btrim(current_story.body) = '' then
      raise exception 'Story title, slug, summary, and body are required'
        using errcode = '23514';
    end if;

    if (
      select pg_catalog.count(*)
      from public.story_sources as ss
      join public.sources as source on source.id = ss.source_id
      where ss.story_id = target_story_id
        and ss.is_primary
        and source.deleted_at is null
    ) <> 1 then
      raise exception 'Exactly one non-deleted primary Source is required'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.story_sources as ss
      join public.sources as source on source.id = ss.source_id
      left join public.source_private_details as details
        on details.source_id = source.id
      where ss.story_id = target_story_id
        and (
          source.deleted_at is not null
          or pg_catalog.lower(source.availability_status)
            in ('unavailable', 'removed')
          or details.source_id is null
          or details.rights_status not in (
            'permission_granted',
            'licensed',
            'public_domain',
            'fair_use',
            'cleared'
          )
        )
    ) then
      raise exception 'Every Story Source requires availability and cleared rights review'
        using errcode = '23514';
    end if;

    if (
      select pg_catalog.count(*)
      from public.story_places as sp
      join public.places as place on place.id = sp.place_id
      where sp.story_id = target_story_id
        and sp.is_primary
        and place.deleted_at is null
    ) <> 1 then
      raise exception 'Exactly one non-deleted primary Place is required'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.story_places as sp
      join public.places as place on place.id = sp.place_id
      where sp.story_id = target_story_id
        and (
          place.deleted_at is not null
          or place.location_precision is null
          or (
            place.location_precision = 'exact'
            and not place.is_verified
          )
        )
    ) then
      raise exception 'Every Story Place requires reviewed safe location precision'
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.story_themes as st
      join public.themes as theme on theme.id = st.theme_id
      where st.story_id = target_story_id
        and theme.is_active
        and theme.deleted_at is null
    ) then
      raise exception 'At least one active non-deleted Theme is required'
        using errcode = '23514';
    end if;
  end if;

  next_published_at := current_story.published_at;
  next_published_by := current_story.published_by;
  next_archived_at := current_story.archived_at;
  next_archived_by := current_story.archived_by;

  if new_status = 'published' then
    next_published_at := requested_published_at;
    next_published_by := actor_id;
    next_archived_at := null;
    next_archived_by := null;
  elsif new_status = 'archived' then
    next_archived_at := pg_catalog.now();
    next_archived_by := actor_id;
  elsif current_story.status in ('published', 'archived') then
    next_published_at := null;
    next_published_by := null;
    next_archived_at := null;
    next_archived_by := null;
  end if;

  perform private.set_editorial_audit_operation('transition');

  return query
  update public.stories as s
  set
    status = new_status,
    published_at = next_published_at,
    published_by = next_published_by,
    archived_at = next_archived_at,
    archived_by = next_archived_by
  where s.id = target_story_id
  returning s.id, s.status, s.published_at, s.lock_version;
end;
$$;

create function public.soft_delete_entity(
  target_entity_type text,
  target_entity_id uuid,
  expected_lock_version integer,
  confirmed boolean default false
)
returns table (
  entity_type text,
  entity_id uuid,
  deleted_at timestamptz,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_lock_version integer;
  current_deleted_at timestamptz;
begin
  if not private.publisher_has_aal2() or confirmed is not true then
    raise exception 'Confirmed Publisher aal2 session required'
      using errcode = '42501';
  end if;

  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if target_entity_type = 'stories' then
    select s.lock_version, s.deleted_at
    into current_lock_version, current_deleted_at
    from public.stories as s
    where s.id = target_entity_id
    for update;
  elsif target_entity_type = 'sources' then
    select s.lock_version, s.deleted_at
    into current_lock_version, current_deleted_at
    from public.sources as s
    where s.id = target_entity_id
    for update;

    if exists (
      select 1
      from public.story_sources as ss
      where ss.source_id = target_entity_id
    ) then
      raise exception 'Remove Source relationships before soft deletion'
        using errcode = '23503';
    end if;
  elsif target_entity_type = 'places' then
    select p.lock_version, p.deleted_at
    into current_lock_version, current_deleted_at
    from public.places as p
    where p.id = target_entity_id
    for update;

    if exists (
      select 1
      from public.story_places as sp
      where sp.place_id = target_entity_id
    ) or exists (
      select 1
      from public.places as child
      where child.parent_place_id = target_entity_id
        and child.deleted_at is null
    ) then
      raise exception 'Remove Place relationships before soft deletion'
        using errcode = '23503';
    end if;
  elsif target_entity_type = 'themes' then
    select t.lock_version, t.deleted_at
    into current_lock_version, current_deleted_at
    from public.themes as t
    where t.id = target_entity_id
    for update;

    if exists (
      select 1
      from public.story_themes as st
      where st.theme_id = target_entity_id
    ) then
      raise exception 'Remove Theme relationships before soft deletion'
        using errcode = '23503';
    end if;
  else
    raise exception 'Unsupported soft-delete entity type'
      using errcode = '22023';
  end if;

  if current_lock_version is null then
    raise exception 'Entity not found' using errcode = 'P0002';
  end if;

  if current_deleted_at is not null then
    raise exception 'Entity is already soft-deleted' using errcode = '55000';
  end if;

  if current_lock_version <> expected_lock_version then
    raise exception 'Entity was changed by another editor'
      using errcode = '40001';
  end if;

  perform private.set_editorial_audit_operation('soft_delete');

  if target_entity_type = 'stories' then
    return query
    update public.stories as s
    set deleted_at = pg_catalog.now(), deleted_by = auth.uid()
    where s.id = target_entity_id
    returning 'stories'::text, s.id, s.deleted_at, s.lock_version;
  elsif target_entity_type = 'sources' then
    return query
    update public.sources as s
    set deleted_at = pg_catalog.now(), deleted_by = auth.uid()
    where s.id = target_entity_id
    returning 'sources'::text, s.id, s.deleted_at, s.lock_version;
  elsif target_entity_type = 'places' then
    return query
    update public.places as p
    set deleted_at = pg_catalog.now(), deleted_by = auth.uid()
    where p.id = target_entity_id
    returning 'places'::text, p.id, p.deleted_at, p.lock_version;
  else
    return query
    update public.themes as t
    set deleted_at = pg_catalog.now(), deleted_by = auth.uid()
    where t.id = target_entity_id
    returning 'themes'::text, t.id, t.deleted_at, t.lock_version;
  end if;
end;
$$;

create function public.restore_soft_deleted_entity(
  target_entity_type text,
  target_entity_id uuid,
  expected_lock_version integer,
  confirmed boolean default false
)
returns table (
  entity_type text,
  entity_id uuid,
  deleted_at timestamptz,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_lock_version integer;
  current_deleted_at timestamptz;
  parent_deleted_at timestamptz;
begin
  if not private.publisher_has_aal2() or confirmed is not true then
    raise exception 'Confirmed Publisher aal2 session required'
      using errcode = '42501';
  end if;

  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if target_entity_type = 'stories' then
    select s.lock_version, s.deleted_at
    into current_lock_version, current_deleted_at
    from public.stories as s
    where s.id = target_entity_id
    for update;
  elsif target_entity_type = 'sources' then
    select s.lock_version, s.deleted_at
    into current_lock_version, current_deleted_at
    from public.sources as s
    where s.id = target_entity_id
    for update;
  elsif target_entity_type = 'places' then
    select p.lock_version, p.deleted_at, parent.deleted_at
    into current_lock_version, current_deleted_at, parent_deleted_at
    from public.places as p
    left join public.places as parent on parent.id = p.parent_place_id
    where p.id = target_entity_id
    for update of p;

    if parent_deleted_at is not null then
      raise exception 'Restore the parent Place first' using errcode = '23503';
    end if;
  elsif target_entity_type = 'themes' then
    select t.lock_version, t.deleted_at
    into current_lock_version, current_deleted_at
    from public.themes as t
    where t.id = target_entity_id
    for update;
  else
    raise exception 'Unsupported restore entity type' using errcode = '22023';
  end if;

  if current_lock_version is null then
    raise exception 'Entity not found' using errcode = 'P0002';
  end if;

  if current_deleted_at is null then
    raise exception 'Entity is not soft-deleted' using errcode = '55000';
  end if;

  if current_lock_version <> expected_lock_version then
    raise exception 'Entity was changed by another editor'
      using errcode = '40001';
  end if;

  perform private.set_editorial_audit_operation('restore');

  if target_entity_type = 'stories' then
    return query
    update public.stories as s
    set deleted_at = null, deleted_by = null
    where s.id = target_entity_id
    returning 'stories'::text, s.id, s.deleted_at, s.lock_version;
  elsif target_entity_type = 'sources' then
    return query
    update public.sources as s
    set deleted_at = null, deleted_by = null
    where s.id = target_entity_id
    returning 'sources'::text, s.id, s.deleted_at, s.lock_version;
  elsif target_entity_type = 'places' then
    return query
    update public.places as p
    set deleted_at = null, deleted_by = null
    where p.id = target_entity_id
    returning 'places'::text, p.id, p.deleted_at, p.lock_version;
  else
    return query
    update public.themes as t
    set deleted_at = null, deleted_by = null
    where t.id = target_entity_id
    returning 'themes'::text, t.id, t.deleted_at, t.lock_version;
  end if;
end;
$$;

create function public.restore_editorial_revision(
  target_revision_id bigint,
  expected_lock_version integer,
  confirmed boolean default false
)
returns table (
  entity_type text,
  entity_id uuid,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  revision public.editorial_revisions%rowtype;
  snapshot jsonb;
  current_lock_version integer;
  current_deleted_at timestamptz;
begin
  if not private.publisher_has_aal2() or confirmed is not true then
    raise exception 'Confirmed Publisher aal2 session required'
      using errcode = '42501';
  end if;

  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  select er.*
  into revision
  from public.editorial_revisions as er
  where er.id = target_revision_id;

  if not found or revision.before_data is null then
    raise exception 'Restorable revision not found' using errcode = 'P0002';
  end if;

  snapshot := revision.before_data;

  if revision.entity_type = 'stories' then
    select s.lock_version, s.deleted_at
    into current_lock_version, current_deleted_at
    from public.stories as s
    where s.id = revision.entity_id
    for update;
  elsif revision.entity_type = 'sources' then
    select s.lock_version, s.deleted_at
    into current_lock_version, current_deleted_at
    from public.sources as s
    where s.id = revision.entity_id
    for update;
  elsif revision.entity_type = 'places' then
    select p.lock_version, p.deleted_at
    into current_lock_version, current_deleted_at
    from public.places as p
    where p.id = revision.entity_id
    for update;
  elsif revision.entity_type = 'themes' then
    select t.lock_version, t.deleted_at
    into current_lock_version, current_deleted_at
    from public.themes as t
    where t.id = revision.entity_id
    for update;
  elsif revision.entity_type = 'source_private_details' then
    select details.lock_version, source.deleted_at
    into current_lock_version, current_deleted_at
    from public.source_private_details as details
    join public.sources as source on source.id = details.source_id
    where details.source_id = revision.entity_id
    for update of details;
  else
    raise exception 'Revision type requires a relationship restore or is not restorable'
      using errcode = '22023';
  end if;

  if not found then
    raise exception 'Current entity not found' using errcode = 'P0002';
  end if;

  if current_deleted_at is not null then
    raise exception 'Restore the soft-deleted entity before restoring content'
      using errcode = '55000';
  end if;

  if current_lock_version <> expected_lock_version then
    raise exception 'Entity was changed by another editor'
      using errcode = '40001';
  end if;

  perform private.set_editorial_audit_operation('revision_restore');

  if revision.entity_type = 'stories' then
    return query
    update public.stories as s
    set
      title = snapshot ->> 'title',
      subtitle = snapshot ->> 'subtitle',
      slug = snapshot ->> 'slug',
      summary = snapshot ->> 'summary',
      body = snapshot ->> 'body',
      atlas_insight = snapshot ->> 'atlas_insight',
      original_language = snapshot ->> 'original_language',
      seo_title = snapshot ->> 'seo_title',
      seo_description = snapshot ->> 'seo_description',
      cover_image_url = snapshot ->> 'cover_image_url'
    where s.id = revision.entity_id
    returning 'stories'::text, s.id, s.lock_version;
  elsif revision.entity_type = 'sources' then
    return query
    update public.sources as s
    set
      source_type = snapshot ->> 'source_type',
      original_title = snapshot ->> 'original_title',
      source_url = snapshot ->> 'source_url',
      external_id = snapshot ->> 'external_id',
      publisher = snapshot ->> 'publisher',
      original_published_at = nullif(snapshot ->> 'original_published_at', '')::timestamptz,
      original_language = snapshot ->> 'original_language',
      original_description = snapshot ->> 'original_description',
      availability_status = snapshot ->> 'availability_status'
    where s.id = revision.entity_id
    returning 'sources'::text, s.id, s.lock_version;
  elsif revision.entity_type = 'places' then
    return query
    update public.places as p
    set
      name = snapshot ->> 'name',
      slug = snapshot ->> 'slug',
      place_type = snapshot ->> 'place_type',
      parent_place_id = nullif(snapshot ->> 'parent_place_id', '')::uuid,
      country_code = snapshot ->> 'country_code',
      latitude = nullif(snapshot ->> 'latitude', '')::numeric,
      longitude = nullif(snapshot ->> 'longitude', '')::numeric,
      location_precision = snapshot ->> 'location_precision',
      is_verified = (snapshot ->> 'is_verified')::boolean
    where p.id = revision.entity_id
    returning 'places'::text, p.id, p.lock_version;
  elsif revision.entity_type = 'themes' then
    return query
    update public.themes as t
    set
      name = snapshot ->> 'name',
      slug = snapshot ->> 'slug',
      description = snapshot ->> 'description',
      theme_group = snapshot ->> 'theme_group',
      is_active = (snapshot ->> 'is_active')::boolean
    where t.id = revision.entity_id
    returning 'themes'::text, t.id, t.lock_version;
  else
    return query
    update public.source_private_details as details
    set
      raw_transcript = snapshot ->> 'raw_transcript',
      cleaned_transcript = snapshot ->> 'cleaned_transcript',
      transcript_quality = snapshot ->> 'transcript_quality',
      processing_status = snapshot ->> 'processing_status',
      rights_status = snapshot ->> 'rights_status',
      rights_note = snapshot ->> 'rights_note',
      internal_note = snapshot ->> 'internal_note'
    where details.source_id = revision.entity_id
    returning 'source_private_details'::text, details.source_id, details.lock_version;
  end if;
end;
$$;

create function public.restore_relationship_revision(
  target_revision_id bigint,
  confirmed boolean default false
)
returns table (
  entity_type text,
  entity_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  revision public.editorial_revisions%rowtype;
  snapshot jsonb;
begin
  if not private.publisher_has_aal2() or confirmed is not true then
    raise exception 'Confirmed Publisher aal2 session required'
      using errcode = '42501';
  end if;

  select er.*
  into revision
  from public.editorial_revisions as er
  where er.id = target_revision_id
    and er.operation = 'relationship_delete'
    and er.entity_type in ('story_places', 'story_themes', 'story_sources');

  if not found or revision.before_data is null then
    raise exception 'Deleted relationship revision not found'
      using errcode = 'P0002';
  end if;

  snapshot := revision.before_data;

  if not exists (
    select 1
    from public.stories as s
    where s.id = revision.entity_id
      and s.deleted_at is null
  ) then
    raise exception 'Restore the Story before restoring its relationship'
      using errcode = '23503';
  end if;

  perform private.set_editorial_audit_operation('relationship_restore');

  if revision.entity_type = 'story_places' then
    if not exists (
      select 1 from public.places as p
      where p.id = (snapshot ->> 'place_id')::uuid
        and p.deleted_at is null
    ) then
      raise exception 'Related Place is unavailable' using errcode = '23503';
    end if;

    insert into public.story_places (
      story_id,
      place_id,
      is_primary,
      relationship_type,
      display_order
    )
    values (
      (snapshot ->> 'story_id')::uuid,
      (snapshot ->> 'place_id')::uuid,
      (snapshot ->> 'is_primary')::boolean,
      snapshot ->> 'relationship_type',
      (snapshot ->> 'display_order')::integer
    );
  elsif revision.entity_type = 'story_themes' then
    if not exists (
      select 1 from public.themes as t
      where t.id = (snapshot ->> 'theme_id')::uuid
        and t.deleted_at is null
    ) then
      raise exception 'Related Theme is unavailable' using errcode = '23503';
    end if;

    insert into public.story_themes (
      story_id,
      theme_id,
      relevance,
      display_order
    )
    values (
      (snapshot ->> 'story_id')::uuid,
      (snapshot ->> 'theme_id')::uuid,
      snapshot ->> 'relevance',
      (snapshot ->> 'display_order')::integer
    );
  else
    if not exists (
      select 1 from public.sources as s
      where s.id = (snapshot ->> 'source_id')::uuid
        and s.deleted_at is null
    ) then
      raise exception 'Related Source is unavailable' using errcode = '23503';
    end if;

    insert into public.story_sources (
      story_id,
      source_id,
      is_primary,
      source_role,
      display_order
    )
    values (
      (snapshot ->> 'story_id')::uuid,
      (snapshot ->> 'source_id')::uuid,
      (snapshot ->> 'is_primary')::boolean,
      snapshot ->> 'source_role',
      (snapshot ->> 'display_order')::integer
    );
  end if;

  return query select revision.entity_type, revision.entity_id;
end;
$$;

create function public.set_theme_active(
  target_theme_id uuid,
  active boolean,
  expected_lock_version integer,
  confirmed boolean default false
)
returns table (
  theme_id uuid,
  is_active boolean,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_theme public.themes%rowtype;
begin
  if not private.has_editorial_role('editor') then
    raise exception 'Editor role required' using errcode = '42501';
  end if;

  select t.*
  into current_theme
  from public.themes as t
  where t.id = target_theme_id
  for update;

  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;

  if current_theme.deleted_at is not null then
    raise exception 'Restore the soft-deleted Theme first' using errcode = '55000';
  end if;

  if current_theme.lock_version <> expected_lock_version then
    raise exception 'Theme was changed by another editor' using errcode = '40001';
  end if;

  if current_theme.is_active = active then
    raise exception 'Theme already has the requested active state'
      using errcode = '22023';
  end if;

  if active and (
    not private.publisher_has_aal2()
    or confirmed is not true
  ) then
    raise exception 'Confirmed Publisher aal2 session required for restoration'
      using errcode = '42501';
  end if;

  if active then
    perform private.set_editorial_audit_operation('restore');
  end if;

  return query
  update public.themes as t
  set is_active = active
  where t.id = target_theme_id
  returning t.id, t.is_active, t.lock_version;
end;
$$;

create function public.create_editorial_entity(
  target_entity_type text,
  payload jsonb
)
returns table (
  entity_type text,
  entity_id uuid,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object' then
    raise exception 'Entity payload must be a JSON object' using errcode = '22023';
  end if;

  if target_entity_type = 'stories' then
    if not private.has_editorial_role('contributor') then
      raise exception 'Contributor role required' using errcode = '42501';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(payload) as key_name
      where key_name not in (
        'title', 'subtitle', 'slug', 'summary', 'body', 'atlas_insight',
        'original_language', 'seo_title', 'seo_description', 'cover_image_url'
      )
    ) then
      raise exception 'Story payload contains protected or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    insert into public.stories (
      title,
      subtitle,
      slug,
      summary,
      body,
      atlas_insight,
      original_language,
      seo_title,
      seo_description,
      cover_image_url
    )
    values (
      payload ->> 'title',
      payload ->> 'subtitle',
      payload ->> 'slug',
      payload ->> 'summary',
      payload ->> 'body',
      payload ->> 'atlas_insight',
      payload ->> 'original_language',
      payload ->> 'seo_title',
      payload ->> 'seo_description',
      payload ->> 'cover_image_url'
    )
    returning 'stories'::text, stories.id, stories.lock_version;
  elsif target_entity_type = 'sources' then
    if not private.has_editorial_role('contributor') then
      raise exception 'Contributor role required' using errcode = '42501';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(payload) as key_name
      where key_name not in (
        'source_type', 'original_title', 'source_url', 'external_id',
        'publisher', 'original_published_at', 'original_language',
        'original_description', 'availability_status'
      )
    ) then
      raise exception 'Source payload contains private or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    with inserted_source as (
      insert into public.sources (
        source_type,
        original_title,
        source_url,
        external_id,
        publisher,
        original_published_at,
        original_language,
        original_description,
        availability_status
      )
      values (
        payload ->> 'source_type',
        payload ->> 'original_title',
        payload ->> 'source_url',
        payload ->> 'external_id',
        payload ->> 'publisher',
        nullif(payload ->> 'original_published_at', '')::timestamptz,
        payload ->> 'original_language',
        payload ->> 'original_description',
        payload ->> 'availability_status'
      )
      returning sources.id, sources.lock_version
    ), inserted_private_details as (
      insert into public.source_private_details (source_id)
      select inserted_source.id from inserted_source
    )
    select 'sources'::text, inserted_source.id, inserted_source.lock_version
    from inserted_source;
  elsif target_entity_type = 'places' then
    if not private.has_editorial_role('editor') then
      raise exception 'Editor role required' using errcode = '42501';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(payload) as key_name
      where key_name not in (
        'name', 'slug', 'place_type', 'parent_place_id', 'country_code',
        'latitude', 'longitude', 'location_precision', 'is_verified'
      )
    ) then
      raise exception 'Place payload contains protected or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    insert into public.places (
      name,
      slug,
      place_type,
      parent_place_id,
      country_code,
      latitude,
      longitude,
      location_precision,
      is_verified
    )
    values (
      payload ->> 'name',
      payload ->> 'slug',
      payload ->> 'place_type',
      nullif(payload ->> 'parent_place_id', '')::uuid,
      payload ->> 'country_code',
      nullif(payload ->> 'latitude', '')::numeric,
      nullif(payload ->> 'longitude', '')::numeric,
      payload ->> 'location_precision',
      coalesce((payload ->> 'is_verified')::boolean, false)
    )
    returning 'places'::text, places.id, places.lock_version;
  elsif target_entity_type = 'themes' then
    if not private.has_editorial_role('editor') then
      raise exception 'Editor role required' using errcode = '42501';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(payload) as key_name
      where key_name not in ('name', 'slug', 'description', 'theme_group')
    ) then
      raise exception 'Theme payload contains protected or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    insert into public.themes (name, slug, description, theme_group)
    values (
      payload ->> 'name',
      payload ->> 'slug',
      payload ->> 'description',
      payload ->> 'theme_group'
    )
    returning 'themes'::text, themes.id, themes.lock_version;
  else
    raise exception 'Unsupported editorial entity type' using errcode = '22023';
  end if;
end;
$$;

create function public.update_editorial_entity(
  target_entity_type text,
  target_entity_id uuid,
  expected_lock_version integer,
  changes jsonb,
  confirmed boolean default false
)
returns table (
  entity_type text,
  entity_id uuid,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_story public.stories%rowtype;
  current_source public.sources%rowtype;
  current_place public.places%rowtype;
  current_theme public.themes%rowtype;
begin
  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if changes is null
    or pg_catalog.jsonb_typeof(changes) <> 'object'
    or changes = '{}'::jsonb then
    raise exception 'Changes must be a non-empty JSON object' using errcode = '22023';
  end if;

  if target_entity_type = 'stories' then
    select s.* into current_story
    from public.stories as s
    where s.id = target_entity_id
    for update;

    if not found then
      raise exception 'Story not found' using errcode = 'P0002';
    end if;

    if not private.can_update_story(target_entity_id) then
      raise exception 'Story update is not permitted' using errcode = '42501';
    end if;

    if current_story.status = 'published'
      and (
        not private.publisher_has_aal2()
        or confirmed is not true
      ) then
      raise exception 'Confirmed Publisher aal2 session required for published Story edits'
        using errcode = '42501';
    end if;

    if current_story.lock_version <> expected_lock_version then
      raise exception 'Story was changed by another editor' using errcode = '40001';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(changes) as key_name
      where key_name not in (
        'title', 'subtitle', 'slug', 'summary', 'body', 'atlas_insight',
        'original_language', 'seo_title', 'seo_description', 'cover_image_url'
      )
    ) then
      raise exception 'Story changes contain protected or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    update public.stories as s
    set
      title = case when changes ? 'title' then changes ->> 'title' else s.title end,
      subtitle = case when changes ? 'subtitle' then changes ->> 'subtitle' else s.subtitle end,
      slug = case when changes ? 'slug' then changes ->> 'slug' else s.slug end,
      summary = case when changes ? 'summary' then changes ->> 'summary' else s.summary end,
      body = case when changes ? 'body' then changes ->> 'body' else s.body end,
      atlas_insight = case when changes ? 'atlas_insight' then changes ->> 'atlas_insight' else s.atlas_insight end,
      original_language = case when changes ? 'original_language' then changes ->> 'original_language' else s.original_language end,
      seo_title = case when changes ? 'seo_title' then changes ->> 'seo_title' else s.seo_title end,
      seo_description = case when changes ? 'seo_description' then changes ->> 'seo_description' else s.seo_description end,
      cover_image_url = case when changes ? 'cover_image_url' then changes ->> 'cover_image_url' else s.cover_image_url end
    where s.id = target_entity_id
    returning 'stories'::text, s.id, s.lock_version;
  elsif target_entity_type = 'sources' then
    select s.* into current_source
    from public.sources as s
    where s.id = target_entity_id
    for update;

    if not found then
      raise exception 'Source not found' using errcode = 'P0002';
    end if;

    if not private.can_update_source(target_entity_id) then
      raise exception 'Source update is not permitted' using errcode = '42501';
    end if;

    if private.source_requires_publication_assurance(target_entity_id)
      and (
        not private.publisher_has_aal2()
        or confirmed is not true
      ) then
      raise exception 'Confirmed Publisher aal2 session required for public Source edits'
        using errcode = '42501';
    end if;

    if current_source.lock_version <> expected_lock_version then
      raise exception 'Source was changed by another editor' using errcode = '40001';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(changes) as key_name
      where key_name not in (
        'source_type', 'original_title', 'source_url', 'external_id',
        'publisher', 'original_published_at', 'original_language',
        'original_description', 'availability_status'
      )
    ) then
      raise exception 'Source changes contain private or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    update public.sources as s
    set
      source_type = case when changes ? 'source_type' then changes ->> 'source_type' else s.source_type end,
      original_title = case when changes ? 'original_title' then changes ->> 'original_title' else s.original_title end,
      source_url = case when changes ? 'source_url' then changes ->> 'source_url' else s.source_url end,
      external_id = case when changes ? 'external_id' then changes ->> 'external_id' else s.external_id end,
      publisher = case when changes ? 'publisher' then changes ->> 'publisher' else s.publisher end,
      original_published_at = case when changes ? 'original_published_at' then nullif(changes ->> 'original_published_at', '')::timestamptz else s.original_published_at end,
      original_language = case when changes ? 'original_language' then changes ->> 'original_language' else s.original_language end,
      original_description = case when changes ? 'original_description' then changes ->> 'original_description' else s.original_description end,
      availability_status = case when changes ? 'availability_status' then changes ->> 'availability_status' else s.availability_status end
    where s.id = target_entity_id
    returning 'sources'::text, s.id, s.lock_version;
  elsif target_entity_type = 'places' then
    if not private.has_editorial_role('editor') then
      raise exception 'Editor role required' using errcode = '42501';
    end if;

    select p.* into current_place
    from public.places as p
    where p.id = target_entity_id
    for update;

    if not found then
      raise exception 'Place not found' using errcode = 'P0002';
    end if;

    if current_place.deleted_at is not null then
      raise exception 'Restore the soft-deleted Place before editing'
        using errcode = '55000';
    end if;

    if current_place.lock_version <> expected_lock_version then
      raise exception 'Place was changed by another editor' using errcode = '40001';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(changes) as key_name
      where key_name not in (
        'name', 'slug', 'place_type', 'parent_place_id', 'country_code',
        'latitude', 'longitude', 'location_precision', 'is_verified'
      )
    ) then
      raise exception 'Place changes contain protected or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    update public.places as p
    set
      name = case when changes ? 'name' then changes ->> 'name' else p.name end,
      slug = case when changes ? 'slug' then changes ->> 'slug' else p.slug end,
      place_type = case when changes ? 'place_type' then changes ->> 'place_type' else p.place_type end,
      parent_place_id = case when changes ? 'parent_place_id' then nullif(changes ->> 'parent_place_id', '')::uuid else p.parent_place_id end,
      country_code = case when changes ? 'country_code' then changes ->> 'country_code' else p.country_code end,
      latitude = case when changes ? 'latitude' then nullif(changes ->> 'latitude', '')::numeric else p.latitude end,
      longitude = case when changes ? 'longitude' then nullif(changes ->> 'longitude', '')::numeric else p.longitude end,
      location_precision = case when changes ? 'location_precision' then changes ->> 'location_precision' else p.location_precision end,
      is_verified = case when changes ? 'is_verified' then (changes ->> 'is_verified')::boolean else p.is_verified end
    where p.id = target_entity_id
    returning 'places'::text, p.id, p.lock_version;
  elsif target_entity_type = 'themes' then
    if not private.has_editorial_role('editor') then
      raise exception 'Editor role required' using errcode = '42501';
    end if;

    select t.* into current_theme
    from public.themes as t
    where t.id = target_entity_id
    for update;

    if not found then
      raise exception 'Theme not found' using errcode = 'P0002';
    end if;

    if current_theme.deleted_at is not null then
      raise exception 'Restore the soft-deleted Theme before editing'
        using errcode = '55000';
    end if;

    if current_theme.lock_version <> expected_lock_version then
      raise exception 'Theme was changed by another editor' using errcode = '40001';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(changes) as key_name
      where key_name not in ('name', 'slug', 'description', 'theme_group')
    ) then
      raise exception 'Theme changes contain protected or unsupported fields'
        using errcode = '22023';
    end if;

    return query
    update public.themes as t
    set
      name = case when changes ? 'name' then changes ->> 'name' else t.name end,
      slug = case when changes ? 'slug' then changes ->> 'slug' else t.slug end,
      description = case when changes ? 'description' then changes ->> 'description' else t.description end,
      theme_group = case when changes ? 'theme_group' then changes ->> 'theme_group' else t.theme_group end
    where t.id = target_entity_id
    returning 'themes'::text, t.id, t.lock_version;
  else
    raise exception 'Unsupported editorial entity type' using errcode = '22023';
  end if;
end;
$$;

create function public.update_source_private_details(
  target_source_id uuid,
  expected_lock_version integer,
  changes jsonb,
  confirmed boolean default false
)
returns table (
  source_id uuid,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_details public.source_private_details%rowtype;
begin
  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if changes is null
    or pg_catalog.jsonb_typeof(changes) <> 'object'
    or changes = '{}'::jsonb then
    raise exception 'Changes must be a non-empty JSON object' using errcode = '22023';
  end if;

  if not private.can_update_source(target_source_id) then
    raise exception 'Private Source update is not permitted' using errcode = '42501';
  end if;

  if private.source_requires_publication_assurance(target_source_id)
    and (
      not private.publisher_has_aal2()
      or confirmed is not true
    ) then
    raise exception 'Confirmed Publisher aal2 session required for public Source review changes'
      using errcode = '42501';
  end if;

  select details.* into current_details
  from public.source_private_details as details
  where details.source_id = target_source_id
  for update;

  if not found then
    raise exception 'Private Source details not found' using errcode = 'P0002';
  end if;

  if current_details.lock_version <> expected_lock_version then
    raise exception 'Private Source details were changed by another editor'
      using errcode = '40001';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_object_keys(changes) as key_name
    where key_name not in (
      'raw_transcript', 'cleaned_transcript', 'transcript_quality',
      'processing_status', 'rights_status', 'rights_note', 'internal_note'
    )
  ) then
    raise exception 'Private Source changes contain protected or unsupported fields'
      using errcode = '22023';
  end if;

  return query
  update public.source_private_details as details
  set
    raw_transcript = case when changes ? 'raw_transcript' then changes ->> 'raw_transcript' else details.raw_transcript end,
    cleaned_transcript = case when changes ? 'cleaned_transcript' then changes ->> 'cleaned_transcript' else details.cleaned_transcript end,
    transcript_quality = case when changes ? 'transcript_quality' then changes ->> 'transcript_quality' else details.transcript_quality end,
    processing_status = case when changes ? 'processing_status' then changes ->> 'processing_status' else details.processing_status end,
    rights_status = case when changes ? 'rights_status' then changes ->> 'rights_status' else details.rights_status end,
    rights_note = case when changes ? 'rights_note' then changes ->> 'rights_note' else details.rights_note end,
    internal_note = case when changes ? 'internal_note' then changes ->> 'internal_note' else details.internal_note end
  where details.source_id = target_source_id
  returning details.source_id, details.lock_version;
end;
$$;

create function public.create_story_relationship(
  target_relationship_type text,
  target_story_id uuid,
  target_related_id uuid,
  attributes jsonb default '{}'::jsonb,
  confirmed boolean default false
)
returns table (
  relationship_type text,
  story_id uuid,
  related_id uuid,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if attributes is null or pg_catalog.jsonb_typeof(attributes) <> 'object' then
    raise exception 'Relationship attributes must be a JSON object'
      using errcode = '22023';
  end if;

  if not private.can_manage_story_relationship(target_story_id) then
    raise exception 'Story relationship update is not permitted'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.stories as s
    where s.id = target_story_id
      and s.status = 'published'
  ) and (
    not private.publisher_has_aal2()
    or confirmed is not true
  ) then
    raise exception 'Confirmed Publisher aal2 session required for published Story relationships'
      using errcode = '42501';
  end if;

  if target_relationship_type = 'story_places' then
    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(attributes) as key_name
      where key_name not in ('is_primary', 'relationship_type', 'display_order')
    ) then
      raise exception 'Place relationship contains unsupported fields'
        using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.places as p
      where p.id = target_related_id and p.deleted_at is null
    ) then
      raise exception 'Related Place is unavailable' using errcode = '23503';
    end if;

    return query
    insert into public.story_places (
      story_id,
      place_id,
      is_primary,
      relationship_type,
      display_order
    )
    values (
      target_story_id,
      target_related_id,
      coalesce((attributes ->> 'is_primary')::boolean, false),
      coalesce(attributes ->> 'relationship_type', 'featured'),
      coalesce((attributes ->> 'display_order')::integer, 0)
    )
    returning
      'story_places'::text,
      story_places.story_id,
      story_places.place_id,
      story_places.lock_version;
  elsif target_relationship_type = 'story_themes' then
    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(attributes) as key_name
      where key_name not in ('relevance', 'display_order')
    ) then
      raise exception 'Theme relationship contains unsupported fields'
        using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.themes as t
      where t.id = target_related_id and t.deleted_at is null
    ) then
      raise exception 'Related Theme is unavailable' using errcode = '23503';
    end if;

    return query
    insert into public.story_themes (
      story_id,
      theme_id,
      relevance,
      display_order
    )
    values (
      target_story_id,
      target_related_id,
      coalesce(attributes ->> 'relevance', 'related'),
      coalesce((attributes ->> 'display_order')::integer, 0)
    )
    returning
      'story_themes'::text,
      story_themes.story_id,
      story_themes.theme_id,
      story_themes.lock_version;
  elsif target_relationship_type = 'story_sources' then
    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(attributes) as key_name
      where key_name not in ('is_primary', 'source_role', 'display_order')
    ) then
      raise exception 'Source relationship contains unsupported fields'
        using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.sources as s
      where s.id = target_related_id and s.deleted_at is null
    ) then
      raise exception 'Related Source is unavailable' using errcode = '23503';
    end if;

    return query
    insert into public.story_sources (
      story_id,
      source_id,
      is_primary,
      source_role,
      display_order
    )
    values (
      target_story_id,
      target_related_id,
      coalesce(
        (attributes ->> 'is_primary')::boolean,
        attributes ->> 'source_role' = 'primary',
        false
      ),
      coalesce(attributes ->> 'source_role', 'supporting'),
      coalesce((attributes ->> 'display_order')::integer, 0)
    )
    returning
      'story_sources'::text,
      story_sources.story_id,
      story_sources.source_id,
      story_sources.lock_version;
  else
    raise exception 'Unsupported Story relationship type' using errcode = '22023';
  end if;
end;
$$;

create function public.update_story_relationship(
  target_relationship_type text,
  target_story_id uuid,
  target_related_id uuid,
  expected_lock_version integer,
  attributes jsonb,
  confirmed boolean default false
)
returns table (
  relationship_type text,
  story_id uuid,
  related_id uuid,
  lock_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_lock_version integer;
begin
  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if attributes is null
    or pg_catalog.jsonb_typeof(attributes) <> 'object'
    or attributes = '{}'::jsonb then
    raise exception 'Relationship attributes must be a non-empty JSON object'
      using errcode = '22023';
  end if;

  if not private.can_manage_story_relationship(target_story_id) then
    raise exception 'Story relationship update is not permitted'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.stories as s
    where s.id = target_story_id
      and s.status = 'published'
  ) and (
    not private.publisher_has_aal2()
    or confirmed is not true
  ) then
    raise exception 'Confirmed Publisher aal2 session required for published Story relationships'
      using errcode = '42501';
  end if;

  if target_relationship_type = 'story_places' then
    select sp.lock_version into current_lock_version
    from public.story_places as sp
    where sp.story_id = target_story_id and sp.place_id = target_related_id
    for update;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(attributes) as key_name
      where key_name not in ('is_primary', 'relationship_type', 'display_order')
    ) then
      raise exception 'Place relationship contains unsupported fields'
        using errcode = '22023';
    end if;
  elsif target_relationship_type = 'story_themes' then
    select st.lock_version into current_lock_version
    from public.story_themes as st
    where st.story_id = target_story_id and st.theme_id = target_related_id
    for update;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(attributes) as key_name
      where key_name not in ('relevance', 'display_order')
    ) then
      raise exception 'Theme relationship contains unsupported fields'
        using errcode = '22023';
    end if;
  elsif target_relationship_type = 'story_sources' then
    select ss.lock_version into current_lock_version
    from public.story_sources as ss
    where ss.story_id = target_story_id and ss.source_id = target_related_id
    for update;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(attributes) as key_name
      where key_name not in ('is_primary', 'source_role', 'display_order')
    ) then
      raise exception 'Source relationship contains unsupported fields'
        using errcode = '22023';
    end if;
  else
    raise exception 'Unsupported Story relationship type' using errcode = '22023';
  end if;

  if current_lock_version is null then
    raise exception 'Story relationship not found' using errcode = 'P0002';
  end if;

  if current_lock_version <> expected_lock_version then
    raise exception 'Story relationship was changed by another editor'
      using errcode = '40001';
  end if;

  if target_relationship_type = 'story_places' then
    return query
    update public.story_places as sp
    set
      is_primary = case when attributes ? 'is_primary' then (attributes ->> 'is_primary')::boolean else sp.is_primary end,
      relationship_type = case when attributes ? 'relationship_type' then attributes ->> 'relationship_type' else sp.relationship_type end,
      display_order = case when attributes ? 'display_order' then (attributes ->> 'display_order')::integer else sp.display_order end
    where sp.story_id = target_story_id and sp.place_id = target_related_id
    returning 'story_places'::text, sp.story_id, sp.place_id, sp.lock_version;
  elsif target_relationship_type = 'story_themes' then
    return query
    update public.story_themes as st
    set
      relevance = case when attributes ? 'relevance' then attributes ->> 'relevance' else st.relevance end,
      display_order = case when attributes ? 'display_order' then (attributes ->> 'display_order')::integer else st.display_order end
    where st.story_id = target_story_id and st.theme_id = target_related_id
    returning 'story_themes'::text, st.story_id, st.theme_id, st.lock_version;
  else
    return query
    update public.story_sources as ss
    set
      is_primary = case when attributes ? 'is_primary' then (attributes ->> 'is_primary')::boolean else ss.is_primary end,
      source_role = case when attributes ? 'source_role' then attributes ->> 'source_role' else ss.source_role end,
      display_order = case when attributes ? 'display_order' then (attributes ->> 'display_order')::integer else ss.display_order end
    where ss.story_id = target_story_id and ss.source_id = target_related_id
    returning 'story_sources'::text, ss.story_id, ss.source_id, ss.lock_version;
  end if;
end;
$$;

create function public.delete_story_relationship(
  target_relationship_type text,
  target_story_id uuid,
  target_related_id uuid,
  expected_lock_version integer,
  confirmed boolean default false
)
returns table (
  relationship_type text,
  story_id uuid,
  related_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_lock_version integer;
begin
  if expected_lock_version is null then
    raise exception 'Expected lock version is required' using errcode = '22023';
  end if;

  if not private.can_manage_story_relationship(target_story_id) then
    raise exception 'Story relationship deletion is not permitted'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.stories as s
    where s.id = target_story_id
      and s.status = 'published'
  ) and (
    not private.publisher_has_aal2()
    or confirmed is not true
  ) then
    raise exception 'Confirmed Publisher aal2 session required for published Story relationships'
      using errcode = '42501';
  end if;

  if target_relationship_type = 'story_places' then
    select sp.lock_version into current_lock_version
    from public.story_places as sp
    where sp.story_id = target_story_id and sp.place_id = target_related_id
    for update;
  elsif target_relationship_type = 'story_themes' then
    select st.lock_version into current_lock_version
    from public.story_themes as st
    where st.story_id = target_story_id and st.theme_id = target_related_id
    for update;
  elsif target_relationship_type = 'story_sources' then
    select ss.lock_version into current_lock_version
    from public.story_sources as ss
    where ss.story_id = target_story_id and ss.source_id = target_related_id
    for update;
  else
    raise exception 'Unsupported Story relationship type' using errcode = '22023';
  end if;

  if current_lock_version is null then
    raise exception 'Story relationship not found' using errcode = 'P0002';
  end if;

  if current_lock_version <> expected_lock_version then
    raise exception 'Story relationship was changed by another editor'
      using errcode = '40001';
  end if;

  if target_relationship_type = 'story_places' then
    return query
    delete from public.story_places as sp
    where sp.story_id = target_story_id and sp.place_id = target_related_id
    returning 'story_places'::text, sp.story_id, sp.place_id;
  elsif target_relationship_type = 'story_themes' then
    return query
    delete from public.story_themes as st
    where st.story_id = target_story_id and st.theme_id = target_related_id
    returning 'story_themes'::text, st.story_id, st.theme_id;
  else
    return query
    delete from public.story_sources as ss
    where ss.story_id = target_story_id and ss.source_id = target_related_id
    returning 'story_sources'::text, ss.story_id, ss.source_id;
  end if;
end;
$$;

revoke all on function public.transition_story_status(
  uuid,
  text,
  integer,
  timestamptz,
  boolean
) from public;
revoke all on function public.soft_delete_entity(text, uuid, integer, boolean) from public;
revoke all on function public.restore_soft_deleted_entity(
  text,
  uuid,
  integer,
  boolean
) from public;
revoke all on function public.restore_editorial_revision(bigint, integer, boolean) from public;
revoke all on function public.restore_relationship_revision(bigint, boolean) from public;
revoke all on function public.set_theme_active(uuid, boolean, integer, boolean) from public;
revoke all on function public.create_editorial_entity(text, jsonb) from public;
revoke all on function public.update_editorial_entity(
  text, uuid, integer, jsonb, boolean
) from public;
revoke all on function public.update_source_private_details(
  uuid, integer, jsonb, boolean
) from public;
revoke all on function public.create_story_relationship(
  text, uuid, uuid, jsonb, boolean
) from public;
revoke all on function public.update_story_relationship(
  text, uuid, uuid, integer, jsonb, boolean
) from public;
revoke all on function public.delete_story_relationship(
  text, uuid, uuid, integer, boolean
) from public;

grant execute on function public.transition_story_status(
  uuid,
  text,
  integer,
  timestamptz,
  boolean
) to authenticated;
grant execute on function public.soft_delete_entity(text, uuid, integer, boolean)
  to authenticated;
grant execute on function public.restore_soft_deleted_entity(
  text,
  uuid,
  integer,
  boolean
) to authenticated;
grant execute on function public.restore_editorial_revision(bigint, integer, boolean)
  to authenticated;
grant execute on function public.restore_relationship_revision(bigint, boolean)
  to authenticated;
grant execute on function public.set_theme_active(uuid, boolean, integer, boolean)
  to authenticated;
grant execute on function public.create_editorial_entity(text, jsonb)
  to authenticated;
grant execute on function public.update_editorial_entity(
  text, uuid, integer, jsonb, boolean
) to authenticated;
grant execute on function public.update_source_private_details(
  uuid, integer, jsonb, boolean
) to authenticated;
grant execute on function public.create_story_relationship(
  text, uuid, uuid, jsonb, boolean
) to authenticated;
grant execute on function public.update_story_relationship(
  text, uuid, uuid, integer, jsonb, boolean
) to authenticated;
grant execute on function public.delete_story_relationship(
  text, uuid, uuid, integer, boolean
) to authenticated;

alter table public.editorial_memberships enable row level security;
alter table public.source_private_details enable row level security;
alter table public.editorial_revisions enable row level security;

drop policy stories_public_read_published on public.stories;
drop policy places_public_read on public.places;
drop policy themes_public_read on public.themes;
drop policy sources_public_read on public.sources;
drop policy story_places_public_read_published on public.story_places;
drop policy story_themes_public_read_published on public.story_themes;
drop policy story_sources_public_read_published on public.story_sources;

create policy stories_public_read_published
on public.stories
for select
to anon, authenticated
using (
  status = 'published'
  and published_at <= pg_catalog.now()
  and deleted_at is null
);

create policy stories_editorial_read
on public.stories
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and (
    deleted_at is null
    or private.has_editorial_role('publisher')
  )
);

create policy places_public_read
on public.places
for select
to anon, authenticated
using (deleted_at is null);

create policy places_editorial_read
on public.places
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and (
    deleted_at is null
    or private.has_editorial_role('publisher')
  )
);

create policy themes_public_read
on public.themes
for select
to anon, authenticated
using (
  is_active
  and deleted_at is null
);

create policy themes_editorial_read
on public.themes
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and (
    deleted_at is null
    or private.has_editorial_role('publisher')
  )
);

create policy sources_public_read
on public.sources
for select
to anon, authenticated
using (
  deleted_at is null
  and private.source_is_public(id)
);

create policy sources_editorial_read
on public.sources
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and (
    deleted_at is null
    or private.has_editorial_role('publisher')
  )
);

create policy source_private_details_editorial_read
on public.source_private_details
for select
to authenticated
using (private.can_read_source_private(source_id));

create policy story_places_public_read_published
on public.story_places
for select
to anon, authenticated
using (
  private.story_is_public(story_id)
  and private.place_is_public(place_id)
);

create policy story_places_editorial_read
on public.story_places
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and exists (
    select 1 from public.stories as s
    where s.id = story_places.story_id
      and s.deleted_at is null
  )
);

create policy story_themes_public_read_published
on public.story_themes
for select
to anon, authenticated
using (
  private.story_is_public(story_id)
  and private.theme_is_public(theme_id)
);

create policy story_themes_editorial_read
on public.story_themes
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and exists (
    select 1 from public.stories as s
    where s.id = story_themes.story_id
      and s.deleted_at is null
  )
);

create policy story_sources_public_read_published
on public.story_sources
for select
to anon, authenticated
using (
  private.story_is_public(story_id)
);

create policy story_sources_editorial_read
on public.story_sources
for select
to authenticated
using (
  private.has_editorial_role('contributor')
  and exists (
    select 1 from public.stories as s
    where s.id = story_sources.story_id
      and s.deleted_at is null
  )
);

create policy editorial_memberships_self_read
on public.editorial_memberships
for select
to authenticated
using (user_id = (select auth.uid()));

create policy editorial_revisions_editor_read
on public.editorial_revisions
for select
to authenticated
using (
  private.has_editorial_role('editor')
  and (
    not is_sensitive
    or private.has_editorial_role('publisher')
  )
);

create view public.editorial_stories
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
  s.lock_version
from public.stories as s
where private.has_editorial_role('contributor')
  and (
    s.deleted_at is null
    or private.has_editorial_role('publisher')
  );

create view public.editorial_places
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
  p.lock_version
from public.places as p
where private.has_editorial_role('contributor')
  and (
    p.deleted_at is null
    or private.has_editorial_role('publisher')
  );

create view public.editorial_themes
with (security_barrier = true)
as
select
  t.id,
  t.name,
  t.slug,
  t.description,
  t.theme_group,
  t.is_active,
  t.created_at,
  t.updated_at,
  t.created_by,
  t.updated_by,
  t.deleted_at,
  t.deleted_by,
  t.lock_version
from public.themes as t
where private.has_editorial_role('contributor')
  and (
    t.deleted_at is null
    or private.has_editorial_role('publisher')
  );

create view public.editorial_sources
with (security_barrier = true)
as
select
  s.id,
  s.source_type,
  s.original_title,
  s.source_url,
  s.external_id,
  s.publisher,
  s.original_published_at,
  s.original_language,
  s.original_description,
  s.availability_status,
  s.collected_at,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by,
  s.deleted_at,
  s.deleted_by,
  s.lock_version
from public.sources as s
where private.has_editorial_role('contributor')
  and (
    s.deleted_at is null
    or private.has_editorial_role('publisher')
  );

create view public.editorial_source_private_details
with (security_barrier = true)
as
select
  details.source_id,
  details.raw_transcript,
  details.cleaned_transcript,
  details.transcript_quality,
  details.processing_status,
  details.rights_status,
  details.rights_note,
  details.internal_note,
  details.created_at,
  details.updated_at,
  details.created_by,
  details.updated_by,
  details.lock_version
from public.source_private_details as details
where private.can_read_source_private(details.source_id);

create view public.editorial_story_places
with (security_barrier = true)
as
select
  sp.story_id,
  sp.place_id,
  sp.is_primary,
  sp.relationship_type,
  sp.display_order,
  sp.created_at,
  sp.created_by,
  sp.updated_at,
  sp.updated_by,
  sp.lock_version
from public.story_places as sp
join public.stories as s on s.id = sp.story_id
where private.has_editorial_role('contributor')
  and (
    s.deleted_at is null
    or private.has_editorial_role('publisher')
  );

create view public.editorial_story_themes
with (security_barrier = true)
as
select
  st.story_id,
  st.theme_id,
  st.relevance,
  st.display_order,
  st.created_at,
  st.created_by,
  st.updated_at,
  st.updated_by,
  st.lock_version
from public.story_themes as st
join public.stories as s on s.id = st.story_id
where private.has_editorial_role('contributor')
  and (
    s.deleted_at is null
    or private.has_editorial_role('publisher')
  );

create view public.editorial_story_sources
with (security_barrier = true)
as
select
  ss.story_id,
  ss.source_id,
  ss.is_primary,
  ss.source_role,
  ss.display_order,
  ss.created_at,
  ss.created_by,
  ss.updated_at,
  ss.updated_by,
  ss.lock_version
from public.story_sources as ss
join public.stories as s on s.id = ss.story_id
where private.has_editorial_role('contributor')
  and (
    s.deleted_at is null
    or private.has_editorial_role('publisher')
  );

revoke all on table public.editorial_stories from anon, authenticated;
revoke all on table public.editorial_places from anon, authenticated;
revoke all on table public.editorial_themes from anon, authenticated;
revoke all on table public.editorial_sources from anon, authenticated;
revoke all on table public.editorial_source_private_details from anon, authenticated;
revoke all on table public.editorial_story_places from anon, authenticated;
revoke all on table public.editorial_story_themes from anon, authenticated;
revoke all on table public.editorial_story_sources from anon, authenticated;

grant select on table public.editorial_stories to authenticated;
grant select on table public.editorial_places to authenticated;
grant select on table public.editorial_themes to authenticated;
grant select on table public.editorial_sources to authenticated;
grant select on table public.editorial_source_private_details to authenticated;
grant select on table public.editorial_story_places to authenticated;
grant select on table public.editorial_story_themes to authenticated;
grant select on table public.editorial_story_sources to authenticated;

revoke all on table public.stories from anon, authenticated;
revoke all on table public.places from anon, authenticated;
revoke all on table public.themes from anon, authenticated;
revoke all on table public.sources from anon, authenticated;
revoke all on table public.source_private_details from anon, authenticated;
revoke all on table public.story_places from anon, authenticated;
revoke all on table public.story_themes from anon, authenticated;
revoke all on table public.story_sources from anon, authenticated;
revoke all on table public.editorial_memberships from anon, authenticated;
revoke all on table public.editorial_revisions from anon, authenticated;

grant select (
  id,
  title,
  subtitle,
  slug,
  summary,
  body,
  atlas_insight,
  original_language,
  seo_title,
  seo_description,
  status,
  cover_image_url,
  published_at,
  created_at,
  updated_at
) on table public.stories to anon, authenticated;

grant select (
  id,
  name,
  slug,
  place_type,
  parent_place_id,
  country_code,
  latitude,
  longitude,
  location_precision,
  is_verified,
  created_at,
  updated_at
) on table public.places to anon, authenticated;

grant select (
  id,
  name,
  slug,
  description,
  theme_group,
  is_active,
  created_at,
  updated_at
) on table public.themes to anon, authenticated;

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

grant select (
  story_id,
  place_id,
  created_at,
  is_primary,
  relationship_type,
  display_order
) on table public.story_places to anon, authenticated;

grant select (
  story_id,
  theme_id,
  created_at,
  relevance,
  display_order
) on table public.story_themes to anon, authenticated;

grant select (
  story_id,
  source_id,
  created_at,
  is_primary,
  source_role,
  display_order
) on table public.story_sources to anon, authenticated;

grant select (user_id, role, is_active)
  on table public.editorial_memberships to authenticated;

grant select on table public.editorial_revisions to authenticated;
