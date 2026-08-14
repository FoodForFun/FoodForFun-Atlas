"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  getSafeSourceMutationError,
  getSourceCapabilities,
  isSourceId,
  type SourceMetadataInput,
  type SourcePrivateInput,
  validateSourceMetadataInput,
  validateSourcePrivateInput,
} from "@/app/_lib/editorial/source";
import {
  findDuplicateSourcesWithClient,
  getEditorialSourceWithClient,
} from "@/app/_lib/editorial/sources-server";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import type {
  SourceMetadataActionState,
  SourcePrivateActionState,
} from "@/app/admin/sources/action-state";

const metadataFields = [
  "source_type",
  "original_title",
  "source_url",
  "external_id",
  "publisher",
  "original_published_at",
  "original_language",
  "original_description",
  "availability_status",
] as const satisfies ReadonlyArray<keyof SourceMetadataInput>;

const privateFields = [
  "raw_transcript",
  "cleaned_transcript",
  "transcript_quality",
  "processing_status",
  "rights_status",
  "rights_note",
  "internal_note",
] as const satisfies ReadonlyArray<keyof SourcePrivateInput>;

function readRawFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readFormValue(formData: FormData, name: string) {
  return readRawFormValue(formData, name).trim();
}

function readLockVersion(formData: FormData, name: string) {
  const value = Number(readFormValue(formData, name));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function readMetadataInput(formData: FormData) {
  return Object.fromEntries(
    metadataFields.map((field) => [field, readRawFormValue(formData, field)]),
  ) as SourceMetadataInput;
}

function readPrivateInput(formData: FormData) {
  return Object.fromEntries(
    privateFields.map((field) => [field, readRawFormValue(formData, field)]),
  ) as SourcePrivateInput;
}

function metadataErrorState(
  message: string,
  fieldErrors: SourceMetadataActionState["fieldErrors"] = {},
): SourceMetadataActionState {
  return { fieldErrors, message, status: "error" };
}

function privateErrorState(
  message: string,
  fieldErrors: SourcePrivateActionState["fieldErrors"] = {},
): SourcePrivateActionState {
  return { fieldErrors, message, status: "error" };
}

function getReturnedId(data: unknown, field: "entity_id" | "source_id") {
  if (!Array.isArray(data) || data.length !== 1) return null;
  const row = data[0];
  if (!row || typeof row !== "object") return null;
  const value = (row as Record<string, unknown>)[field];
  return typeof value === "string" && isSourceId(value) ? value : null;
}

function duplicateState(count: number): SourceMetadataActionState {
  return {
    fieldErrors: {},
    message: `${count} possible duplicate Source${count === 1 ? "" : "s"} matched this URL or the same type and external ID. Review the existing Sources before explicitly confirming a separate record.`,
    status: "duplicate",
  };
}

function refreshSourcePaths(sourceId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${sourceId}`);
  revalidatePath("/");
  revalidatePath("/stories");
}

export async function createSourceAction(
  _state: SourceMetadataActionState,
  formData: FormData,
): Promise<SourceMetadataActionState> {
  void _state;
  await requireEditorialAccess("/admin/sources/new");
  const validated = validateSourceMetadataInput(readMetadataInput(formData));

  if (!validated.data) {
    return metadataErrorState(
      "Review the highlighted Source fields before creating the record.",
      validated.errors,
    );
  }

  let sourceId: string | null = null;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const duplicates = await findDuplicateSourcesWithClient(
      supabase,
      validated.data,
    );

    if (duplicates.error) {
      return metadataErrorState(
        "Possible duplicate Sources could not be checked. No Source was created.",
      );
    }

    const duplicateConfirmed =
      readFormValue(formData, "confirm_duplicate") === "confirm-duplicate";
    if (duplicates.data.length > 0 && !duplicateConfirmed) {
      return duplicateState(duplicates.data.length);
    }

    const { data, error } = await supabase.rpc("create_editorial_entity", {
      payload: validated.data,
      target_entity_type: "sources",
    });

    if (error) {
      return metadataErrorState(getSafeSourceMutationError(error).message);
    }

    sourceId = getReturnedId(data, "entity_id");
  } catch {
    return metadataErrorState(
      "The Source could not be created. Your entered text remains here.",
    );
  }

  if (!sourceId) {
    return metadataErrorState("The created Source could not be verified.");
  }

  refreshSourcePaths(sourceId);
  redirect(`/admin/sources/${sourceId}?status=created`, RedirectType.replace);
}

export async function updateSourceMetadataAction(
  _state: SourceMetadataActionState,
  formData: FormData,
): Promise<SourceMetadataActionState> {
  void _state;
  const sourceId = readFormValue(formData, "source_id");
  const expectedLockVersion = readLockVersion(
    formData,
    "metadata_lock_version",
  );

  if (!isSourceId(sourceId) || !expectedLockVersion) {
    return metadataErrorState(
      "The Source metadata context is invalid. Reload the editor.",
    );
  }

  const access = await requireEditorialAccess(`/admin/sources/${sourceId}`);
  const validated = validateSourceMetadataInput(readMetadataInput(formData));
  if (!validated.data) {
    return metadataErrorState(
      "Review the highlighted Source fields before saving.",
      validated.errors,
    );
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const record = await getEditorialSourceWithClient(supabase, sourceId);
    if (!record) {
      return metadataErrorState(
        "The Source is no longer available to this account.",
      );
    }

    const capabilities = getSourceCapabilities({
      aal: access.identity.aal,
      requiresPublicationAssurance: record.requiresPublicationAssurance,
      role: access.role,
      source: record.source,
      userId: access.identity.userId,
    });
    if (!capabilities.canEditMetadata) {
      return metadataErrorState(
        "Your current role, ownership, or session assurance does not permit this edit.",
      );
    }

    const publicEditConfirmed =
      !record.requiresPublicationAssurance ||
      readFormValue(formData, "confirm_public_source_edit") ===
        "confirm-public-source-edit";
    if (!publicEditConfirmed) {
      return metadataErrorState(
        "Confirm that this published or scheduled Source correction may affect public Stories.",
      );
    }

    const duplicates = await findDuplicateSourcesWithClient(
      supabase,
      validated.data,
      sourceId,
    );
    if (duplicates.error) {
      return metadataErrorState(
        "Possible duplicate Sources could not be checked. No changes were saved.",
      );
    }

    const duplicateConfirmed =
      readFormValue(formData, "confirm_duplicate") === "confirm-duplicate";
    if (duplicates.data.length > 0 && !duplicateConfirmed) {
      return duplicateState(duplicates.data.length);
    }

    const { data, error } = await supabase.rpc("update_editorial_entity", {
      changes: validated.data,
      confirmed: record.requiresPublicationAssurance,
      expected_lock_version: expectedLockVersion,
      target_entity_id: sourceId,
      target_entity_type: "sources",
    });

    if (error) {
      return metadataErrorState(getSafeSourceMutationError(error).message);
    }

    if (getReturnedId(data, "entity_id") !== sourceId) {
      return metadataErrorState("The Source save result could not be verified.");
    }
  } catch {
    return metadataErrorState(
      "The Source could not be saved. Your entered text remains here.",
    );
  }

  refreshSourcePaths(sourceId);
  redirect(`/admin/sources/${sourceId}?status=saved`, RedirectType.replace);
}

export async function updateSourcePrivateDetailsAction(
  _state: SourcePrivateActionState,
  formData: FormData,
): Promise<SourcePrivateActionState> {
  void _state;
  const sourceId = readFormValue(formData, "source_id");
  const expectedLockVersion = readLockVersion(formData, "private_lock_version");

  if (!isSourceId(sourceId) || !expectedLockVersion) {
    return privateErrorState(
      "The private Source context is invalid. Reload the editor.",
    );
  }

  const access = await requireEditorialAccess(`/admin/sources/${sourceId}`);
  const validated = validateSourcePrivateInput(readPrivateInput(formData));
  if (!validated.data) {
    return privateErrorState(
      "Review the highlighted private Source fields before saving.",
      validated.errors,
    );
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const record = await getEditorialSourceWithClient(supabase, sourceId);
    if (!record) {
      return privateErrorState(
        "The Source is no longer available to this account.",
      );
    }

    const capabilities = getSourceCapabilities({
      aal: access.identity.aal,
      requiresPublicationAssurance: record.requiresPublicationAssurance,
      role: access.role,
      source: record.source,
      userId: access.identity.userId,
    });
    if (!capabilities.canEditPrivateDetails) {
      return privateErrorState(
        "Your current role, ownership, or session assurance does not permit this private edit.",
      );
    }

    const publicEditConfirmed =
      !record.requiresPublicationAssurance ||
      readFormValue(formData, "confirm_public_source_edit") ===
        "confirm-public-source-edit";
    if (!publicEditConfirmed) {
      return privateErrorState(
        "Confirm that this rights or transcript review may affect public Story publication checks.",
      );
    }

    const { data, error } = await supabase.rpc(
      "update_source_private_details",
      {
        changes: validated.data,
        confirmed: record.requiresPublicationAssurance,
        expected_lock_version: expectedLockVersion,
        target_source_id: sourceId,
      },
    );

    if (error) {
      return privateErrorState(getSafeSourceMutationError(error).message);
    }

    if (getReturnedId(data, "source_id") !== sourceId) {
      return privateErrorState(
        "The private Source save result could not be verified.",
      );
    }
  } catch {
    return privateErrorState(
      "The private Source details could not be saved. Your entered text remains here.",
    );
  }

  refreshSourcePaths(sourceId);
  redirect(
    `/admin/sources/${sourceId}?status=private-saved`,
    RedirectType.replace,
  );
}
