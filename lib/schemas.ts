import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    message: "거래 유형이 올바르지 않습니다.",
  }),
  amount: z
    .number({ message: "금액은 숫자이어야 합니다." })
    .positive("금액은 0보다 큰 양수이어야 합니다.")
    .max(100_000_000_000, "금액이 너무 큽니다."),
  category_id: z.string().min(1, "카테고리를 선택해 주세요.").max(64),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다."),
  memo: z.string().max(500, "메모는 500자 이하이어야 합니다.").optional().nullable(),
  expense_type: z.enum(["fixed", "variable", "irregular"]).optional().nullable(),
});

export const assetSchema = z.object({
  name: z
    .string()
    .min(1, "자산 이름을 입력해 주세요.")
    .max(100, "자산 이름은 100자 이하이어야 합니다."),
  type: z.string().min(1, "자산 종류를 선택해 주세요.").max(50),
  current_amount: z
    .number({ message: "금액은 숫자이어야 합니다." })
    .min(0, "금액은 0 이상이어야 합니다.")
    .max(100_000_000_000, "금액이 너무 큽니다."),
  is_liability: z.boolean().default(false),
  owner_type: z.enum(["JOINT", "INDIVIDUAL"]),
  owner_profile_id: z.string().max(64).optional().nullable(),
});
