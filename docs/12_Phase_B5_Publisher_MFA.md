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
| `/admin/mfa` | Show current AAL and factor status; remove one incomplete unverified setup after explicit confirmation | Active editorial membership |
| `/admin/mfa/enroll` | Start and verify one TOTP enrollment | Active editorial membership and no verified TOTP factor |
| `/admin/mfa/challenge` | Challenge a verified TOTP factor and reach AAL2 | Active editorial membership and an owned verified TOTP factor |

The Admin layout is dynamic with zero revalidation, and the root proxy applies
`private, no-store` headers to Admin responses, including Server Action POST
responses matched under `/admin`. Every page and Server Action repeats the
authoritative server-side membership check. An authenticated non-member is
redirected to the generic access-denied route and cannot use an MFA route as an
alternate Admin entry point.

## Enrollment flow

1. An active editorial member opens `/admin/mfa/enroll` at AAL1.
2. The start action verifies signed JWT claims, binds those claims to the same
   active editorial member authorized for the action, requires the exact
   `aal1` to `aal1` enrollment state, and lists factors from Supabase for that
   user. Browser-supplied user IDs and factor inventories are never accepted.
3. Exactly one unverified TOTP factor left by an interrupted setup is removed
   before a replacement enrollment begins. The action re-lists factors after
   cleanup and requires an empty, unambiguous inventory before enrolling. A
   cleanup failure stops the flow without creating another factor.
4. `auth.mfa.enroll()` creates one unverified TOTP factor. Its QR code and
   manual setup secret are returned only in the authenticated action response
   and rendered on the no-store enrollment page only after the QR source matches
   Supabase Auth's exact bounded SVG data-URI format. The application checks the
   1 MB input ceiling before decoding, accepts the raw or percent-encoded UTF-8
   form, and validates the expected SVG namespace root and QR rectangle grammar
   without inserting markup into the DOM. The secret must match a bounded Base32
   format. They are not written to the database by the application,
   persisted in application storage, placed in a URL, or included in logs,
   analytics, console messages, errors, or cookies.
   The response is private and no-store. The secret necessarily exists in the
   enrollment tab's in-memory React action state while the owner scans or
   retries the current setup; it is not application-persisted.
5. The user enters the current six-digit code. The server lists the user's
   factors again and accepts the submitted factor ID only when it belongs to the
   current user, is TOTP, and is still unverified.
6. The server creates the challenge itself and immediately verifies the code.
   Challenge IDs never come from browser input. Invalid, expired, malformed, or
   unavailable challenges return generic retry guidance and do not activate the
   factor.
7. On a successful Supabase verification response, the action checks that the
   response user is the authorized member, cryptographically verifies the new
   access token with `getClaims(accessToken)`, and independently verifies the
   current saved session claims. Both claim sets must identify the same member
   and contain `aal2`. A locally decoded assurance helper or URL status is not
   sufficient. If AAL2 cannot be confirmed, the action replaces the enrollment
   history entry with the authoritative status page and does not proceed to a
   sensitive destination.

Reloading an interrupted enrollment intentionally discards the displayed
secret. Starting again removes the old unverified factor and returns a new QR
code and secret. Successful completion, restart, explicit exit, and sign-out
use replacement navigation so the secret-bearing history entry is not retained.
The old secret must not be reused.

### Factor inventory decisions

| Current factor inventory | Enrollment behavior |
| --- | --- |
| No factor | Enrollment may start only for the exact verified `aal1` to `aal1` session state |
| One verified TOTP | Refuse replacement; use status or the later-session challenge |
| One unverified TOTP | Treat as one interrupted setup, remove that owned unverified factor, re-list, then create one replacement |
| Multiple unverified factors | Fail closed; do not delete or add factors |
| Verified plus unverified factors | Fail closed; do not replace or clean up through the application |
| Unsupported type, duplicate ID, malformed ID, or unknown status | Fail closed as an ambiguous inventory |
| Multiple verified TOTP factors | Enrollment is refused; the challenge flow may select one owned verified TOTP factor |

Cleanup IDs come only from a fresh `listFactors()` response for the JWT-bound
user. The cleanup path never accepts a factor ID from a URL or form, never calls
unenroll for a verified factor, and re-lists the current user's factors before
creating a replacement. These bounds prevent the normal application flow from
accumulating abandoned factors while preserving verified factors.

