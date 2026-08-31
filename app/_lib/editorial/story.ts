import type { EditorialRole } from "../auth/membership";

export const storyStatuses = [
  "draft",
  "needs_review",
  "approved",
  "published",
  "archived",
] as const;

export type StoryStatus = (typeof storyStatuses)[number];

export type EditorialStory = {
  atlas_insight: string | null;
  body: string;
  cover_image_url: string | null;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
  id: string;
  lock_version: number;
  original_language: string | null;
  published_at: string | null;
  seo_description: string | null;
  seo_title: string | null;
  slug: string;
  status: StoryStatus;
  subtitle: string | null;
  summary: string;
  summary_zh: string | null;
  tags: string[];
  title: string;
  title_zh: string | null;
  body_zh: string | null;
  seo_description_zh: string | null;
  seo_title_zh: string | null;
  updated_at: string;
};

export type StoryInput = {
  atlas_insight: string;
  body: string;
  cover_image_url: string;
  original_language: string;
  seo_description: string;
  seo_title: string;
  slug: string;
  subtitle: string;
  summary: string;
  summary_zh: string;
  tags: string;
  title: string;
  title_zh: string;
  body_zh: string;
  seo_description_zh: string;
  seo_title_zh: string;
};

export type ValidatedStoryInput = {
  atlas_insight: string | null;
  body: string;
  cover_image_url: string | null;
  original_language: string | null;
  seo_description: string | null;
  seo_title: string | null;
  slug: string;
  subtitle: string | null;
  summary: string;
  summary_zh: string | null;
  tags: string[];
  title: string;
  title_zh: string | null;
  body_zh: string | null;
  seo_description_zh: string | null;
  seo_title_zh: string | null;
};

export type StoryFieldErrors = Partial<Record<keyof StoryInput, string>>;

