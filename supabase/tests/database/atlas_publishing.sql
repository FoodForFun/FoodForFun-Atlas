begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_column('public', 'stories', 'title_zh', 'Stories store a Chinese title');
select extensions.has_column('public', 'stories', 'body_zh', 'Stories store an independent Chinese body');
select extensions.has_column('public', 'stories', 'tags', 'Stories store discovery tags');
select extensions.has_column('public', 'places', 'street_address', 'Places store structured street addresses');
select extensions.has_column('public', 'places', 'postal_code', 'Places store postal codes');

select extensions.is(
  pg_catalog.has_column_privilege('anon', 'public.stories', 'body_zh', 'select'),
  true,
  'anonymous readers may read published Chinese Story content through RLS'
);
select extensions.is(
  pg_catalog.has_column_privilege('anon', 'public.places', 'street_address', 'select'),
  false,
  'anonymous readers cannot bypass location precision through street addresses'
);
select extensions.is(
  pg_catalog.has_function_privilege('anon', 'public.import_approved_atlas_package(jsonb)', 'execute'),
  false,
  'anonymous callers cannot import approved Atlas packages'
);
select extensions.is(
  pg_catalog.has_function_privilege('authenticated', 'public.import_approved_atlas_package(jsonb)', 'execute'),
  true,
  'authenticated callers reach the role-enforcing import RPC'
);

select extensions.throws_ok(
  $$
    insert into public.stories (title, slug, summary, body, tags)
    values ('Invalid tags', 'invalid-tags', 'Summary', 'Body', array[' '])
  $$,
  '23514',
  null,
  'blank Story tags are rejected by the database'
);

insert into public.stories (
  id, title, title_zh, slug, summary, summary_zh, body, body_zh, tags
) values (
  '91000000-0000-0000-0000-000000000001',
  'Incomplete publication',
  '不完整发布',
  'incomplete-publication',
  'Summary',
  '摘要',
  'Body',
  '正文',
  array['food']
);

select extensions.throws_ok(
  $$
    update public.stories
    set status = 'published', published_at = pg_catalog.now()
    where id = '91000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  'A primary Place is required before publishing',
  'publication fails closed until structured Atlas relationships are complete'
);

select * from extensions.finish();
rollback;
