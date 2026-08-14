-- Public map projection and coordinate-privacy boundary.
--
-- Public Place pages do not need direct coordinate access. Keep raw coordinates
-- available to the protected editorial view, while the public map receives only
-- values generalized to the editorially selected precision.

revoke select (latitude, longitude) on table public.places
  from anon, authenticated;

create function public.get_public_map_places()
returns table (
  id uuid,
  name text,
  slug text,
  place_type text,
  country_code text,
  location_precision text,
  latitude numeric,
  longitude numeric
)
language sql
stable
security definer
set search_path = ''
as $$
select
  p.id,
  p.name,
  p.slug,
  p.place_type,
  p.country_code,
  p.location_precision,
  case p.location_precision
    when 'exact' then p.latitude
    when 'neighborhood' then pg_catalog.round(p.latitude, 2)
    when 'city' then pg_catalog.round(p.latitude, 1)
    when 'region' then pg_catalog.round(p.latitude, 0)
  end as latitude,
  case p.location_precision
    when 'exact' then p.longitude
    when 'neighborhood' then pg_catalog.round(p.longitude, 2)
    when 'city' then pg_catalog.round(p.longitude, 1)
    when 'region' then pg_catalog.round(p.longitude, 0)
  end as longitude
from public.places as p
where p.deleted_at is null
  and p.latitude is not null
  and p.longitude is not null
  and p.location_precision in ('exact', 'neighborhood', 'city', 'region')
  and exists (
    select 1
    from public.story_places as sp
    join public.stories as s on s.id = sp.story_id
    where sp.place_id = p.id
      and s.status = 'published'
      and s.published_at <= pg_catalog.now()
      and s.deleted_at is null
  )
$$;

revoke all on function public.get_public_map_places()
  from public, anon, authenticated;
grant execute on function public.get_public_map_places()
  to anon, authenticated;
