begin;

create extension if not exists pgtap with schema extensions;

select extensions.no_plan();

create temporary table phase_a_function_privilege_expectations (
  function_signature text primary key,
  function_class text not null,
  anon_execute boolean not null,
  authenticated_execute boolean not null
) on commit drop;

insert into phase_a_function_privilege_expectations (
  function_signature,
  function_class,
  anon_execute,
  authenticated_execute
)
values
  ('private.has_editorial_role(text)', 'public_read_only_helper', true, true),
  ('private.can_read_source_private(uuid)', 'public_read_only_helper', true, true),
  ('private.source_is_public(uuid)', 'public_read_only_helper', true, true),
  ('private.story_is_public(uuid)', 'public_read_only_helper', true, true),
  ('private.place_is_public(uuid)', 'public_read_only_helper', true, true),
  ('private.theme_is_public(uuid)', 'public_read_only_helper', true, true),
  ('public.transition_story_status(uuid,text,integer,timestamp with time zone,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.soft_delete_entity(text,uuid,integer,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.restore_soft_deleted_entity(text,uuid,integer,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.restore_editorial_revision(bigint,integer,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.restore_relationship_revision(bigint,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.set_theme_active(uuid,boolean,integer,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.create_editorial_entity(text,jsonb)', 'authenticated_editorial_rpc', false, true),
  ('public.update_editorial_entity(text,uuid,integer,jsonb,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.update_source_private_details(uuid,integer,jsonb,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.create_story_relationship(text,uuid,uuid,jsonb,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.update_story_relationship(text,uuid,uuid,integer,jsonb,boolean)', 'authenticated_editorial_rpc', false, true),
  ('public.delete_story_relationship(text,uuid,uuid,integer,boolean)', 'authenticated_editorial_rpc', false, true),
  ('private.current_editorial_role()', 'internal_security_helper', false, false),
  ('private.publisher_has_aal2()', 'internal_security_helper', false, false),
  ('private.can_update_story(uuid)', 'internal_security_helper', false, false),
  ('private.can_manage_story_relationship(uuid)', 'internal_security_helper', false, false),
  ('private.source_requires_publication_assurance(uuid)', 'internal_security_helper', false, false),
  ('private.can_update_source(uuid)', 'internal_security_helper', false, false),
  ('private.set_editorial_audit_operation(text)', 'internal_security_helper', false, false),
  ('private.set_entity_metadata()', 'trigger_only_function', false, false),
  ('private.set_relationship_metadata()', 'trigger_only_function', false, false),
  ('private.capture_editorial_revision()', 'trigger_only_function', false, false);

select extensions.is(
  (
    select count(*)
    from phase_a_function_privilege_expectations as expected
    where pg_catalog.has_function_privilege(
      'anon',
      expected.function_signature,
      'EXECUTE'
    ) is distinct from expected.anon_execute
      or pg_catalog.has_function_privilege(
        'authenticated',
        expected.function_signature,
        'EXECUTE'
      ) is distinct from expected.authenticated_execute
  ),
  0::bigint,
  'every Phase A function matches the explicit anon/authenticated privilege matrix'
);
select extensions.is(
  (
    select pg_catalog.array_agg(function_signature order by function_signature)
    from phase_a_function_privilege_expectations
    where pg_catalog.has_function_privilege(
      'anon',
      function_signature,
      'EXECUTE'
    )
  ),
  array[
    'private.can_read_source_private(uuid)',
    'private.has_editorial_role(text)',
    'private.place_is_public(uuid)',
    'private.source_is_public(uuid)',
    'private.story_is_public(uuid)',
    'private.theme_is_public(uuid)'
  ]::text[],
  'anon can execute exactly the approved public read-only helpers'
);
select extensions.is(
  (
    select count(*)
    from phase_a_function_privilege_expectations as expected
    join pg_catalog.pg_proc as procedure
      on procedure.oid = expected.function_signature::regprocedure
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        procedure.proacl,
        pg_catalog.acldefault('f', procedure.proowner)
      )
    ) as acl
    where acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  0::bigint,
  'no Phase A function retains PUBLIC EXECUTE'
);
select extensions.is(
  (
    select pg_catalog.array_agg(distinct pg_catalog.pg_get_userbyid(procedure.proowner))
    from phase_a_function_privilege_expectations as expected
    join pg_catalog.pg_proc as procedure
      on procedure.oid = expected.function_signature::regprocedure
  ),
  array['postgres']::text[],
  'postgres owns every Phase A function'
);
select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_default_acl as defaults
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = defaults.defaclnamespace
    cross join lateral pg_catalog.aclexplode(defaults.defaclacl) as acl
    where defaults.defaclrole = 'postgres'::regrole
      and defaults.defaclobjtype = 'f'
      and namespace.nspname = 'public'
      and acl.privilege_type = 'EXECUTE'
      and acl.grantee in (0, 'anon'::regrole)
  ),
  0::bigint,
  'future postgres-owned public functions do not default EXECUTE to PUBLIC or anon'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'contributor@example.test', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'editor@example.test', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'publisher@example.test', now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'inactive@example.test', now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'nonmember@example.test', now(), now());

