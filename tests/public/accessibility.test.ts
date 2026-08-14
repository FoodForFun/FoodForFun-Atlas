import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync("app/layout.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("Public pages expose a keyboard bypass target and visible focus styles", () => {
  assert.match(layout, /<html lang="en">/);
  assert.match(layout, /className="skip-link" href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(styles, /\.skip-link:focus\s*\{/);
  assert.match(styles, /a:focus-visible,/);
  assert.match(styles, /button:focus-visible,/);
  assert.match(styles, /input:focus-visible\s*\{/);
});

test("Standalone public navigation links retain touch-friendly targets", () => {
  const targetRule = styles.match(
    /\.section-link,\s*\.back-nav a,\s*\.notice a,\s*\.not-found-link,\s*\.pagination a\s*\{([^}]*)\}/,
  );

  assert.ok(targetRule, "shared standalone-link target rule is required");
  assert.match(targetRule[1], /display:\s*inline-flex/);
  assert.match(targetRule[1], /min-height:\s*2\.75rem/);
  assert.match(targetRule[1], /align-items:\s*center/);
});
