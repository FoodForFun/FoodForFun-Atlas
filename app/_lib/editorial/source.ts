import type { EditorialRole } from "../auth/membership";

export const sourceAvailabilityStatuses = [
  "unknown",
  "available",
  "temporarily_unavailable",
  "unavailable",
  "removed",
  "archived",
] as const;

export const sourceTranscriptQualities = [
  "unreviewed",
  "machine_generated",
  "human_reviewed",
  "verified",
] as const;

export const sourceProcessingStatuses = [
  "pending",
  "processing",
  "ready",
  "failed",
  "not_required",
] as const;

export const sourceRightsStatuses = [
  "unreviewed",
  "permission_required",
  "permission_granted",
  "licensed",
  "public_domain",
  "fair_use",
  "cleared",
  "restricted",
] as const;

export type SourceAvailabilityStatus =
  (typeof sourceAvailabilityStatuses)[number];
export type SourceTranscriptQuality =
  (typeof sourceTranscriptQualities)[number];
export type SourceProcessingStatus =
  (typeof sourceProcessingStatuses)[number];
export type SourceRightsStatus = (typeof sourceRightsStatuses)[number];

export type EditorialSource = {
  availability_status: SourceAvailabilityStatus | null;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
  external_id: string | null;
  id: string;
  lock_version: number;
  original_description: string | null;
  original_language: string | null;
  original_published_at: string | null;
  original_title: string | null;
  publisher: string | null;
  source_type: string;
  source_url: string | null;
  updated_at: string;
};

export type EditorialSourcePrivateDetails = {
  cleaned_transcript: string | null;
  internal_note: string | null;
  lock_version: number;
  processing_status: SourceProcessingStatus;
  raw_transcript: string | null;
  rights_note: string | null;
  rights_status: SourceRightsStatus;
  source_id: string;
  transcript_quality: SourceTranscriptQuality | null;
  updated_at: string;
};

export type SourceMetadataInput = {
  availability_status: string;
  external_id: string;
  original_description: string;
  original_language: string;
  original_published_at: string;
  original_title: string;
  publisher: string;
  source_type: string;
  source_url: string;
};

export type ValidatedSourceMetadataInput = {
  availability_status: SourceAvailabilityStatus | null;
  external_id: string | null;
  original_description: string | null;
  original_language: string | null;
  original_published_at: string | null;
  original_title: string;
  publisher: string | null;
  source_type: string;
  source_url: string | null;
};

export type SourcePrivateInput = {
  cleaned_transcript: string;
  internal_note: string;
  processing_status: string;
  raw_transcript: string;
  rights_note: string;
  rights_status: string;
  transcript_quality: string;
};

export type ValidatedSourcePrivateInput = {
  cleaned_transcript: string | null;
  internal_note: string | null;
  processing_status: SourceProcessingStatus;
  raw_transcript: string | null;
  rights_note: string | null;
  rights_status: SourceRightsStatus;
  transcript_quality: SourceTranscriptQuality | null;
};

export type SourceMetadataFieldErrors = Partial<
  Record<keyof SourceMetadataInput, string>
>;
export type SourcePrivateFieldErrors = Partial<
  Record<keyof SourcePrivateInput, string>
>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sourceTypePattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

