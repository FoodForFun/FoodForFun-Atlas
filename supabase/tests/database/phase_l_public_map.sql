begin;

create extension if not exists pgtap with schema extensions;

select extensions.no_plan();

insert into public.stories (id, title, slug, summary, body, status, published_at)
values
  (
    '82000000-0000-0000-0000-000000000001',
    'Public Map Story',
    'public-map-story',
    'Published map fixture.',
    'Published body.',
    'published',
    pg_catalog.now() - interval '1 day'
  ),
  (
    '82000000-0000-0000-0000-000000000002',
    'Draft Map Story',
    'draft-map-story',
    'Draft map fixture.',
    'Draft body.',
    'draft',
    null
  );

insert into public.places (
  id,
  name,
  slug,
  latitude,
  longitude,
  location_precision
)
values
  (
    '83000000-0000-0000-0000-000000000001',
    'Exact Map Place',
    'exact-map-place',
    59.913900,
    10.752200,
    'exact'
  ),
  (
    '83000000-0000-0000-0000-000000000002',
    'Neighborhood Map Place',
    'neighborhood-map-place',
    59.913900,
    10.752200,
    'neighborhood'
  ),
  (
    '83000000-0000-0000-0000-000000000003',
    'City Map Place',
    'city-map-place',
    59.913900,
    10.752200,
    'city'
  ),
  (
    '83000000-0000-0000-0000-000000000004',
    'Region Map Place',
    'region-map-place',
    59.913900,
    10.752200,
    'region'
  ),
  (
    '83000000-0000-0000-0000-000000000005',
    'Hidden Map Place',
    'hidden-map-place',
    null,
    null,
    'hidden'
  ),
  (
    '83000000-0000-0000-0000-000000000006',
    'Draft-only Map Place',
    'draft-only-map-place',
    59.913900,
    10.752200,
    'city'
  );

insert into public.story_places (story_id, place_id)
values
  ('82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000001'),
  ('82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002'),
  ('82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000003'),
  ('82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000004'),
  ('82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000005'),
  ('82000000-0000-0000-0000-000000000002', '83000000-0000-0000-0000-000000000006');

select extensions.is(
  pg_catalog.has_column_privilege('anon', 'public.places', 'latitude', 'select'),
  false,
  'anonymous callers cannot read raw Place latitude'
);
select extensions.is(
  pg_catalog.has_column_privilege('anon', 'public.places', 'longitude', 'select'),
  false,
  'anonymous callers cannot read raw Place longitude'
);
select extensions.is(
  pg_catalog.has_column_privilege(
    'authenticated',
    'public.places',
    'latitude',
    'select'
  ),
  false,
  'authentication alone cannot read raw Place latitude'
);
select extensions.is(
  pg_catalog.has_function_privilege(
    'anon',
    'public.get_public_map_places()',
    'execute'
  ),
  true,
  'anonymous callers may execute the safe public map projection'
);

set local role anon;

select extensions.throws_ok(
  'select latitude from public.places limit 1',
  '42501',
  'permission denied for table places',
  'raw coordinates cannot be bypassed through the Place table'
);
select extensions.is(
  (select count(*) from public.get_public_map_places()),
  4::bigint,
  'the public map includes only located Places attached to a published Story'
);
select extensions.is(
  (
    select latitude
    from public.get_public_map_places()
    where slug = 'exact-map-place'
  ),
  59.913900::numeric,
  'exact precision retains the approved public latitude'
);
select extensions.is(
  (
    select latitude
    from public.get_public_map_places()
    where slug = 'neighborhood-map-place'
  ),
  59.91::numeric,
  'neighborhood precision rounds latitude to two decimals'
);
select extensions.is(
  (
    select longitude
    from public.get_public_map_places()
    where slug = 'city-map-place'
  ),
  10.8::numeric,
  'city precision rounds longitude to one decimal'
);
select extensions.is(
  (
    select latitude
    from public.get_public_map_places()
    where slug = 'region-map-place'
  ),
  60::numeric,
  'region precision rounds latitude to a whole degree'
);
select extensions.is(
  (
    select count(*)
    from public.get_public_map_places()
    where slug in ('hidden-map-place', 'draft-only-map-place')
  ),
  0::bigint,
  'hidden and unpublished-only locations never enter the public map contract'
);

reset role;

select * from extensions.finish();

rollback;