insert into public.editorial_memberships (user_id, role, is_active)
values
  ('10000000-0000-0000-0000-000000000001', 'contributor', true),
  ('10000000-0000-0000-0000-000000000002', 'editor', true),
  ('10000000-0000-0000-0000-000000000003', 'publisher', true),
  ('10000000-0000-0000-0000-000000000004', 'publisher', false);

insert into public.stories (
  id,
  title,
  slug,
  summary,
  body,
  status,
  published_at,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Public Story',
    'public-story',
    'Public summary',
    'Public body',
    'published',
    now() - interval '1 hour',
    null,
    null,
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Future Story',
    'future-story',
    'Future summary',
    'Future body',
    'published',
    now() + interval '1 day',
    null,
    null,
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Draft Story',
    'draft-story',
    'Draft summary',
    'Draft body',
    'draft',
    null,
    null,
    null,
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Archived Story',
    'archived-story',
    'Archived summary',
    'Archived body',
    'archived',
    now() - interval '2 days',
    now() - interval '1 day',
    '10000000-0000-0000-0000-000000000003',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Deleted Story',
    'deleted-story',
    'Deleted summary',
    'Deleted body',
    'published',
    now() - interval '1 day',
    null,
    null,
    now() - interval '1 hour',
    '10000000-0000-0000-0000-000000000003'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    'Publishable Story',
    'publishable-story',
    'Publishable summary',
    'Publishable body',
    'approved',
    null,
    null,
    null,
    null,
    null
  );

insert into public.places (
  id,
  name,
  slug,
  location_precision,
  is_verified
)
values (
  '30000000-0000-0000-0000-000000000001',
  'Reviewed Place',
  'reviewed-place',
  'city',
  true
);

insert into public.themes (id, name, slug, is_active)
values (
  '40000000-0000-0000-0000-000000000001',
  'Active Theme',
  'active-theme',
  true
);

insert into public.sources (
  id,
  source_type,
  original_title,
  source_url,
  availability_status
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    'article',
    'Cleared Source',
    'https://example.test/cleared',
    'available'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'article',
    'Unrelated Source',
    'https://example.test/unrelated',
    'available'
  );

insert into public.source_private_details (
  source_id,
  raw_transcript,
  processing_status,
  rights_status
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    'Private transcript',
    'ready',
    'cleared'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'Other private transcript',
    'ready',
    'cleared'
  );

insert into public.story_places (
  story_id,
  place_id,
  is_primary,
  relationship_type
)
values (
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  true,
  'featured'
), (
  '20000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000001',
  true,
  'featured'
);

insert into public.story_themes (story_id, theme_id, relevance)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'primary'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000001',
    'primary'
  );

insert into public.story_sources (
  story_id,
  source_id,
  is_primary,
  source_role
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    true,
    'primary'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '50000000-0000-0000-0000-000000000001',
    true,
    'primary'
  );

set local role anon;