function getSafeHttpUrl(value: string | null) {
  if (!value || value.length > 2_048) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function parseUtcDateTimeInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ),
  );

  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute)
    ? date.toISOString()
    : null;
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function boundedRequired(
  value: string,
  label: string,
  maximum: number,
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${label} is required.`;
  }

  return trimmed.length > maximum
    ? `${label} must be ${maximum.toLocaleString("en")} characters or fewer.`
    : null;
}

function boundedOptional(value: string, label: string, maximum: number) {
  return value.trim().length > maximum
    ? `${label} must be ${maximum.toLocaleString("en")} characters or fewer.`
    : null;
}

function isListedValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.some((candidate) => candidate === value);
}

export function isSourceId(value: string) {
  return uuidPattern.test(value);
}

export function formatSourceStatus(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function validateSourceMetadataInput(input: SourceMetadataInput):
  | {
      data: ValidatedSourceMetadataInput;
      errors: SourceMetadataFieldErrors;
    }
  | { data: null; errors: SourceMetadataFieldErrors } {
  const errors: SourceMetadataFieldErrors = {};
  const requiredChecks = [
    ["source_type", "Source type", 100],
    ["original_title", "Original title", 500],
  ] as const;
  const optionalChecks = [
    ["source_url", "Source URL", 2_048],
    ["external_id", "External ID", 500],
    ["publisher", "Publisher", 500],
    ["original_language", "Original language", 100],
    ["original_description", "Original description", 20_000],
  ] as const;

  for (const [field, label, maximum] of requiredChecks) {
    const error = boundedRequired(input[field], label, maximum);
    if (error) errors[field] = error;
  }

  for (const [field, label, maximum] of optionalChecks) {
    const error = boundedOptional(input[field], label, maximum);
    if (error) errors[field] = error;
  }

  const sourceType = input.source_type.trim().toLowerCase();
  if (sourceType && !sourceTypePattern.test(sourceType)) {
    errors.source_type =
      "Use lowercase letters, numbers, and single underscores between words.";
  }

  const sourceUrlValue = optionalValue(input.source_url);
  const sourceUrl = sourceUrlValue ? getSafeHttpUrl(sourceUrlValue) : null;
  if (sourceUrlValue && !sourceUrl) {
    errors.source_url =
      "Use a complete http or https Source URL, or leave this blank.";
  }

  const availabilityStatus = input.availability_status.trim().toLowerCase();
  if (
    availabilityStatus &&
    !isListedValue(sourceAvailabilityStatuses, availabilityStatus)
  ) {
    errors.availability_status = "Choose a supported availability status.";
  }

  const publishedAtValue = input.original_published_at.trim();
  const originalPublishedAt = publishedAtValue
    ? parseUtcDateTimeInput(publishedAtValue)
    : null;
  if (publishedAtValue && !originalPublishedAt) {
    errors.original_published_at = "Enter a valid UTC date and time.";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return {
    data: {
      availability_status: availabilityStatus
        ? (availabilityStatus as SourceAvailabilityStatus)
        : null,
      external_id: optionalValue(input.external_id),
      original_description: optionalValue(input.original_description),
      original_language: optionalValue(input.original_language),
      original_published_at: originalPublishedAt,
      original_title: input.original_title.trim(),
      publisher: optionalValue(input.publisher),
      source_type: sourceType,
      source_url: sourceUrl,
    },
    errors,
  };
}

export function validateSourcePrivateInput(input: SourcePrivateInput):
  | { data: ValidatedSourcePrivateInput; errors: SourcePrivateFieldErrors }
  | { data: null; errors: SourcePrivateFieldErrors } {
  const errors: SourcePrivateFieldErrors = {};
  const boundedChecks = [
    ["raw_transcript", "Raw transcript", 500_000],
    ["cleaned_transcript", "Cleaned transcript", 500_000],
    ["rights_note", "Rights note", 20_000],
    ["internal_note", "Internal note", 20_000],
  ] as const;

  for (const [field, label, maximum] of boundedChecks) {
    const error = boundedOptional(input[field], label, maximum);
    if (error) errors[field] = error;
  }

  const transcriptQuality = input.transcript_quality.trim().toLowerCase();
  if (
    transcriptQuality &&
    !isListedValue(sourceTranscriptQualities, transcriptQuality)
  ) {
    errors.transcript_quality = "Choose a supported transcript quality.";
  }

  const processingStatus = input.processing_status.trim().toLowerCase();
  if (!isListedValue(sourceProcessingStatuses, processingStatus)) {
    errors.processing_status = "Choose a supported processing status.";
  }

  const rightsStatus = input.rights_status.trim().toLowerCase();
  if (!isListedValue(sourceRightsStatuses, rightsStatus)) {
    errors.rights_status = "Choose a supported rights status.";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return {
    data: {
      cleaned_transcript: optionalValue(input.cleaned_transcript),
      internal_note: optionalValue(input.internal_note),
      processing_status: processingStatus as SourceProcessingStatus,
      raw_transcript: optionalValue(input.raw_transcript),
      rights_note: optionalValue(input.rights_note),
      rights_status: rightsStatus as SourceRightsStatus,
      transcript_quality: transcriptQuality
        ? (transcriptQuality as SourceTranscriptQuality)
        : null,
    },
    errors,
  };
}

export function getSourceCapabilities({
  aal,
  requiresPublicationAssurance,
  role,
  source,
  userId,
}: {
  aal: "aal1" | "aal2";
  requiresPublicationAssurance: boolean;
  role: EditorialRole;
  source: EditorialSource;
  userId: string;
}) {
  const isOwner = source.created_by === userId;
  const canEdit =
    !source.deleted_at &&
    (requiresPublicationAssurance
      ? role === "publisher" && aal === "aal2"
      : role === "publisher" || role === "editor" || isOwner);

  return {
    canEditMetadata: canEdit,
    canEditPrivateDetails: canEdit,
    requiresPublicationAssurance,
  };
}

export type EditorialMutationError = {
  code?: string;
  message?: string;
};

export function getSafeSourceMutationError(error: EditorialMutationError) {
  if (error.code === "40001") {
    return {
      kind: "conflict" as const,
      message:
        "This Source changed after you opened it. Reload the latest version before trying again.",
    };
  }

  if (error.code === "42501") {
    return {
      kind: "denied" as const,
      message:
        "Your current role or session assurance does not permit this Source action.",
    };
  }

  if (error.code === "23514" || error.code === "22023") {
    return {
      kind: "validation" as const,
      message: "The Source did not pass the database validation checks.",
    };
  }

  if (error.code === "P0002") {
    return {
      kind: "not-found" as const,
      message: "The Source is no longer available to this editorial account.",
    };
  }

  return {
    kind: "unavailable" as const,
    message: "The Source could not be saved. Your entered text remains here.",
  };
}
