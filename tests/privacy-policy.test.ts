import assert from "node:assert/strict";
import { test } from "node:test";

import { privacyPolicySections } from "../lib/privacy-policy.ts";

test("privacy policy exposes the complete public policy structure", () => {
  // Given: the policy model used by the public privacy route
  const sectionIds = privacyPolicySections.map(({ id }) => id);

  // When: consumers render the policy navigation and sections
  // Then: all seven required topics are present once and in order
  assert.deepStrictEqual(sectionIds, [
    "purpose",
    "items",
    "retention",
    "processors",
    "rights",
    "safeguards",
    "contact",
  ]);
});

test("privacy policy identifies every external processor", () => {
  // Given: the processing-delegation section
  const processorSection = privacyPolicySections.find(
    ({ id }) => id === "processors",
  );

  // When: the disclosed processor list is inspected
  // Then: both infrastructure providers are named
  assert.ok(processorSection);
  assert.deepStrictEqual(
    processorSection.processors?.map(({ name }) => name),
    ["Supabase", "Vercel"],
  );
});

test("privacy policy publishes the privacy contact", () => {
  // Given: the privacy officer section
  const contactSection = privacyPolicySections.find(
    ({ id }) => id === "contact",
  );

  // When: a user looks for a rights-request channel
  // Then: the published service email is available
  assert.ok(contactSection);
  assert.strictEqual(contactSection.email, "stonesilver0417@gmail.com");
});
