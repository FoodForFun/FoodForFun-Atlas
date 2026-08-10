# FoodForFun Atlas — Phase B Authentication and Admin Shell

**Document Version:** 0.1

**Project Version:** 0.1

**Status:** Implemented for Pull Request review; Production provisioning not authorized

**Last Updated:** August 2026

## Scope

Phase B adds only the secure Supabase Auth and minimal admin-shell foundation.
It does not add editorial CRUD, publishing controls, user or membership
management, image uploads, revision screens, or Phase C functionality.

The implementation adds `@supabase/ssr` for cookie-backed sessions. It uses
only `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No secret or service-role credential is
used by the application.

## Authentication method

The approved method is invite-only email/password Supabase Auth:

- public sign-up and social login remain unavailable;
- an owner sends an invitation through the Supabase Dashboard only after
  explicit Production approval;
- the invited user sets a password through a verified invite link;
- normal login uses `signInWithPassword`;
- password recovery uses Supabase's non-enumerating reset behavior; and
- invite and recovery email links terminate in server Route Handlers that
  exchange a PKCE code or verify a token hash before setting session cookies.

Magic links and email OTP were not selected because Section 10 of the approved
architecture explicitly chooses email/password. Password authentication also
keeps day-to-day access independent of email delivery while preserving
Supabase-native invitation and recovery flows.

## Session architecture

The existing public-data client remains deliberately anonymous and cookie-free,
so signing in cannot broaden the public pages' RLS view. Admin pages, Auth Route
Handlers, and Server Actions use a separate Supabase SSR client created inside
each request.

The root `proxy.ts` runs only for `/admin/:path*` and `/auth/:path*`. It calls
`getClaims()` immediately after creating its request client, forwards refreshed
cookies to both the request and response, preserves the cache-control headers
provided by `@supabase/ssr`, and marks Auth/admin responses `private, no-store`.
It may redirect an obviously unauthenticated admin request to login, but it
never checks or grants editorial membership.

Every existing admin page independently uses the server-only access layer.
Admin routes are dynamic and are not eligible for ISR.

## Authorization path

Authentication is not authorization. The access path is:

```text
Verified Supabase claims
        |
        v
JWT user id attached by the SSR client
        |
        v
SELECT role, is_active
FROM editorial_memberships
WHERE user_id = verified claims subject
        |
        v
Phase A self-read RLS policy and column grant
        |
        v
Allow only active contributor | editor | publisher
```

The application does not accept a user ID, role, or membership value from the
browser. A missing membership, inactive membership, or unknown role is denied.
Database errors fail closed. The database remains authoritative for subsequent
editorial data access and mutation RPCs.

Unauthenticated users are redirected to `/admin/login`. Authenticated users
without an active membership receive `/admin/access-denied`. Active
Contributors, Editors, and Publishers can see the minimal shell. The shell shows
the verified email, active database role, session assurance level, four inert
future work-area placeholders, and sign-out.

## Login, confirmation, recovery, and sign-out

- `/admin/login` submits email and password to a Server Action. Errors are
  generic and do not disclose whether an account exists.
- `/auth/confirm` accepts only `invite` and `recovery` token-hash types. Invalid
  and expired links return to a generic invalid-link state.
- `/auth/callback` exchanges a PKCE code for a cookie session.
- `/admin/forgot-password` always gives a non-enumerating success response when
  Supabase accepts the reset request.
- `/admin/update-password` requires verified claims and never accepts an
  unauthenticated password update.
- Sign-out invalidates the current local session, clears its cookies through
  Supabase SSR, and returns to login.

User-controlled redirect destinations are accepted only when they parse as a
local `/admin` path. Absolute URLs, protocol-relative URLs, public paths,
lookalike prefixes, whitespace variants, and backslash variants fall back to
`/admin`. Token hashes and Auth codes are removed before the final redirect.

## Production owner provisioning plan

Production currently has no Auth users or editorial memberships. None of the
following steps is authorized by the Phase B implementation or Pull Request.
Each requires explicit owner approval immediately before execution.

1. Review the Production Auth settings and confirm the linked project reference.
2. Set the Auth Site URL to the canonical Production HTTPS origin. Add only the
   exact approved local, Preview, and Production callback URLs to the redirect
   allow list; do not use an unrestricted wildcard.
3. Confirm public email sign-up is disabled, email/password remains enabled,
   and email confirmation is required.
4. Configure reviewed Invite and Recovery email templates for SSR token-hash
   verification:

   ```text
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
   ```

   Configure production SMTP and disable link tracking before relying on email
   delivery. Review the email-link expiration and rate limits.
5. From the Supabase Dashboard, send one invitation to the owner's exact email
   address. Do not expose an Auth Admin secret to the application.
6. Read the new owner's `auth.users.id`, then review and run one bounded
   transaction in the Production SQL Editor. Insert only the membership
   identity, role, and active state; the Phase A trigger owns lifecycle actor
   fields:

   ```sql
   begin;

   insert into public.editorial_memberships (user_id, role, is_active)
   values ('REVIEWED_OWNER_AUTH_USER_UUID', 'publisher', true);

   select user_id, role, is_active
   from public.editorial_memberships
   where user_id = 'REVIEWED_OWNER_AUTH_USER_UUID';

   commit;
   ```

   Stop if the UUID is not the invited owner's exact Auth user. Do not use an
   application key, create additional memberships, or submit actor IDs.
7. The owner follows the invite, sets a unique password, and verifies that AAL1
   login reaches `/admin` while a session without the membership does not.
8. Review and merge the separate Phase B.5 TOTP MFA Pull Request, then obtain
   explicit approval for Production TOTP settings and the owner's enrollment.
   Use the member-only `/admin/mfa/enroll` flow from the owner's AAL1 session,
   keep the QR code and setup secret visible only to the owner, and verify a
   current code. On later password logins, complete `/admin/mfa/challenge` when
   the current AAL is `aal1` and the next AAL is `aal2`. Confirm the MFA status
   page reports `AAL2`. Phase A mutation functions continue rejecting Publisher
   AAL1 for publication, destructive recovery, and protected public corrections.
9. Verify sign-out, session expiry, membership deactivation, and session
   revocation. Offboarding deactivates membership first and revokes Auth
   sessions second.

## Required future approvals and current limitations

Real owner login cannot be exercised until the owner separately approves:

- Production Site URL and redirect allow-list changes;
- invite and recovery template changes;
- production SMTP or email-delivery configuration;
- creation and invitation of the owner Auth user;
- insertion of the single Publisher membership; and
- enabling Production TOTP enrollment and verification; and
- the owner's MFA enrollment and first AAL2 verification.

The Phase B.5 application provides the enrollment and challenge mechanism but
does not perform these Production operations autonomously. Until an isolated
Auth environment is available, Contributor, Editor, Publisher, inactive-member,
authenticated non-member, and end-to-end TOTP sessions can be verified only
through focused tests, code review, and approved non-Production identities—not
by creating test identities or factors in Production.