### Cleanup-only recovery

The MFA status page offers **Remove incomplete authenticator setup** only when
the signed-in active editorial member has exactly one TOTP factor, that factor
is unverified, no verified factor exists, and the session is in the exact
`aal1` to `aal1` enrollment state. The user must explicitly confirm the action.
The browser submits no user ID or factor ID.

The dedicated Server Action repeats the authenticated identity and active
membership checks, binds verified session claims to that member, and reads the
factor from the member's own `mfa.listFactors()` result. It repeats the factor
list immediately before mutation and requires the same sole unverified TOTP
factor, then calls `mfa.unenroll({ factorId })` exactly once. It reports success
only after a final factor list is empty. Missing, verified, multiple,
unsupported, malformed, changed, or error states fail closed without retry.
This cleanup action never enrolls a replacement factor, creates a challenge,
verifies a code, uses Auth Admin APIs, or uses a service-role credential. A new
enrollment remains a separate, deliberate action.

## Later-session challenge flow

After password sign-in, the server checks active membership and calls
`auth.mfa.getAuthenticatorAssuranceLevel()`. An active member with
`currentLevel = aal1` and `nextLevel = aal2` is directed to
`/admin/mfa/challenge` with a return path restricted to a local `/admin` URL.

The challenge action lists the signed-in user's verified factors and rejects an
unknown, malformed, unverified, non-TOTP, or other user's factor ID. It creates
a fresh challenge on the server for each submission, verifies the current code,
and confirms signed JWT claims for both the returned access token and refreshed
current session are AAL2 for the same member before redirecting. Challenge IDs
are never accepted from the browser. Supabase remains authoritative for
challenge expiration, one-time use, and TOTP replay behavior; an expired,
already-used, or otherwise rejected challenge produces no redirect to the
sensitive destination.

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

Null, unknown, mismatched, or error results fail closed. MFA pages compare the
assurance helper's current level with cryptographically verified JWT claims.
The enrollment-complete banner is shown only when the freshly evaluated server
state is also `verified`; adding `?status=enrolled` to a URL cannot assert AAL2.

Contributor and Editor membership behavior is unchanged. MFA enrollment remains
available to every active editorial member, but the approved MVP policy makes
TOTP AAL2 mandatory for Publisher publication-level and destructive recovery
operations. Authentication or AAL never substitutes for active membership or
database authorization.

Every MFA Server Action repeats verified authentication, active database
membership authorization, factor-list retrieval, exact AAL preconditions, and
factor ownership/state checks. Proxy and page rendering are not trusted as
authorization boundaries. A non-member therefore cannot invoke the Atlas MFA
actions directly. A signed-in Supabase user may still call that project's
public Auth MFA API outside this application if the project's Auth configuration
allows it; that is an Auth-account capability, not access to FoodForFun Atlas
Admin UI, membership, or editorial data.

Server Actions use Next.js POST-only action handling and its Origin versus Host
or `X-Forwarded-Host` comparison. No custom MFA Route Handler or cross-origin
mutation endpoint exists, and `serverActions.allowedOrigins` is not broadened.
No additional CSRF exception is required for this deployment topology.

## Logout and recovery

Logout uses Supabase local-scope sign-out, clears the browser's authenticated
session cookies, and returns to `/admin/login`. Losing the authenticator does
not grant a bypass. The application cleanup control is limited to one
unverified, incomplete setup and cannot remove a verified authenticator.
Supabase does not currently provide recovery codes through the TOTP MFA API.

If enrollment cannot be completed, the owner may restart only when exactly one
owned unverified TOTP factor exists; ambiguous inventories require Dashboard or
Auth-admin inspection. If an enrolled factor is lost or no valid code can be
produced, the AAL1 Admin Shell remains available but Publisher-sensitive AAL2
operations remain denied. An authorized project owner must verify the account
identity out of band and remove or recover the verified factor through
Supabase's trusted administrative surface. Removing a verified authenticator
through the application remains out of scope. A future verified-factor removal
design must separately require recent AAL2, active membership, explicit
confirmation, audit/recovery review, and protection against removing the last
usable factor.

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
