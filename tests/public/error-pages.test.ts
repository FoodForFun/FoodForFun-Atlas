import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const errorPage = readFileSync("app/error.tsx", "utf8");
const notFoundPage = readFileSync("app/not-found.tsx", "utf8");

test("global error boundary offers an accessible retry without leaking details", () => {
  assert.match(errorPage, /^"use client";/);
  assert.match(errorPage, /reset: \(\) => void/);
  assert.match(errorPage, /role="alert"/);
  assert.match(errorPage, /aria-labelledby="error-title"/);
  assert.match(errorPage, /<h1 id="error-title">Something went wrong<\/h1>/);
  assert.match(errorPage, /<button type="button" onClick=\{reset\}>/);
  assert.match(errorPage, /Try again/);
  assert.match(errorPage, /<Link href="\/">Return to the homepage<\/Link>/);
  assert.doesNotMatch(
    errorPage,
    /error\.(?:message|stack|digest)|console\.error|JSON\.stringify/,
  );
});

test("not-found page stays public, accessible, and recoverable", () => {
  assert.match(notFoundPage, /aria-labelledby="not-found-title"/);
  assert.match(notFoundPage, /<h1 id="not-found-title">Page not found<\/h1>/);
  assert.match(notFoundPage, /may not be part of\s+the public Atlas\./);
  assert.match(
    notFoundPage,
    /<Link className="not-found-link" href="\/">/,
  );
  assert.match(notFoundPage, /Return to the homepage/);
  assert.doesNotMatch(notFoundPage, /href="\/admin|target="_blank"/);
});
