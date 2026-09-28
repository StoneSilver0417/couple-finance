import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const historicalMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260907010000_recurring_transactions_fixes.sql",
    import.meta.url,
  ),
  "utf8",
);

const atomicityMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260928000000_fix_recurring_transaction_atomicity.sql",
    import.meta.url,
  ),
  "utf8",
);

function getFunctionDefinition(sql: string, functionName: string): string {
  const functionStart = sql.search(
    new RegExp(`CREATE(?: OR REPLACE)? FUNCTION ${functionName}\\s*\\(`),
  );
  assert.notEqual(functionStart, -1, `${functionName} definition is missing`);

  const functionEnd = sql.indexOf("$$ LANGUAGE plpgsql", functionStart);
  assert.notEqual(functionEnd, -1, `${functionName} terminator is missing`);
  return sql.slice(functionStart, functionEnd + "$$ LANGUAGE plpgsql".length);
}

describe("recurring transaction database contracts", () => {
  it("terminates the materialization function with a valid dollar quote", () => {
    const definition = getFunctionDefinition(
      historicalMigration,
      "materialize_monthly_recurring_transactions",
    );
    assert.match(definition, /END;\s*\$\$ LANGUAGE plpgsql$/);
  });

  it("defines an atomic RPC for every recurring-state update", () => {
    const definition = getFunctionDefinition(
      atomicityMigration,
      "update_transaction_recurring_state",
    );
    assert.match(definition, /auth\.uid\(\) <> p_user_id/);
    assert.match(definition, /FOR UPDATE/);
    assert.match(definition, /INSERT INTO recurring_rules/);
    assert.match(definition, /UPDATE transactions/);
    assert.match(definition, /INSERT INTO recurring_occurrences/);
    assert.match(definition, /is_recurring = v_was_generated/);
    assert.doesNotMatch(definition, /DELETE FROM recurring_occurrences/);
    assert.match(atomicityMigration, /REVOKE EXECUTE ON FUNCTION update_transaction_recurring_state[\s\S]*?FROM PUBLIC/);
    assert.match(atomicityMigration, /GRANT EXECUTE ON FUNCTION update_transaction_recurring_state[\s\S]*?TO authenticated/);
  });

});
