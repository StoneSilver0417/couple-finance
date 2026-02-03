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
  "Invalid API key": "서버 설정 오류가 발생했습니다. 관리자에게 문의하세요",
  "invalid claim: missing sub claim": "인증 정보가 올바르지 않습니다. 다시 로그인해주세요",

  // Rate limiting
  "For security purposes, you can only request this after": "보안을 위해 잠시 후 다시 시도해주세요",
  "Email rate limit exceeded": "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요",

  // 네트워크 관련
  "Failed to fetch": "네트워크 연결을 확인해주세요",
  "Network request failed": "네트워크 연결을 확인해주세요",
  "TypeError: Failed to fetch": "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요",

  // 데이터베이스 관련
  "duplicate key value violates unique constraint": "이미 존재하는 데이터입니다",
  "violates foreign key constraint": "연결된 데이터가 있어 삭제할 수 없습니다",
  "null value in column": "필수 입력 항목을 확인해주세요",

  // 권한 관련
  "permission denied": "권한이 없습니다",
  "JWT expired": "로그인이 만료되었습니다. 다시 로그인해주세요",

  // 가구 관련
  "Household not found": "가구를 찾을 수 없습니다",
  "Invalid invite code": "잘못된 초대 코드입니다",
  "Household is full": "가구 인원이 가득 찼습니다 (최대 2명)",
};

export function getKoreanErrorMessage(error: string | Error | unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // 정확히 일치하는 메시지 찾기
  if (errorMap[message]) {
    return errorMap[message];
  }

  // 부분 일치 검사
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // 매칭되지 않으면 일반 에러 메시지 반환
  console.error("Unhandled error message:", message);
  return "오류가 발생했습니다. 잠시 후 다시 시도해주세요";
}
