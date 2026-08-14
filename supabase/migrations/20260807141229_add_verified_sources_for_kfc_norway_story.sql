do $migration$
declare
  target_story_id uuid;
  target_source_id uuid;
  source_record record;
begin
  select id
  into target_story_id
  from public.stories
  where slug = 'why-kfc-stayed-out-of-norway'
    and status = 'published'
    and published_at <= now();

  if target_story_id is null then
    raise notice 'Published KFC Norway Story was not found; skipping verified Source attachment';
    return;
  end if;

  for source_record in
    select *
    from (
      values
        (
          'press_release'::text,
          'Apollo Group will expand to the Norwegian market with the KFC franchise'::text,
          'https://view.news.eu.nasdaq.com/view?id=bfe472049ebe1db5522ebe26a0ea3942c&lang=en&src=listed'::text,
          'Apollo Group'::text,
          '2026-07-27 08:31:26+00'::timestamptz,
          'en'::text,
          'AVAILABLE'::text
        ),
        (
          'government_guidance'::text,
          'Import duties for agricultural products'::text,
          'https://www.regjeringen.no/en/topics/food-fisheries-and-agriculture/jordbruk/innsikt/handel-med-jordbruksprodukt/importvernet-for-jordbruksvarer/id2364459/'::text,
          'Norwegian Ministry of Agriculture and Food'::text,
          '2021-09-08 00:00:00+00'::timestamptz,
          'en'::text,
          'AVAILABLE'::text
        ),
        (
          'government_notice'::text,
          'Nedsatt tollavgiftssats for kylling'::text,
          'https://www.landbruksdirektoratet.no/nb/nyhetsrom/nyhetsarkiv/nedsatt-tollavgiftssats-for-kylling'::text,
          'Norwegian Agriculture Agency'::text,
          '2026-06-18 00:00:00+00'::timestamptz,
          'nb'::text,
          'AVAILABLE'::text
        ),
        (
          'government_guidance'::text,
          'Commercial import of foodstuff to Norway'::text,
          'https://www.mattilsynet.no/en/food-and-beverages/commercial-import-of-foodstuff-to-norway?noJS=true'::text,
          'Norwegian Food Safety Authority'::text,
          null::timestamptz,
          'en'::text,
          'AVAILABLE'::text
        )
    ) as source_metadata(
      source_type,
      original_title,
      source_url,
      publisher,
      original_published_at,
      original_language,
      availability_status
    )
  loop
    select id
    into target_source_id
    from public.sources
    where source_url = source_record.source_url
    order by created_at, id
    limit 1;

    if target_source_id is null then
      insert into public.sources (
        source_type,
        original_title,
        source_url,
        publisher,
        original_published_at,
        original_language,
        availability_status
      )
      values (
        source_record.source_type,
        source_record.original_title,
        source_record.source_url,
        source_record.publisher,
        source_record.original_published_at,
        source_record.original_language,
        source_record.availability_status
      )
      returning id into target_source_id;
    end if;

    insert into public.story_sources (story_id, source_id)
    values (target_story_id, target_source_id)
    on conflict (story_id, source_id) do nothing;
  end loop;
end;
$migration$;