select extensions.is(
  private.has_editorial_role('contributor'),
  false,
  'anonymous callers may execute the role predicate without gaining a role'
);
select extensions.is(
  private.can_read_source_private('50000000-0000-0000-0000-000000000001'),
  false,
  'anonymous callers may execute the private-read predicate without seeing data'
);
select extensions.throws_ok(
  'select private.current_editorial_role()',
  '42501',
  'permission denied for function current_editorial_role',
  'anonymous callers cannot enter internal security helpers'
);
select extensions.throws_ok(
  'select private.set_entity_metadata()',
  '42501',
  'permission denied for function set_entity_metadata',
  'anonymous callers cannot enter trigger-only functions'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000001',
      'draft',
      1,
      null,
      false
    )$$,
  '42501',
  'permission denied for function transition_story_status',
  'anonymous callers are denied before entering Story transitions'
);
select extensions.throws_ok(
  $$select public.soft_delete_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'permission denied for function soft_delete_entity',
  'anonymous callers are denied before entering soft deletion'
);
select extensions.throws_ok(
  $$select public.restore_soft_deleted_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'permission denied for function restore_soft_deleted_entity',
  'anonymous callers are denied before entering soft-delete restoration'
);
select extensions.throws_ok(
  'select public.restore_editorial_revision(1, 1, false)',
  '42501',
  'permission denied for function restore_editorial_revision',
  'anonymous callers are denied before entering revision restoration'
);
select extensions.throws_ok(
  'select public.restore_relationship_revision(1, false)',
  '42501',
  'permission denied for function restore_relationship_revision',
  'anonymous callers are denied before entering relationship restoration'
);
select extensions.throws_ok(
  $$select public.set_theme_active(
      '40000000-0000-0000-0000-000000000001',
      false,
      1,
      false
    )$$,
  '42501',
  'permission denied for function set_theme_active',
  'anonymous callers are denied before entering Theme lifecycle mutation'
);
select extensions.throws_ok(
  $$select public.create_editorial_entity(
      'stories',
      '{"title":"Denied"}'::jsonb
    )$$,
  '42501',
  'permission denied for function create_editorial_entity',
  'anonymous callers are denied before entering entity creation'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      '{"summary":"Denied"}'::jsonb,
      false
    )$$,
  '42501',
  'permission denied for function update_editorial_entity',
  'anonymous callers are denied before entering entity updates'
);
select extensions.throws_ok(
  $$select public.update_source_private_details(
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"internal_note":"Denied"}'::jsonb,
      false
    )$$,
  '42501',
  'permission denied for function update_source_private_details',
  'anonymous callers are denied before entering private Source updates'
);
select extensions.throws_ok(
  $$select public.create_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      '{}'::jsonb,
      false
    )$$,
  '42501',
  'permission denied for function create_story_relationship',
  'anonymous callers are denied before entering relationship creation'
);
select extensions.throws_ok(
  $$select public.update_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"display_order":1}'::jsonb,
      false
    )$$,
  '42501',
  'permission denied for function update_story_relationship',
  'anonymous callers are denied before entering relationship updates'
);
select extensions.throws_ok(
  $$select public.delete_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'permission denied for function delete_story_relationship',
  'anonymous callers are denied before entering relationship deletion'
);

select extensions.is(
  (select count(id) from public.stories),
  1::bigint,
  'anonymous users see only published, due, non-deleted Stories'
);
select extensions.is(
  (select count(id) from public.places),
  1::bigint,
  'anonymous users see non-deleted Places'
);
select extensions.is(
  (select count(id) from public.themes),
  1::bigint,
  'anonymous users see only active, non-deleted Themes'
);
select extensions.is(
  (select count(id) from public.sources),
  1::bigint,
  'anonymous users see only public Source metadata'
);
select extensions.is(
  (select count(story_id) from public.story_places),
  1::bigint,
  'anonymous users see only public Place relationships'
);
select extensions.is(
  (select count(story_id) from public.story_themes),
  1::bigint,
  'anonymous users see only public Theme relationships'
);
select extensions.is(
  (select count(story_id) from public.story_sources),
  1::bigint,
  'anonymous users see only public Source relationships'
);
select extensions.throws_ok(
  'select raw_transcript from public.source_private_details',
  '42501',
  'permission denied for table source_private_details',
  'anonymous users cannot read private Source details'
);
select extensions.throws_ok(
  'select id from public.editorial_revisions',
  '42501',
  'permission denied for table editorial_revisions',
  'anonymous users cannot read editorial history'
);
select extensions.is(
  pg_catalog.has_column_privilege(
    'anon',
    'public.story_sources',
    'updated_at',
    'select'
  ),
  false,
  'anonymous relationship grants exclude updated_at audit metadata'
);
select extensions.is(
  pg_catalog.has_column_privilege(
    'anon',
    'public.story_sources',
    'created_by',
    'select'
  ),
  false,
  'anonymous relationship grants exclude actor metadata'
);
select extensions.is(
  pg_catalog.has_column_privilege(
    'anon',
    'public.story_sources',
    'source_role',
    'select'
  ),
  true,
  'anonymous relationship grants retain public relationship metadata'
);
select extensions.throws_ok(
  'select story_id from public.editorial_story_sources',
  '42501',
  'permission denied for view editorial_story_sources',
  'anonymous users cannot query editorial relationship views'
);
select extensions.is(
  (
    select pg_catalog.array_agg(cp.column_name order by cp.column_name)
    from information_schema.column_privileges as cp
    where cp.grantee = 'anon'
      and cp.table_schema = 'public'
      and cp.table_name = 'story_places'
      and cp.privilege_type = 'SELECT'
  ),
  array[
    'created_at', 'display_order', 'is_primary', 'place_id',
    'relationship_type', 'story_id'
  ]::text[],
  'anonymous story_places columns are exactly the public contract'
);
select extensions.is(
  (
    select pg_catalog.array_agg(cp.column_name order by cp.column_name)
    from information_schema.column_privileges as cp
    where cp.grantee = 'anon'
      and cp.table_schema = 'public'
      and cp.table_name = 'story_themes'
      and cp.privilege_type = 'SELECT'
  ),
  array[
    'created_at', 'display_order', 'relevance', 'story_id', 'theme_id'
  ]::text[],
  'anonymous story_themes columns are exactly the public contract'
);
select extensions.is(
  (
    select pg_catalog.array_agg(cp.column_name order by cp.column_name)
    from information_schema.column_privileges as cp
    where cp.grantee = 'anon'
      and cp.table_schema = 'public'
      and cp.table_name = 'story_sources'
      and cp.privilege_type = 'SELECT'
  ),
  array[
    'created_at', 'display_order', 'is_primary', 'source_id',
    'source_role', 'story_id'
  ]::text[],
  'anonymous story_sources columns are exactly the public contract'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal1"}',
  true
);
set local role authenticated;

