export const editorialRoles = ["contributor", "editor", "publisher"] as const;

export type EditorialRole = (typeof editorialRoles)[number];

type MembershipRecord = {
  is_active: boolean;
  role: string;
};

export function isEditorialRole(value: string): value is EditorialRole {
  return editorialRoles.some((role) => role === value);
}

export function getActiveEditorialRole(
  membership: MembershipRecord | null,
): EditorialRole | null {
  if (
    !membership ||
    !membership.is_active ||
    !isEditorialRole(membership.role)
  ) {
    return null;
  }

  return membership.role;
}

export function formatEditorialRole(role: EditorialRole) {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}
