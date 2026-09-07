import { test } from "node:test";
import assert from "node:assert";
import { getKoreanErrorMessage } from "../lib/error-messages.ts";

test("getKoreanErrorMessage", async (t) => {
  await t.test("preserves human-readable Korean error messages", () => {
    const msg1 = getKoreanErrorMessage(new Error("반복 규칙 생성에 실패했습니다."));
    assert.strictEqual(msg1, "반복 규칙 생성에 실패했습니다.");

    const msg2 = getKoreanErrorMessage("선택한 카테고리는 수입용입니다.");
    assert.strictEqual(msg2, "선택한 카테고리는 수입용입니다.");
  });

  await t.test("maps exact auth errors", () => {
    const msg = getKoreanErrorMessage("Invalid login credentials");
    assert.strictEqual(msg, "이메일 또는 비밀번호가 올바르지 않습니다");
  });

  await t.test("maps RLS and constraint errors", () => {
    const rlsMsg = getKoreanErrorMessage(
      new Error("new row violates row-level security policy for table \"transactions\""),
    );
    assert.strictEqual(rlsMsg, "해당 데이터에 대한 접근 또는 수정 권한이 없습니다");

    const onConflictMsg = getKoreanErrorMessage({
      message: "there is no unique or exclusion constraint matching the ON CONFLICT specification",
    });
    assert.strictEqual(onConflictMsg, "데이터 저장 설정 오류가 발생했습니다");
  });

  await t.test("extracts error from nested Supabase error object", () => {
    const errObj = {
      error_description: "Email link is invalid or has expired",
    };
    assert.strictEqual(
      getKoreanErrorMessage(errObj),
      "인증 링크가 만료되었습니다. 다시 시도해주세요",
    );
  });

  await t.test("maps rate limiting and network errors", () => {
    const rateMsg = getKoreanErrorMessage("Email rate limit exceeded");
    assert.strictEqual(rateMsg, "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요");

    const netMsg = getKoreanErrorMessage(new Error("Failed to fetch"));
    assert.strictEqual(netMsg, "네트워크 연결을 확인해주세요");
  });

  await t.test("maps PostgREST and database schema errors with precision", () => {
    const schemaColMsg = getKoreanErrorMessage(
      new Error("Could not find the 'last_modified_by' column of 'transactions' in the schema cache"),
    );
    assert.strictEqual(
      schemaColMsg,
      "데이터베이스 스키마 오류: 'transactions' 테이블에 'last_modified_by' 컬럼이 존재하지 않습니다.",
    );

    const colRelMsg = getKoreanErrorMessage(
      "column \"recurring_rule_id\" of relation \"transactions\" does not exist",
    );
    assert.strictEqual(
      colRelMsg,
      "데이터베이스 스키마 오류: 'transactions' 테이블에 'recurring_rule_id' 컬럼이 존재하지 않습니다.",
    );

    const relMsg = getKoreanErrorMessage("relation \"recurring_rules\" does not exist");
    assert.strictEqual(
      relMsg,
      "데이터베이스 스키마 오류: 'recurring_rules' 테이블이 존재하지 않습니다.",
    );

    const fnMsg = getKoreanErrorMessage(
      "function create_transaction_with_recurring_rule(uuid, uuid, text, numeric, uuid, date, text, text, integer, date) does not exist",
    );
    assert.strictEqual(
      fnMsg,
      "데이터베이스 함수(RPC) 오류: 'create_transaction_with_recurring_rule' 함수가 존재하지 않습니다.",
    );
  });

  await t.test("correctly differentiates null value in column from schema errors", () => {
    const notNullMsg = getKoreanErrorMessage(
      "null value in column \"amount\" of relation \"transactions\" violates not-null constraint",
    );
    assert.strictEqual(notNullMsg, "필수 입력 항목을 확인해주세요");
  });

  await t.test("falls back gracefully for unknown English errors", () => {
    const msg = getKoreanErrorMessage("Some totally unrecognized internal error xyz123");
    assert.strictEqual(msg, "오류가 발생했습니다. 잠시 후 다시 시도해주세요");
  });
});