select extensions.is(
  (
    select role
    from public.editorial_memberships
    where user_id = (select auth.uid())
  ),
  null::text,
  'an authenticated non-member has no editorial role'
);
select extensions.is(
  private.has_editorial_role('contributor'),
  false,
  'an authenticated non-member may execute the role predicate but gains no role'
);
select extensions.is(
  private.can_read_source_private('50000000-0000-0000-0000-000000000001'),
  false,
  'an authenticated non-member may execute the private-read predicate but gains no access'
);
select extensions.throws_ok(
  'select private.current_editorial_role()',
  '42501',
  'permission denied for function current_editorial_role',
  'authenticated callers cannot enter internal security helpers directly'
);
select extensions.throws_ok(
  'select private.set_entity_metadata()',
  '42501',
  'permission denied for function set_entity_metadata',
  'authenticated callers cannot enter trigger-only functions directly'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000001',
      'draft',
      1,
      null,
      false
    )$$,
  '42501',
  'Editorial membership required',
  'an authenticated non-member enters the Story RPC but fails membership authorization'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      '{"summary":"Denied"}'::jsonb,
      false
    )$$,
  '42501',
  'Story update is not permitted',
  'an authenticated non-member enters the entity RPC but fails authorization'
);
select extensions.throws_ok(
  $$select public.create_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      '{}'::jsonb,
      false
    )$$,
  '42501',
  'Story relationship update is not permitted',
  'an authenticated non-member cannot create Story relationships'
);
select extensions.throws_ok(
  $$select public.update_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"display_order":1}'::jsonb,
      false
    )$$,
  '42501',
  'Story relationship update is not permitted',
  'an authenticated non-member cannot update Story relationships'
);
select extensions.throws_ok(
  $$select public.delete_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'Story relationship deletion is not permitted',
  'an authenticated non-member cannot delete Story relationships'
);
select extensions.throws_ok(
  'select public.restore_relationship_revision(1, false)',
  '42501',
  'Confirmed Publisher aal2 session required',
  'an authenticated non-member cannot restore Story relationships'
);
select extensions.throws_ok(
  $$select public.soft_delete_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an authenticated non-member cannot soft-delete entities'
);
select extensions.throws_ok(
  $$select public.restore_soft_deleted_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an authenticated non-member cannot restore soft-deleted entities'
);
select extensions.throws_ok(
  $$select public.update_source_private_details(
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"internal_note":"Denied"}'::jsonb,
      false
    )$$,
  '42501',
  'Private Source update is not permitted',
  'an authenticated non-member cannot update private Source details'
);
select extensions.throws_ok(
  'select public.restore_editorial_revision(1, 1, false)',
  '42501',
  'Confirmed Publisher aal2 session required',
  'an authenticated non-member cannot restore revisions'
);
select extensions.is(
  (select count(id) from public.stories),
  1::bigint,
  'authentication alone exposes only public Stories'
);
select extensions.is(
  (select count(id) from public.editorial_stories),
  0::bigint,
  'an authenticated non-member receives no rows from editorial views'
);
select extensions.throws_ok(
  'select lock_version from public.stories',
  '42501',
  'permission denied for table stories',
  'authentication alone does not expose editorial lock metadata'
);
select extensions.is(
  pg_catalog.has_column_privilege(
    'authenticated',
    'public.stories',
    'lock_version',
    'select'
  ),
  false,
  'authenticated base grants do not include editorial lock metadata'
);
select extensions.throws_ok(
  $$insert into public.stories (title, slug, summary, body)
    values ('Denied', 'denied', 'Denied', 'Denied')$$,
  '42501',
  null,
  'an authenticated non-member cannot create a Story'
);
select extensions.throws_ok(
  $$select public.create_editorial_entity(
      'stories',
      '{"title":"Denied","slug":"denied-rpc","summary":"Denied","body":"Denied"}'::jsonb
    )$$,
  '42501',
  'Contributor role required',
  'an authenticated non-member cannot create through the mutation function'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',
  true
);
set local role authenticated;

