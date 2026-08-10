const redirectBaseUrl = "https://foodforfun.invalid";

export const defaultAdminRedirect = "/admin";

export function getSafeAdminRedirect(value: string | null | undefined) {
  if (
    !value ||
    value !== value.trim() ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return defaultAdminRedirect;
  }

  try {
    const candidate = new URL(value, redirectBaseUrl);
    const rawPath = value.split(/[?#]/u, 1)[0];
    const isAdminPath =
      candidate.pathname === "/admin" ||
      candidate.pathname.startsWith("/admin/");
    const hasUnsafePathEncoding = rawPath.includes("%");
    const hasUnicodePathSeparator =
      /[\u2044\u2215\u29f8\ufe68\uff0f\uff3c]/u.test(rawPath);

    if (
      candidate.origin !== redirectBaseUrl ||
      !isAdminPath ||
      hasUnsafePathEncoding ||
      hasUnicodePathSeparator
    ) {
      return defaultAdminRedirect;
    }

    return `${candidate.pathname}${candidate.search}`;
  } catch {
    return defaultAdminRedirect;
  }
}
