import type { EditorialRole } from "../auth/membership";

export type EditorialTheme = {
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
  description: string | null;
  id: string;
  is_active: boolean;
  lock_version: number;
  name: string;
  slug: string;
  theme_group: string | null;
  updated_at: string;
};

export type ThemeInput = {
  description: string;
  name: string;
  slug: string;
  theme_group: string;
};

export type ValidatedThemeInput = {
  description: string | null;
  name: string;
  slug: string;
  theme_group: string | null;
};

export type ThemeFieldErrors = Partial<Record<keyof ThemeInput, string>>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function boundedRequired(value: string, label: string, maximum: number) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  return trimmed.length > maximum
    ? `${label} must be ${maximum.toLocaleString("en")} characters or fewer.`
    : null;
}

function boundedOptional(value: string, label: string, maximum: number) {
  return value.trim().length > maximum
    ? `${label} must be ${maximum.toLocaleString("en")} characters or fewer.`
    : null;
}

export function isThemeId(value: string) {
  return uuidPattern.test(value);
}

export function validateThemeInput(input: ThemeInput):
  | { data: ValidatedThemeInput; errors: ThemeFieldErrors }
  | { data: null; errors: ThemeFieldErrors } {
  const errors: ThemeFieldErrors = {};
  const nameError = boundedRequired(input.name, "Theme name", 200);
  const slugError = boundedRequired(input.slug, "Theme slug", 200);
  const descriptionError = boundedOptional(
    input.description,
    "Description",
    10_000,
  );
  const groupError = boundedOptional(input.theme_group, "Theme group", 200);
  if (nameError) errors.name = nameError;
  if (slugError) errors.slug = slugError;
  if (descriptionError) errors.description = descriptionError;
  if (groupError) errors.theme_group = groupError;

  const slug = input.slug.trim().toLowerCase();
  if (slug && !slugPattern.test(slug)) {
    errors.slug =
      "Use lowercase letters and numbers separated by single hyphens.";
  }

  if (Object.keys(errors).length > 0) return { data: null, errors };
  return {
    data: {
      description: optionalValue(input.description),
      name: input.name.trim(),
      slug,
      theme_group: optionalValue(input.theme_group),
    },
    errors,
  };
}

export function canCreateThemes(role: EditorialRole) {
  return role === "editor" || role === "publisher";
}

export function getThemeCapabilities({
  aal,
  role,
  theme,
}: {
  aal: "aal1" | "aal2";
  role: EditorialRole;
  theme: EditorialTheme;
}) {
  const canEdit = !theme.deleted_at && canCreateThemes(role);
  return {
    canDeactivate: canEdit && theme.is_active,
    canEdit,
    canReactivate:
      canEdit && !theme.is_active && role === "publisher" && aal === "aal2",
    reactivationRequiresAal2: !theme.is_active,
  };
}

export type ThemeMutationError = { code?: string; message?: string };

export function getSafeThemeMutationError(error: ThemeMutationError) {
  if (error.code === "40001") {
    return "This Theme changed after you opened it. Reload before trying again.";
  }
  if (error.code === "23505") {
    return "A Theme with this slug already exists.";
  }
  if (error.code === "42501") {
    return "Your current role or session assurance does not permit this Theme action.";
  }
  if (error.code === "23514" || error.code === "22023") {
    return "The Theme did not pass the database validation checks.";
  }
  if (error.code === "P0002" || error.code === "55000") {
    return "The Theme is no longer available for this action.";
  }
  return "The Theme could not be saved. No unverified result was accepted.";
}