select extensions.is(
  (
    select role
    from public.editorial_memberships
    where user_id = (select auth.uid())
  ),
  null::text,
  'an inactive membership grants no editorial role'
);
select extensions.is(
  (select count(id) from public.editorial_stories),
  0::bigint,
  'an inactive membership receives no editorial rows'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',
  true
);
set local role authenticated;

select extensions.is(
  (
    select role
    from public.editorial_memberships
    where user_id = (select auth.uid())
  ),
  'contributor',
  'an active Contributor receives the Contributor role'
);
select extensions.lives_ok(
  $$select public.create_editorial_entity(
      'stories',
      '{"title":"Contributor Story","slug":"contributor-story","summary":"Summary","body":"Body"}'::jsonb
    )$$,
  'a Contributor can create a draft Story through the protected function'
);
select extensions.lives_ok(
  $$select public.update_editorial_entity(
      'stories',
      (select id from public.editorial_stories where slug = 'contributor-story'),
      1,
      '{"summary":"Updated summary"}'::jsonb,
      false
    )$$,
  'a Contributor can update their own draft through the concurrency function'
);
select extensions.is(
  (select lock_version from public.editorial_stories where slug = 'contributor-story'),
  2,
  'an accepted edit increments lock_version'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'stories',
      (select id from public.editorial_stories where slug = 'contributor-story'),
      1,
      '{"summary":"Stale overwrite"}'::jsonb,
      false
    )$$,
  '40001',
  'Story was changed by another editor',
  'a stale lock_version cannot overwrite a newer Story'
);
select extensions.throws_ok(
  $$update public.stories set summary = 'Direct bypass'
    where slug = 'contributor-story'$$,
  '42501',
  'permission denied for table stories',
  'a Contributor has no direct Story update path around concurrency'
);
select extensions.throws_ok(
  $$update public.editorial_memberships
    set role = 'publisher'
    where user_id = '10000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table editorial_memberships',
  'a Contributor cannot self-promote'
);
select extensions.throws_ok(
  $$select public.create_editorial_entity(
      'stories',
      '{"title":"Forged","slug":"forged-actor","summary":"Summary","body":"Body","created_by":"10000000-0000-0000-0000-000000000003"}'::jsonb
    )$$,
  '22023',
  'Story payload contains protected or unsupported fields',
  'a Contributor cannot forge actor IDs through mutation payloads'
);
select extensions.throws_ok(
  $$select private.set_editorial_audit_operation('soft_delete')$$,
  '42501',
  'permission denied for function set_editorial_audit_operation',
  'application roles cannot spoof protected audit operation labels'
);
select extensions.lives_ok(
  $$select public.create_editorial_entity(
      'sources',
      '{"source_type":"article","source_url":"https://example.test/contributor-source","availability_status":"available"}'::jsonb
    )$$,
  'a Contributor can create a Source through the protected function'
);
select extensions.lives_ok(
  $$select public.update_editorial_entity(
      'sources',
      (
        select id from public.editorial_sources
        where source_url = 'https://example.test/contributor-source'
      ),
      1,
      '{"original_title":"Contributor Source"}'::jsonb,
      false
    )$$,
  'a Contributor can update their own non-public Source with a current version'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'sources',
      (
        select id from public.editorial_sources
        where source_url = 'https://example.test/contributor-source'
      ),
      1,
      '{"original_title":"Stale Source"}'::jsonb,
      false
    )$$,
  '40001',
  'Source was changed by another editor',
  'a stale Source version cannot overwrite a newer edit'
);
select extensions.lives_ok(
  $$select public.update_source_private_details(
      (
        select id from public.editorial_sources
        where source_url = 'https://example.test/contributor-source'
      ),
      1,
      '{"internal_note":"Contributor private note"}'::jsonb,
      false
    )$$,
  'private Source details use the protected concurrency model'
);
select extensions.throws_ok(
  $$select public.update_source_private_details(
      (
        select id from public.editorial_sources
        where source_url = 'https://example.test/contributor-source'
      ),
      1,
      '{"internal_note":"Stale private note"}'::jsonb,
      false
    )$$,
  '40001',
  'Private Source details were changed by another editor',
  'a stale private Source version cannot overwrite a newer edit'
);
select extensions.is(
  (
    select count(source_id)
    from public.editorial_source_private_details
    where source_id = '50000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'an active Contributor may read private Source details'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      id,
      'needs_review',
      lock_version
    )
    from public.editorial_stories
    where slug = 'contributor-story'$$,
  'a Contributor can submit their own Story for review'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      id,
      'approved',
      lock_version
    )
    from public.editorial_stories
    where slug = 'contributor-story'$$,
  '42501',
  'Editor role required',
  'a Contributor cannot approve a Story'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}',
  true
);
set local role authenticated;

