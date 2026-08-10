export type MfaAssuranceLevel = "aal1" | "aal2";

export type MfaFactorSummary = {
  factor_type: string;
  friendly_name?: string;
  id: string;
  status: string;
};

export type TotpFactorInventory = {
  unverified: MfaFactorSummary[];
  verified: MfaFactorSummary[];
};

export type MfaSessionState =
  | "challenge-required"
  | "enrollment-required"
  | "verified"
  | "stale-session";

const factorIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const totpQrCodePrefix = "data:image/svg+xml;utf-8,";

export function isTotpCode(value: string) {
  return /^\d{6}$/.test(value);
}

export function isPlausibleFactorId(value: string) {
  return factorIdPattern.test(value);
}

export function isSafeTotpEnrollmentSecret(value: string) {
  return value.length >= 16 && value.length <= 128 && /^[a-z2-7]+$/i.test(value);
}

export function isSafeTotpQrCode(value: string) {
  return value.length <= 100_000 && value.startsWith(totpQrCodePrefix);
}

export function getTotpFactorInventory(
  factors: MfaFactorSummary[],
): TotpFactorInventory | null {
  const factorIds = new Set<string>();
  const inventory: TotpFactorInventory = {
    unverified: [],
    verified: [],
  };

  for (const factor of factors) {
    if (
      factor.factor_type !== "totp" ||
      !isPlausibleFactorId(factor.id) ||
      factorIds.has(factor.id) ||
      (factor.status !== "unverified" && factor.status !== "verified")
    ) {
      return null;
    }

    factorIds.add(factor.id);
    inventory[factor.status].push(factor);
  }

  return inventory;
}

export function findOwnedTotpFactor(
  factors: MfaFactorSummary[],
  factorId: string,
  requiredStatus: "unverified" | "verified",
) {
  if (!isPlausibleFactorId(factorId)) {
    return null;
  }

  return (
    factors.find(
      (factor) =>
        factor.id === factorId &&
        factor.factor_type === "totp" &&
        factor.status === requiredStatus,
    ) ?? null
  );
}

export function getMfaSessionState({
  currentLevel,
  nextLevel,
  verifiedTotpCount,
}: {
  currentLevel: MfaAssuranceLevel;
  nextLevel: MfaAssuranceLevel;
  verifiedTotpCount: number;
}): MfaSessionState {
  if (
    currentLevel === "aal2" &&
    nextLevel === "aal2" &&
    verifiedTotpCount > 0
  ) {
    return "verified";
  }

  if (
    currentLevel === "aal1" &&
    nextLevel === "aal2" &&
    verifiedTotpCount > 0
  ) {
    return "challenge-required";
  }

  if (
    currentLevel === "aal1" &&
    nextLevel === "aal1" &&
    verifiedTotpCount === 0
  ) {
    return "enrollment-required";
  }

  return "stale-session";
}
