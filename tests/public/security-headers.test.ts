import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../../next.config.ts";

async function getGlobalHeaders() {
  assert.equal(nextConfig.poweredByHeader, false);
  assert.equal(typeof nextConfig.headers, "function");

  const rules = await nextConfig.headers();
  assert.equal(rules.length, 1);
  assert.equal(rules[0].source, "/(.*)");

  return new Map(
    rules[0].headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );
}

test("Next applies the low-risk security-header baseline globally", async () => {
  const headers = await getGlobalHeaders();

  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(
    headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(
    headers.get("permissions-policy"),
    "browsing-topics=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  );
});

test("The CSP protects document boundaries without restricting current assets", async () => {
  const csp = (await getGlobalHeaders()).get("content-security-policy") ?? "";

  for (const directive of [
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ]) {
    assert.match(csp, new RegExp(directive.replaceAll("'", "\\'")));
  }

  for (const intentionallyDeferred of [
    "default-src",
    "script-src",
    "style-src",
    "img-src",
    "connect-src",
  ]) {
    assert.doesNotMatch(csp, new RegExp(intentionallyDeferred));
  }
});
