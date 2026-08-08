-- Phase A RPC privilege remediation.
--
-- Production creates migration functions as postgres. Supabase's postgres
-- default ACL for new functions in public explicitly includes anon, so a
-- REVOKE FROM PUBLIC alone does not remove anonymous EXECUTE privileges.

-- Future public-schema functions owned by postgres must opt anon in
-- explicitly. Keep the existing authenticated and service_role defaults;
-- individual migrations must still apply their intended least-privilege ACL.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

-- Public read-only RLS helpers. These return only public-visibility or
-- authorization booleans and are required by existing public/editorial read
-- policies. They expose no mutation path or private record data.
revoke all on function private.has_editorial_role(text)
  from public, anon, authenticated;
revoke all on function private.can_read_source_private(uuid)
  from public, anon, authenticated;
revoke all on function private.source_is_public(uuid)
  from public, anon, authenticated;
revoke all on function private.story_is_public(uuid)
  from public, anon, authenticated;
revoke all on function private.place_is_public(uuid)
  from public, anon, authenticated;
revoke all on function private.theme_is_public(uuid)
  from public, anon, authenticated;

grant execute on function private.has_editorial_role(text)
  to anon, authenticated;
grant execute on function private.can_read_source_private(uuid)
  to anon, authenticated;
grant execute on function private.source_is_public(uuid)
  to anon, authenticated;
grant execute on function private.story_is_public(uuid)
  to anon, authenticated;
grant execute on function private.place_is_public(uuid)
  to anon, authenticated;
grant execute on function private.theme_is_public(uuid)
  to anon, authenticated;

-- Authenticated editorial RPC entry points. Authentication grants EXECUTE
-- only; every function continues to enforce membership, role, assurance,
-- confirmation, concurrency, and audit attribution inside the function.
revoke all on function public.transition_story_status(
  uuid, text, integer, timestamptz, boolean
) from public, anon, authenticated;
revoke all on function public.soft_delete_entity(text, uuid, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.restore_soft_deleted_entity(
  text, uuid, integer, boolean
) from public, anon, authenticated;
revoke all on function public.restore_editorial_revision(bigint, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.restore_relationship_revision(bigint, boolean)
  from public, anon, authenticated;
revoke all on function public.set_theme_active(uuid, boolean, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.create_editorial_entity(text, jsonb)
  from public, anon, authenticated;
revoke all on function public.update_editorial_entity(
  text, uuid, integer, jsonb, boolean
) from public, anon, authenticated;
revoke all on function public.update_source_private_details(
  uuid, integer, jsonb, boolean
) from public, anon, authenticated;
revoke all on function public.create_story_relationship(
  text, uuid, uuid, jsonb, boolean
) from public, anon, authenticated;
revoke all on function public.update_story_relationship(
  text, uuid, uuid, integer, jsonb, boolean
) from public, anon, authenticated;
revoke all on function public.delete_story_relationship(
  text, uuid, uuid, integer, boolean
) from public, anon, authenticated;

grant execute on function public.transition_story_status(
  uuid, text, integer, timestamptz, boolean
) to authenticated;
grant execute on function public.soft_delete_entity(text, uuid, integer, boolean)
  to authenticated;
grant execute on function public.restore_soft_deleted_entity(
  text, uuid, integer, boolean
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

-- Internal/security helpers. Only their postgres owner may enter them.
revoke all on function private.current_editorial_role()
  from public, anon, authenticated;
revoke all on function private.publisher_has_aal2()
  from public, anon, authenticated;
revoke all on function private.can_update_story(uuid)
  from public, anon, authenticated;
revoke all on function private.can_manage_story_relationship(uuid)
  from public, anon, authenticated;
revoke all on function private.source_requires_publication_assurance(uuid)
  from public, anon, authenticated;
revoke all on function private.can_update_source(uuid)
  from public, anon, authenticated;
revoke all on function private.set_editorial_audit_operation(text)
  from public, anon, authenticated;

-- Trigger-only functions. Application roles never call them directly.
revoke all on function private.set_entity_metadata()
  from public, anon, authenticated;
revoke all on function private.set_relationship_metadata()
  from public, anon, authenticated;
revoke all on function private.capture_editorial_revision()
  from public, anon, authenticated;
