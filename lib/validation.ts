// 서버 액션 공통 입력 검증 유틸
// 서버 액션 인자는 모두 클라이언트가 조작 가능한 외부 입력이므로 여기서 검증한다.

/** 금액 상한: 1천억 원 — 오타/악의적 입력으로 인한 집계 오염 방지 */
export const MAX_AMOUNT = 100_000_000_000;

/** 거래 금액: 0보다 크고 상한 이내의 유한한 수만 허용 */
export function parsePositiveAmount(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return null;
  }
  return amount;
}

/** 자산 금액: 잔액 0 계좌 등을 위해 0 이상 허용 */
export function parseNonNegativeAmount(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
    return null;
  }
  return amount;
}

/** 숫자 인자(예산 등): 0 이상 상한 이내의 유한한 수만 허용 */
export function isValidAmount(amount: number): boolean {
  return (
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    amount <= MAX_AMOUNT
  );
}

export function isTransactionType(
  value: unknown,
): value is "income" | "expense" {
  return value === "income" || value === "expense";
}

export function isExpenseType(
  value: unknown,
): value is "fixed" | "variable" | "irregular" {
  return value === "fixed" || value === "variable" || value === "irregular";
}

export function isAssetOwnerType(
  value: unknown,
): value is "JOINT" | "INDIVIDUAL" | "CHILD" {
  return value === "JOINT" || value === "INDIVIDUAL" || value === "CHILD";
}

export function isValidYearMonth(year: number, month: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

/** YYYY-MM-DD 형식이면서 실제로 파싱 가능한 날짜인지 확인 */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** 공백 제거 후 비어있지 않고 최대 길이 이내인 문자열만 반환 */
export function getTrimmedString(
  value: FormDataEntryValue | null,
  maxLength: number,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}
