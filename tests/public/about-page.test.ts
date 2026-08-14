import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/about/page.tsx", "utf8");
const navigation = readFileSync("app/_components/site-navigation.tsx", "utf8");
const homepage = readFileSync("app/page.tsx", "utf8");

test("About covers the public editorial promise and boundaries", () => {
  for (const phrase of [
    "not a restaurant ranking or review platform",
    "How we work",
    "Sources and transparency",
    "Privacy",
    "Technology and AI",
    "Corrections",
  ]) {
    assert.match(page, new RegExp(phrase, "i"), phrase);
  }

  for (const concern of [
    "factual errors",
    "incorrect names",
    "location concerns",
    "rights concerns",
    "outdated business information",
    "privacy issues",
  ]) {
    assert.match(page, new RegExp(concern, "i"), concern);
  }
});

test("About offers a safe real correction path without a database dependency", () => {
  assert.match(page, /github\.com\/FoodForFun\/FoodForFun-Atlas\/issues\/new/);
  assert.match(page, /Do not include private addresses/i);
  assert.match(page, /request a private\s+follow-up/i);
  assert.doesNotMatch(page, /supabase/i);
});

test("About has metadata and is reachable from public navigation and home", () => {
  assert.match(page, /title: "About \| FoodForFun Atlas"/);
  assert.match(page, /description:/);
  assert.match(navigation, /href: "\/about", label: "About"/);
  assert.match(homepage, /href="\/about"/);
});
