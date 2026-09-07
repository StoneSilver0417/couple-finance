// Supabase 및 일반 에러 메시지를 사용자 친화적인 한글로 변환

const errorMap: Record<string, string> = {
  // 인증 관련
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다",
  "Email not confirmed": "이메일 인증이 완료되지 않았습니다",
  "User already registered": "이미 가입된 이메일입니다",
  "Password should be at least 6 characters": "비밀번호는 최소 6자 이상이어야 합니다",
  "Unable to validate email address: invalid format": "올바른 이메일 형식이 아닙니다",
  "Signup requires a valid password": "유효한 비밀번호를 입력해주세요",
  "User not found": "사용자를 찾을 수 없습니다",
  "Email link is invalid or has expired": "인증 링크가 만료되었습니다. 다시 시도해주세요",
  "Token has expired or is invalid": "인증이 만료되었습니다. 다시 로그인해주세요",
  "New password should be different from the old password": "새 비밀번호는 기존 비밀번호와 달라야 합니다",
  "Auth session missing!": "로그인이 필요합니다",
  "Auth session missing": "로그인이 필요합니다",
  "Invalid API key": "서버 설정 오류가 발생했습니다. 관리자에게 문의하세요",
  "invalid claim: missing sub claim": "인증 정보가 올바르지 않습니다. 다시 로그인해주세요",
  "Unauthorized": "권한이 없습니다",
  "unauthorized": "권한이 없습니다",
  "Authentication required": "로그인이 필요합니다",

  // Rate limiting
  "For security purposes, you can only request this after": "보안을 위해 잠시 후 다시 시도해주세요",
  "Email rate limit exceeded": "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요",
  "over_request_rate_limit": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요",
  "rate limit": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요",

  // 네트워크 관련
  "Failed to fetch": "네트워크 연결을 확인해주세요",
  "Network request failed": "네트워크 연결을 확인해주세요",
  "TypeError: Failed to fetch": "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요",
  "AbortError": "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요",
  "timeout": "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요",
  "ETIMEDOUT": "서버 연결 시간이 초과되었습니다",
  "ECONNREFUSED": "서버에 연결할 수 없습니다",

  "Duplicate key value violates unique constraint": "이미 존재하는 데이터입니다",
  "Violates foreign key constraint": "연결된 데이터가 있어 작업을 완료할 수 없습니다",
  "Violates check constraint": "입력된 값이 유효한 범위를 벗어났습니다",
  "Null value in column": "필수 입력 항목을 확인해주세요",
  "Permission denied": "권한이 없습니다",
  "Violates row-level security policy": "해당 데이터에 대한 접근 또는 수정 권한이 없습니다",
  "Row-level security": "해당 데이터에 대한 접근 또는 수정 권한이 없습니다",
  "PGRST116": "데이터를 찾을 수 없습니다",
  "JSON object requested, multiple (or no) rows returned": "데이터를 찾을 수 없습니다",
  "Invalid input syntax for type uuid": "유효하지 않은 식별자(ID) 형식입니다",
  "Invalid input syntax for type numeric": "금액 또는 숫자 형식이 올바르지 않습니다",
  "Invalid input syntax for type integer": "숫자 형식이 올바르지 않습니다",
  "Invalid input syntax for type date": "날짜 형식이 올바르지 않습니다",
  "Column": "데이터베이스 설정 오류가 발생했습니다",
  "On conflict": "데이터 저장 설정 오류가 발생했습니다",
  "JWT expired": "로그인이 만료되었습니다. 다시 로그인해주세요",

  // 가구 관련
  "Household not found": "가구를 찾을 수 없습니다",
  "Invalid invite code": "잘못된 초대 코드입니다",
  "Household is full": "가구 인원이 가득 찼습니다 (최대 2명)",
  "User does not belong to a household": "가구 소속 정보를 찾을 수 없습니다",
  "User does not belong to the specified household": "가구 소속 정보를 찾을 수 없거나 권한이 없습니다",
  "Invalid category for the specified household and type": "선택한 카테고리가 해당 가구 또는 거래 유형과 일치하지 않습니다",
};

function extractErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (Array.isArray(error) && error.length > 0) {
    return extractErrorMessage(error[0]);
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return obj.message;
    }
    if (typeof obj.error_description === "string" && obj.error_description.trim().length > 0) {
      return obj.error_description;
    }
    if (typeof obj.error === "string" && obj.error.trim().length > 0) {
      return obj.error;
    }
    if (obj.error && typeof obj.error === "object") {
      return extractErrorMessage(obj.error);
    }
    if (typeof obj.details === "string" && obj.details.trim().length > 0) {
      return obj.details;
    }
    if (typeof obj.hint === "string" && obj.hint.trim().length > 0) {
      return obj.hint;
    }
  }

  try {
    return String(error);
  } catch {
    return "Unknown error";
  }
}

export function getKoreanErrorMessage(error: string | Error | unknown): string {
  const message = extractErrorMessage(error);

  if (errorMap[message]) {
    return errorMap[message];
  }

  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  if (/[가-힣]/.test(message)) {
    return message;
  }

  console.error("Unhandled error message:", message);
  return "오류가 발생했습니다. 잠시 후 다시 시도해주세요";
}
