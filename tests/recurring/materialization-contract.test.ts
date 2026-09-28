import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

const materializationAction = readFileSync(
  new URL("../../lib/recurring-materialization-action.ts", import.meta.url),
  "utf8",
);

it("does not fall back to non-atomic client-side materialization", () => {
  assert.doesNotMatch(materializationAction, /\.from\("transactions"\)/);
  assert.doesNotMatch(materializationAction, /\.from\("recurring_occurrences"\)/);
});
