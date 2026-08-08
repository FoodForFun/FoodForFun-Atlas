begin;

create extension if not exists pgtap with schema extensions;

select extensions.no_plan();

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

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal1"}',
  true
);
set local role authenticated;

select extensions.is(
  private.current_editorial_role(),
  null::text,
  'an authenticated non-member has no editorial role'
);
select extensions.is(
  (select count(id) from public.stories),
  1::bigint,
  'authentication alone exposes only public Stories'
);
select extensions.throws_ok(
  $$insert into public.stories (title, slug, summary, body)
    values ('Denied', 'denied', 'Denied', 'Denied')$$,
  '42501',
  null,
  'an authenticated non-member cannot create a Story'
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
  private.current_editorial_role(),
  null::text,
  'an inactive membership grants no editorial role'
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
  private.current_editorial_role(),
  'contributor',
  'an active Contributor receives the Contributor role'
);
select extensions.lives_ok(
  $$insert into public.stories (title, slug, summary, body)
    values ('Contributor Story', 'contributor-story', 'Summary', 'Body')$$,
  'a Contributor can create a draft Story'
);
select extensions.lives_ok(
  $$update public.stories set summary = 'Updated summary'
    where slug = 'contributor-story' and lock_version = 1$$,
  'a Contributor can update their own draft with an expected version'
);
select extensions.is(
  (select lock_version from public.stories where slug = 'contributor-story'),
  2,
  'an accepted edit increments lock_version'
);
select extensions.is(
  (
    select count(source_id)
    from public.source_private_details
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
    from public.stories
    where slug = 'contributor-story'$$,
  'a Contributor can submit their own Story for review'
);
select extensions.throws_ok(
  $$select public.transition_story_status(
      id,
      'approved',
      lock_version
    )
    from public.stories
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
  private.current_editorial_role(),
  'editor',
  'an active Editor receives the Editor role'
);
select extensions.lives_ok(
  $$select public.transition_story_status(
      id,
      'approved',
      lock_version
    )
    from public.stories
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
    from public.stories
    where slug = 'contributor-story'$$,
  '42501',
  'Confirmed Publisher aal2 session required',
  'an Editor cannot publish a Story'
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
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',
  true
);
set local role authenticated;

select extensions.is(
  private.current_editorial_role(),
  'publisher',
  'an active Publisher receives the Publisher role'
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
select extensions.lives_ok(
  $$select public.transition_story_status(
      '20000000-0000-0000-0000-000000000006',
      'archived',
      2,
      null,
      true
    )$$,
  'a confirmed aal2 Publisher can archive a published Story'
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