select extensions.is(
  (
    select role
    from public.editorial_memberships
    where user_id = (select auth.uid())
  ),
  'editor',
  'an active Editor receives the Editor role'
);
select extensions.lives_ok(
  $$select public.create_editorial_entity(
      'places',
      '{"name":"Editor Place","slug":"editor-place","location_precision":"city","is_verified":true}'::jsonb
    )$$,
  'an Editor can create a Place through the protected function'
);
select extensions.lives_ok(
  $$select public.update_editorial_entity(
      'places',
      (select id from public.editorial_places where slug = 'editor-place'),
      1,
      '{"name":"Updated Editor Place"}'::jsonb,
      false
    )$$,
  'an Editor can update a Place with a current version'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'places',
      (select id from public.editorial_places where slug = 'editor-place'),
      1,
      '{"name":"Stale Editor Place"}'::jsonb,
      false
    )$$,
  '40001',
  'Place was changed by another editor',
  'a stale Place version cannot overwrite a newer edit'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      id,
      'approved',
      lock_version
    )
    from public.editorial_stories
    where slug = 'contributor-story'$$,
  'an Editor can approve a Story in review'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      id,
      'published',
      lock_version,
      now(),
      true
    )
    from public.editorial_stories
    where slug = 'contributor-story'$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an Editor cannot publish a Story'
);
select extensions.throws_ok(
  $$update public.editorial_memberships
    set role = 'publisher'
    where user_id = '10000000-0000-0000-0000-000000000002'$$,
  '42501',
  'permission denied for table editorial_memberships',
  'an Editor cannot self-promote'
);
select extensions.throws_ok(
  $$update public.stories
    set status = 'published', published_at = now()
    where slug = 'contributor-story'$$,
  '42501',
  'permission denied for table stories',
  'an Editor cannot publish through direct lifecycle columns'
);
select extensions.throws_ok(
  $$select public.soft_delete_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      1,
      true
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an Editor cannot soft-delete through the protected function'
);
select extensions.is(
  (select count(id) from public.editorial_revisions where is_sensitive),
  0::bigint,
  'an Editor cannot read sensitive Source history'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}',
  true
);
set local role authenticated;

select extensions.is(
  (
    select role
    from public.editorial_memberships
    where user_id = (select auth.uid())
  ),
  'publisher',
  'an active AAL1 Publisher still receives the database Publisher role'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'published',
      1,
      now(),
      true
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an AAL1 Publisher cannot publish'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'stories',
      '20000000-0000-0000-0000-000000000001',
      1,
      '{"summary":"AAL1 bypass"}'::jsonb,
      true
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for published Story edits',
  'an AAL1 Publisher cannot edit currently published Story content'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'sources',
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"original_title":"AAL1 public Source bypass"}'::jsonb,
      true
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for public Source edits',
  'an AAL1 Publisher cannot edit public Source metadata'
);
select extensions.throws_ok(
  $$update public.stories
    set summary = 'Direct AAL1 bypass'
    where id = '20000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table stories',
  'an AAL1 Publisher has no direct public Story update path'
);
select extensions.throws_ok(
  $$select public.delete_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      true
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for published Story relationships',
  'an AAL1 Publisher cannot delete a public relationship'
);
select extensions.throws_ok(
  $$delete from public.story_sources
    where story_id = '20000000-0000-0000-0000-000000000001'
      and source_id = '50000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table story_sources',
  'an AAL1 Publisher has no direct relationship deletion path'
);
select extensions.throws_ok(
  $$select public.soft_delete_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      1,
      true
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an AAL1 Publisher cannot soft-delete'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',
  true
);
set local role authenticated;