export type StoryTransition = {
  confirmation: string | null;
  label: string;
  publishedAtRequired: boolean;
  status: StoryStatus;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateBoundedRequired(
  value: string,
  label: string,
  maximum: number,
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${label} is required.`;
  }

  if (trimmed.length > maximum) {
    return `${label} must be ${maximum.toLocaleString("en")} characters or fewer.`;
  }

  return null;
}

function validateBoundedOptional(
  value: string,
  label: string,
  maximum: number,
) {
  return value.trim().length > maximum
    ? `${label} must be ${maximum.toLocaleString("en")} characters or fewer.`
    : null;
}

export function isStoryId(value: string) {
  return uuidPattern.test(value);
}

export function isStoryStatus(value: string): value is StoryStatus {
  return storyStatuses.some((status) => status === value);
}

export function formatStoryStatus(status: StoryStatus) {
  if (status === "needs_review") {
    return "Needs review";
  }

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function getSafeHttpUrl(value: string | null) {
  if (!value || value.length > 2_048) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function parseUtcDateTimeInput(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

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

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day) ||
    date.getUTCHours() !== Number(hour) ||
    date.getUTCMinutes() !== Number(minute)
  ) {
    return null;
  }

  return date.toISOString();
}

export function validateStoryInput(input: StoryInput):
  | { data: ValidatedStoryInput; errors: StoryFieldErrors }
  | { data: null; errors: StoryFieldErrors } {
  const errors: StoryFieldErrors = {};
  const requiredChecks = [
    ["title", "Title", 200],
    ["slug", "Slug", 200],
    ["summary", "Summary", 1_000],
    ["body", "Body", 100_000],
  ] as const;
  const optionalChecks = [
    ["title_zh", "Chinese title", 200],
    ["summary_zh", "Chinese summary", 1_000],
    ["body_zh", "Chinese body", 100_000],
    ["subtitle", "Subtitle", 300],
    ["atlas_insight", "Atlas insight", 2_000],
    ["original_language", "Original language", 100],
    ["seo_title", "SEO title", 300],
    ["seo_description", "SEO description", 1_000],
    ["seo_title_zh", "Chinese SEO title", 300],
    ["seo_description_zh", "Chinese SEO description", 1_000],
  ] as const;

  for (const [field, label, maximum] of requiredChecks) {
    const error = validateBoundedRequired(input[field], label, maximum);

    if (error) {
      errors[field] = error;
    }
  }

  for (const [field, label, maximum] of optionalChecks) {
    const error = validateBoundedOptional(input[field], label, maximum);

    if (error) {
      errors[field] = error;
    }
  }

  const slug = input.slug.trim();

  if (slug && !slugPattern.test(slug)) {
    errors.slug =
      "Use lowercase letters, numbers, and single hyphens between words.";
  }

  const coverImageUrl = optionalValue(input.cover_image_url);
  const tags = Array.from(
    new Set(
      input.tags
        .split(/[,\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

  if (tags.length > 30) {
    errors.tags = "Use 30 tags or fewer.";
  } else if (tags.some((tag) => tag.length > 80)) {
    errors.tags = "Each tag must be 80 characters or fewer.";
  }

  if (coverImageUrl && !getSafeHttpUrl(coverImageUrl)) {
    errors.cover_image_url =
      "Use a complete public http or https image URL, or leave this blank.";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return {
    data: {
      atlas_insight: optionalValue(input.atlas_insight),
      body: input.body.trim(),
      cover_image_url: coverImageUrl,
      original_language: optionalValue(input.original_language),
      seo_description: optionalValue(input.seo_description),
      seo_title: optionalValue(input.seo_title),
      slug,
      subtitle: optionalValue(input.subtitle),
      summary: input.summary.trim(),
      summary_zh: optionalValue(input.summary_zh),
      tags,
      title: input.title.trim(),
      title_zh: optionalValue(input.title_zh),
      body_zh: optionalValue(input.body_zh),
      seo_description_zh: optionalValue(input.seo_description_zh),
      seo_title_zh: optionalValue(input.seo_title_zh),
    },
    errors,
  };
}

export function getStoryPublicationState(
  story: Pick<EditorialStory, "deleted_at" | "published_at" | "status">,
  now = new Date(),
) {
  if (story.deleted_at) {
    return "deleted" as const;
  }

  if (story.status === "archived") {
    return "archived" as const;
  }

  if (story.status !== "published" || !story.published_at) {
    return "private" as const;
  }

  const publicationTime = new Date(story.published_at);

  if (Number.isNaN(publicationTime.getTime())) {
    return "private" as const;
  }

  return publicationTime > now ? ("scheduled" as const) : ("public" as const);
}

export function getStoryTransitions({
  aal,
  role,
  story,
  userId,
}: {
  aal: "aal1" | "aal2";
  role: EditorialRole;
  story: EditorialStory;
  userId: string;
}) {
  if (story.deleted_at) {
    return [];
  }

  const isOwner = story.created_by === userId;
  const isEditor = role === "editor" || role === "publisher";
  const isPublisherAal2 = role === "publisher" && aal === "aal2";
  const transitions: StoryTransition[] = [];

  if (story.status === "draft" && (role !== "contributor" || isOwner)) {
    transitions.push({
      confirmation: null,
      label: "Submit for review",
      publishedAtRequired: false,
      status: "needs_review",
    });
  }

  if (
    story.status === "needs_review" &&
    (role !== "contributor" || isOwner)
  ) {
    transitions.push({
      confirmation: null,
      label: "Return to draft",
      publishedAtRequired: false,
      status: "draft",
    });
  }

  if (story.status === "needs_review" && isEditor) {
    transitions.push({
      confirmation: null,
      label: "Approve Story",
      publishedAtRequired: false,
      status: "approved",
    });
  }

  if (story.status === "approved" && isEditor) {
    transitions.push({
      confirmation: null,
      label: "Return to review",
      publishedAtRequired: false,
      status: "needs_review",
    });
  }

  if (story.status === "approved" && isPublisherAal2) {
    transitions.push({
      confirmation:
        "I confirm that this Story has passed publication checks and may become public at the UTC time below.",
      label: "Publish to Atlas",
      publishedAtRequired: true,
      status: "published",
    });
  }

  if (story.status === "published" && isPublisherAal2) {
    transitions.push({
      confirmation:
        "I confirm that this Story should be removed from public access and returned to Approved.",
      label: "Unpublish Story",
      publishedAtRequired: false,
      status: "approved",
    });
  }

  if (story.status === "archived" && isPublisherAal2) {
    transitions.push({
      confirmation:
        "I confirm that this archived Story should be restored to Approved.",
      label: "Restore from archive",
      publishedAtRequired: false,
      status: "approved",
    });
  }

  if (story.status !== "archived" && isPublisherAal2) {
    transitions.push({
      confirmation:
        "I confirm that this Story should be archived and removed from public access.",
      label: "Archive Story",
      publishedAtRequired: false,
      status: "archived",
    });
  }

  return transitions;
}

export function getStoryCapabilities(parameters: {
  aal: "aal1" | "aal2";
  role: EditorialRole;
  story: EditorialStory;
  userId: string;
}) {
  const { aal, role, story, userId } = parameters;
  const isOwner = story.created_by === userId;
  const publisherAal2 = role === "publisher" && aal === "aal2";
  const nonPublicEditable =
    story.status === "draft" ||
    story.status === "needs_review" ||
    story.status === "approved";
  const canEdit =
    !story.deleted_at &&
    story.status !== "archived" &&
    ((role === "contributor" &&
      isOwner &&
      (story.status === "draft" || story.status === "needs_review")) ||
      (role === "editor" && nonPublicEditable) ||
      (role === "publisher" &&
        (story.status !== "published" || publisherAal2)));

  return {
    canDelete: publisherAal2 && !story.deleted_at,
    canEdit,
    canPreview: !story.deleted_at,
    canRestore: publisherAal2 && Boolean(story.deleted_at),
    transitions: getStoryTransitions(parameters),
  };
}

export type EditorialMutationError = {
  code?: string;
  message?: string;
};

export function getSafeStoryMutationError(error: EditorialMutationError) {
  if (error.code === "40001") {
    return {
      kind: "conflict" as const,
      message:
        "This Story changed after you opened it. Reload the latest version before trying again.",
    };
  }

  if (error.code === "23505") {
    return {
      kind: "duplicate" as const,
      message: "That slug is already used by another Story.",
    };
  }

  if (error.code === "42501") {
    return {
      kind: "denied" as const,
      message:
        "Your current role or session assurance does not permit this Story action.",
    };
  }

  if (error.code === "23514" || error.code === "22023") {
    return {
      kind: "validation" as const,
      message:
        "The Story did not pass the database workflow checks. Review its content, connections, and requested state.",
    };
  }

  if (error.code === "P0002") {
    return {
      kind: "not-found" as const,
      message: "The Story is no longer available to this editorial account.",
    };
  }

  return {
    kind: "unavailable" as const,
    message: "The Story could not be saved. Your entered text remains here.",
  };
}
