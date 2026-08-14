"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  canCreateThemes,
  getSafeThemeMutationError,
  getThemeCapabilities,
  isThemeId,
  type ThemeInput,
  validateThemeInput,
} from "@/app/_lib/editorial/theme";
import {
  findDuplicateThemesWithClient,
  getEditorialThemeWithClient,
} from "@/app/_lib/editorial/themes-server";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import type { ThemeActionState } from "@/app/admin/themes/action-state";

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readThemeInput(formData: FormData): ThemeInput {
  return {
    description: readFormValue(formData, "description"),
    name: readFormValue(formData, "name"),
    slug: readFormValue(formData, "slug"),
    theme_group: readFormValue(formData, "theme_group"),
  };
}

function readLockVersion(formData: FormData) {
  const value = Number(readFormValue(formData, "lock_version"));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function errorState(
  message: string,
  fieldErrors: ThemeActionState["fieldErrors"] = {},
): ThemeActionState {
  return { fieldErrors, message, status: "error" };
}

function duplicateState(count: number): ThemeActionState {
  return {
    fieldErrors: {},
    message: `${count} possible duplicate Theme${count === 1 ? "" : "s"} matched this name or slug. Review existing Themes before explicitly confirming a separate record.`,
    status: "duplicate",
  };
}

function getReturnedThemeId(data: unknown, field = "entity_id") {
  if (!Array.isArray(data) || data.length !== 1) return null;
  const row = data[0];
  if (!row || typeof row !== "object") return null;
  const value = (row as Record<string, unknown>)[field];
  return typeof value === "string" && isThemeId(value) ? value : null;
}

function verifyThemeStateResult(data: unknown, themeId: string, active: boolean) {
  if (!Array.isArray(data) || data.length !== 1) return false;
  const row = data[0];
  if (!row || typeof row !== "object") return false;
  const value = row as Record<string, unknown>;
  return (
    value.theme_id === themeId &&
    value.is_active === active &&
    typeof value.lock_version === "number"
  );
}

function refreshThemePaths(themeId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/themes");
  revalidatePath(`/admin/themes/${themeId}`);
  revalidatePath("/");
  revalidatePath("/themes");
  if (slug) revalidatePath(`/themes/${slug}`);
  revalidatePath("/stories");
  revalidatePath("/search");
}

export async function createThemeAction(
  _state: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/themes/new");
  if (!canCreateThemes(access.role)) {
    return errorState("An Editor or Publisher role is required to create Themes.");
  }
  const validated = validateThemeInput(readThemeInput(formData));
  if (!validated.data) {
    return errorState("Review the highlighted Theme fields.", validated.errors);
  }

  let themeId: string | null = null;
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const duplicates = await findDuplicateThemesWithClient(supabase, validated.data);
    if (duplicates.error) {
      return errorState("Possible duplicate Themes could not be checked. No Theme was created.");
    }
    const duplicateConfirmed =
      readFormValue(formData, "confirm_duplicate") === "confirm-duplicate";
    if (duplicates.data.length > 0 && !duplicateConfirmed) {
      return duplicateState(duplicates.data.length);
    }
    const { data, error } = await supabase.rpc("create_editorial_entity", {
      payload: validated.data,
      target_entity_type: "themes",
    });
    if (error) return errorState(getSafeThemeMutationError(error));
    themeId = getReturnedThemeId(data);
  } catch {
    return errorState("The Theme could not be created. Your entered text remains here.");
  }
  if (!themeId) return errorState("The created Theme could not be verified.");
  refreshThemePaths(themeId, validated.data.slug);
  redirect(`/admin/themes/${themeId}?status=created`, RedirectType.replace);
}

export async function updateThemeAction(
  _state: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  void _state;
  const themeId = readFormValue(formData, "theme_id");
  const lockVersion = readLockVersion(formData);
  if (!isThemeId(themeId) || !lockVersion) {
    return errorState("The Theme edit context is invalid. Reload the editor.");
  }
  const access = await requireEditorialAccess(`/admin/themes/${themeId}`);
  const validated = validateThemeInput(readThemeInput(formData));
  if (!validated.data) {
    return errorState("Review the highlighted Theme fields.", validated.errors);
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const theme = await getEditorialThemeWithClient(supabase, themeId);
    if (!theme) return errorState("The Theme is no longer available.");
    const capabilities = getThemeCapabilities({
      aal: access.identity.aal,
      role: access.role,
      theme,
    });
    if (!capabilities.canEdit) {
      return errorState("Your current role does not permit editing this Theme.");
    }
    const duplicates = await findDuplicateThemesWithClient(
      supabase,
      validated.data,
      themeId,
    );
    if (duplicates.error) {
      return errorState("Possible duplicate Themes could not be checked. No changes were saved.");
    }
    const duplicateConfirmed =
      readFormValue(formData, "confirm_duplicate") === "confirm-duplicate";
    if (duplicates.data.length > 0 && !duplicateConfirmed) {
      return duplicateState(duplicates.data.length);
    }
    const { data, error } = await supabase.rpc("update_editorial_entity", {
      changes: validated.data,
      confirmed: false,
      expected_lock_version: lockVersion,
      target_entity_id: themeId,
      target_entity_type: "themes",
    });
    if (error) return errorState(getSafeThemeMutationError(error));
    if (getReturnedThemeId(data) !== themeId) {
      return errorState("The Theme save result could not be verified.");
    }
  } catch {
    return errorState("The Theme could not be saved. Your entered text remains here.");
  }
  refreshThemePaths(themeId, validated.data.slug);
  redirect(`/admin/themes/${themeId}?status=saved`, RedirectType.replace);
}

export async function setThemeActiveAction(
  _state: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  void _state;
  const themeId = readFormValue(formData, "theme_id");
  const lockVersion = readLockVersion(formData);
  const nextActive = readFormValue(formData, "next_active");
  if (
    !isThemeId(themeId) ||
    !lockVersion ||
    (nextActive !== "true" && nextActive !== "false")
  ) {
    return errorState("The Theme state context is invalid. Reload the editor.");
  }
  const active = nextActive === "true";
  const access = await requireEditorialAccess(`/admin/themes/${themeId}`);
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const theme = await getEditorialThemeWithClient(supabase, themeId);
    if (!theme || theme.is_active === active) {
      return errorState("The Theme state changed. Reload the editor.");
    }
    const capabilities = getThemeCapabilities({
      aal: access.identity.aal,
      role: access.role,
      theme,
    });
    if ((active && !capabilities.canReactivate) || (!active && !capabilities.canDeactivate)) {
      return errorState("Your current role or session assurance does not permit this Theme state change.");
    }
    const stateChangeConfirmed =
      readFormValue(formData, "confirm_state_change") === "confirm-state-change";
    if (!stateChangeConfirmed) {
      return errorState(`Confirm this Theme ${active ? "reactivation" : "deactivation"}.`);
    }
    const { data, error } = await supabase.rpc("set_theme_active", {
      active,
      confirmed: active,
      expected_lock_version: lockVersion,
      target_theme_id: themeId,
    });
    if (error) return errorState(getSafeThemeMutationError(error));
    if (!verifyThemeStateResult(data, themeId, active)) {
      return errorState("The Theme state result could not be verified.");
    }
    refreshThemePaths(themeId, theme.slug);
  } catch {
    return errorState("The Theme state could not be changed.");
  }
  redirect(
    `/admin/themes/${themeId}?status=${active ? "reactivated" : "deactivated"}`,
    RedirectType.replace,
  );
}
