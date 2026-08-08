const redirectBaseUrl = "https://foodforfun.invalid";

export const defaultAdminRedirect = "/admin";

export function getSafeAdminRedirect(
  value: string | null | undefined,
  fallback = defaultAdminRedirect,
) {
  if (
    !value ||
    value !== value.trim() ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  try {
    const candidate = new URL(value, redirectBaseUrl);
    const isAdminPath =
      candidate.pathname === "/admin" ||
      candidate.pathname.startsWith("/admin/");

    if (candidate.origin !== redirectBaseUrl || !isAdminPath) {
      return fallback;
    }

    return `${candidate.pathname}${candidate.search}`;
  } catch {
    return fallback;
  }
}
