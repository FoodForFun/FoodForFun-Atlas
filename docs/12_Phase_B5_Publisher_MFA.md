# FoodForFun Atlas — Phase B.5 Publisher MFA

**Status:** Implemented for review; Production activation is not authorized

**Last Updated:** August 2026

## Scope

Phase B.5 adds Supabase-native TOTP enrollment and challenge flows to the
existing Next.js Admin Shell. It does not add content editing, publishing UI,
membership management, user management, SMS MFA, passkeys, or backup codes.

The security model remains three separate checks:

1. Supabase Auth establishes the signed-in identity.
2. An active `editorial_memberships` row authorizes Admin access and identifies
   the Contributor, Editor, or Publisher role.
3. The JWT Authenticator Assurance Level (AAL) proves whether the current
   session has completed a second-factor challenge.

The application uses only the publishable key plus the user's cookie-backed
session. It does not introduce a service-role key, Auth Admin API, or new
dependency.

## Routes

| Route | Purpose | Protection |
| --- | --- | --- |
| `/admin/mfa` | Show current AAL and verified TOTP factor count | Active editorial membership |
| `/admin/mfa/enroll` | Start and verify one TOTP enrollment | Active editorial membership and no verified TOTP factor |
| `/admin/mfa/challenge` | Challenge a verified TOTP factor and reach AAL2 | Active editorial membership and an owned verified TOTP factor |

The Admin layout is dynamic with zero revalidation, and the root proxy applies
`private, no-store` headers to Admin responses. Every page and Server Action
repeats the authoritative server-side membership check. An authenticated
non-member is redirected to the generic access-denied route and cannot use an
MFA route as an alternate Admin entry point.

## Enrollment flow

1. An active editorial member opens `/admin/mfa/enroll` at AAL1.
2. The start action lists factors for the current Supabase user. A verified TOTP
   factor stops duplicate enrollment and sends the user to status or challenge.
3. Unverified TOTP factors left by an interrupted setup are removed before a
   replacement enrollment begins. A cleanup failure stops the flow without
   creating another factor.
4. `auth.mfa.enroll()` creates one unverified TOTP factor. Its QR code and
   manual setup secret are returned only in the authenticated action response
   and rendered on the no-store enrollment page. They are not written to the
   database by the application, persisted in application storage, placed in a
   URL, or included in logs, analytics, console messages, or errors.
5. The user enters the current six-digit code. The server lists the user's
   factors again and accepts the submitted factor ID only when it belongs to the
   current user, is TOTP, and is still unverified.
6. The server creates the challenge itself and immediately verifies the code.
   Challenge IDs never come from browser input. Invalid, expired, malformed, or
   unavailable challenges return generic retry guidance and do not activate the
   factor.
7. Success must produce a fresh `currentLevel` of `aal2`; otherwise the action
   fails closed. Supabase marks the factor verified, refreshes the session, and
   invalidates the user's other sessions as part of enrollment verification.

Reloading an interrupted enrollment intentionally discards the displayed
secret. Starting again removes the old unverified factor and returns a new QR
code and secret. The old secret must not be reused.

## Later-session challenge flow

After password sign-in, the server checks active membership and calls
`auth.mfa.getAuthenticatorAssuranceLevel()`. An active member with
`currentLevel = aal1` and `nextLevel = aal2` is directed to
`/admin/mfa/challenge` with a return path restricted to a local `/admin` URL.

The challenge action lists the signed-in user's verified factors and rejects an
unknown, malformed, unverified, non-TOTP, or other user's factor ID. It creates
a fresh challenge on the server for each submission, verifies the current code,
and confirms that the resulting session is AAL2 before redirecting.

The challenge page includes a link to continue to the basic Admin Shell at
AAL1. This preserves the approved distinction between ordinary Admin access and
sensitive Publisher operations. Future Publisher Server Actions must require
Publisher authorization and AAL2 independently, while the Phase A database
functions remain the final non-bypassable AAL2 boundary.

## AAL behavior

| Current AAL | Next AAL | Verified TOTP | Application state |
| --- | --- | --- | --- |
| `aal1` | `aal1` | None | Enrollment available; required before Publisher-sensitive work |
| `aal1` | `aal2` | One or more | Challenge offered after login and required for AAL2 work |
| `aal2` | `aal2` | One or more | Session verified for AAL2 checks |
| Any inconsistent combination | Any | Any | Stale session; sign out and sign in again |

Contributor and Editor membership behavior is unchanged. MFA enrollment remains
available to every active editorial member, but the approved MVP policy makes
TOTP AAL2 mandatory for Publisher publication-level and destructive recovery
operations. Authentication or AAL never substitutes for active membership or
database authorization.

## Logout and recovery

Logout uses Supabase local-scope sign-out, clears the browser's authenticated
session cookies, and returns to `/admin/login`. Losing the authenticator does
not grant a bypass. Factor recovery or removal is an owner-controlled Supabase
Dashboard operation until a separately reviewed recovery design exists.
Supabase does not currently provide recovery codes through the TOTP MFA API.

## Owner provisioning sequence

All Production steps below require explicit owner approval immediately before
execution:

1. Review the linked Production project, canonical Site URL, exact redirect
   allow list, invite/recovery templates, SMTP, rate limits, and disabled public
   sign-up configuration.
2. Enable TOTP enrollment and verification in Production Auth settings. Do not
   enable SMS or WebAuthn as part of Phase B.5.
3. Invite the owner's exact email address through the Supabase Dashboard.
4. In a separately reviewed bounded SQL transaction, add the exact Auth user ID
   as one active Publisher membership.
5. The owner follows the invite, sets a unique password, signs in at AAL1, and
   confirms `/admin` access while a non-member remains denied.
6. The owner opens `/admin/mfa/enroll`, scans the QR code privately, stores the
   factor in their authenticator, and enters the current code. No operator or
   agent records or handles the secret.
7. Confirm `/admin/mfa` reports AAL2, sign out, sign in again, and confirm the
   fresh password session presents the TOTP challenge and reaches AAL2 only
   after a valid code.
8. Verify invalid and expired codes fail closed, logout clears the session, and
   Phase A Publisher-sensitive database functions reject AAL1.

## Validation boundary

The implementation can validate pure AAL state logic, factor ownership checks,
malformed input, safe redirects, route protection, rendering, responsive layout,
and public regressions without a Production identity. Complete enrollment,
invalid-code, fresh-login challenge, and AAL2 cookie refresh require an approved
identity in an isolated Auth environment. Phase B.5 must not create or alter a
Production Auth user, membership, factor, or Auth setting merely to exercise
those cases.