select extensions.is(
  (
    select role
    from public.editorial_memberships
    where user_id = (select auth.uid())
  ),
  'publisher',
  'an active Publisher receives the Publisher role'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'published',
      1,
      now(),
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'NULL confirmation fails closed for publication'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'published',
      1,
      now(),
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'false confirmation fails closed for publication'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'published',
      1,
      now()
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'omitted confirmation fails closed for publication'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'published',
      1,
      now(),
      true
    )$$,
  'a confirmed aal2 Publisher can publish a complete Story'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'approved',
      2,
      null,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'NULL confirmation fails closed for unpublication'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'approved',
      2,
      null,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'false confirmation fails closed for unpublication'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'approved',
      2,
      null,
      true
    )$$,
  'a confirmed aal2 Publisher can unpublish to Approved'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'published',
      3,
      now(),
      true
    )$$,
  'a confirmed aal2 Publisher can republish after review'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'archived',
      4,
      null,
      true
    )$$,
  'a confirmed aal2 Publisher can archive a published Story'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'stories',
      '20000000-0000-0000-0000-000000000006',
      4,
      '{"summary":"Stale archived edit"}'::jsonb,
      true
    )$$,
  '40001',
  'Story was changed by another editor',
  'stale entity versions fail after lifecycle changes'
);
select extensions.lives_ok(
  $$select public.update_editorial_entity(
      'stories',
      '20000000-0000-0000-0000-000000000006',
      5,
      '{"summary":"Reviewed archived edit"}'::jsonb,
      false
    )$$,
  'the current entity version succeeds atomically'
);
select extensions.throws_ok(
  $$select public.restore_editorial_revision(
      (
        select pg_catalog.max(id)
        from public.editorial_revisions
        where entity_type = 'stories'
          and entity_id = '20000000-0000-0000-0000-000000000006'
          and operation = 'update'
      ),
      6,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'NULL confirmation fails closed for revision restoration'
);
select extensions.throws_ok(
  $$select public.restore_editorial_revision(
      (
        select pg_catalog.max(id)
        from public.editorial_revisions
        where entity_type = 'stories'
          and entity_id = '20000000-0000-0000-0000-000000000006'
          and operation = 'update'
      ),
      6,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'false confirmation fails closed for revision restoration'
);
select extensions.lives_ok(
  $$select public.restore_editorial_revision(
      (
        select pg_catalog.max(id)
        from public.editorial_revisions
        where entity_type = 'stories'
          and entity_id = '20000000-0000-0000-0000-000000000006'
          and operation = 'update'
      ),
      6,
      true
    )$$,
  'a confirmed aal2 Publisher can restore an editorial revision'
);
select extensions.throws_ok(
  $$select public.update_editorial_entity(
      'sources',
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"original_title":"Reviewed public Source"}'::jsonb,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for public Source edits',
  'NULL confirmation fails closed for public Source edits'
);
select extensions.lives_ok(
  $$select public.update_editorial_entity(
      'sources',
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"original_title":"Reviewed public Source"}'::jsonb,
      true
    )$$,
  'a confirmed aal2 Publisher can correct public Source metadata'
);
select extensions.throws_ok(
  $$select public.update_source_private_details(
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"rights_note":"Reviewed public Source rights"}'::jsonb,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for public Source review changes',
  'NULL confirmation fails closed for public Source review changes'
);
select extensions.lives_ok(
  $$select public.update_source_private_details(
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"rights_note":"Reviewed public Source rights"}'::jsonb,
      true
    )$$,
  'a confirmed aal2 Publisher can update public Source review details'
);
select extensions.throws_ok(
  $$select public.soft_delete_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      1,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'NULL confirmation fails closed for soft deletion'
);
select extensions.throws_ok(
  $$select public.soft_delete_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      1,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'false confirmation fails closed for soft deletion'
);
select extensions.lives_ok(
  $$select public.soft_delete_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      1,
      true
    )$$,
  'a confirmed aal2 Publisher can soft-delete an unreferenced Source'
);
select extensions.throws_ok(
  $$select public.restore_soft_deleted_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      2,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'NULL confirmation fails closed for restoration'
);
select extensions.throws_ok(
  $$select public.restore_soft_deleted_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      2,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'false confirmation fails closed for restoration'
);
select extensions.lives_ok(
  $$select public.restore_soft_deleted_entity(
      'sources',
      '50000000-0000-0000-0000-000000000002',
      2,
      true
    )$$,
  'a confirmed aal2 Publisher can restore a soft-deleted Source'
);
select extensions.throws_ok(
  $$select public.update_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000006',
      '50000000-0000-0000-0000-000000000001',
      0,
      '{"display_order":1}'::jsonb,
      false
    )$$,
  '40001',
  'Story relationship was changed by another editor',
  'a stale relationship lock_version fails without overwriting'
);
select extensions.lives_ok(
  $$select public.update_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000006',
      '50000000-0000-0000-0000-000000000001',
      1,
      '{"display_order":1}'::jsonb,
      false
    )$$,
  'the current relationship lock_version succeeds atomically'
);
select extensions.throws_ok(
  $$select public.delete_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for published Story relationships',
  'NULL confirmation fails closed for public relationship deletion'
);
select extensions.throws_ok(
  $$select public.delete_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for published Story relationships',
  'false confirmation fails closed for public relationship deletion'
);
select extensions.lives_ok(
  $$select public.delete_story_relationship(
      'story_sources',
      '20000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      1,
      true
    )$$,
  'a confirmed aal2 Publisher can delete a public relationship'
);
select extensions.throws_ok(
  $$select public.restore_relationship_revision(
      (
        select pg_catalog.max(id)
        from public.editorial_revisions
        where entity_type = 'story_sources'
          and entity_id = '20000000-0000-0000-0000-000000000001'
          and operation = 'relationship_delete'
      ),
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'NULL confirmation fails closed for relationship restoration'
);
select extensions.throws_ok(
  $$select public.restore_relationship_revision(
      (
        select pg_catalog.max(id)
        from public.editorial_revisions
        where entity_type = 'story_sources'
          and entity_id = '20000000-0000-0000-0000-000000000001'
          and operation = 'relationship_delete'
      ),
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'false confirmation fails closed for relationship restoration'
);
select extensions.lives_ok(
  $$select public.restore_relationship_revision(
      (
        select pg_catalog.max(id)
        from public.editorial_revisions
        where entity_type = 'story_sources'
          and entity_id = '20000000-0000-0000-0000-000000000001'
          and operation = 'relationship_delete'
      ),
      true
    )$$,
  'a confirmed aal2 Publisher can restore a deleted relationship'
);
select extensions.lives_ok(
  $$select public.set_theme_active(
      '40000000-0000-0000-0000-000000000001',
      false,
      1,
      false
    )$$,
  'an Editor-or-higher role can deactivate a Theme with concurrency control'
);
select extensions.throws_ok(
  $$select public.set_theme_active(
      '40000000-0000-0000-0000-000000000001',
      true,
      2,
      null
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for restoration',
  'NULL confirmation fails closed for Theme restoration'
);
select extensions.throws_ok(
  $$select public.set_theme_active(
      '40000000-0000-0000-0000-000000000001',
      true,
      2,
      false
    )$$,
  '42501',
  'Confirmed Publisher aal2 session required for restoration',
  'false confirmation fails closed for Theme restoration'
);
select extensions.lives_ok(
  $$select public.set_theme_active(
      '40000000-0000-0000-0000-000000000001',
      true,
      2,
      true
    )$$,
  'a confirmed aal2 Publisher can restore an inactive Theme'
);
select extensions.throws_ok(
  $$delete from public.sources
    where id = '50000000-0000-0000-0000-000000000002'$$,
  '42501',
  'permission denied for table sources',
  'a Publisher cannot hard-delete a Source'
);
select extensions.ok(
  (select count(id) > 0 from public.editorial_revisions where is_sensitive),
  'a Publisher can inspect sensitive Source history'
);

reset role;

select extensions.ok(
  (
    select created_by = '10000000-0000-0000-0000-000000000001'
    from public.stories
    where slug = 'contributor-story'
  ),
  'database triggers derive created_by from auth.uid()'
);
select extensions.ok(
  (
    select count(id) > 0
    from public.editorial_revisions
    where operation in ('transition', 'soft_delete', 'restore')
  ),
  'protected lifecycle operations create immutable revisions'
);

select * from extensions.finish();

rollback;
