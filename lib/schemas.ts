import { z } from "zod";
import { dateStringSchema } from "./recurring/schemas.ts";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    message: "거래 유형이 올바르지 않습니다.",
  }),
  amount: z
    .number({ message: "금액은 숫자이어야 합니다." })
    .positive("금액은 0보다 큰 양수이어야 합니다.")
    .max(100_000_000_000, "금액이 너무 큽니다."),
  category_id: z.string().min(1, "카테고리를 선택해 주세요.").max(64),
  transaction_date: dateStringSchema,
  memo: z.string().max(500, "메모는 500자 이하이어야 합니다.").optional().nullable(),
  expense_type: z.enum(["fixed", "variable", "irregular"]).optional().nullable(),
  recurring_enabled: z.boolean().optional().default(false),
  recurring_end_date: dateStringSchema.optional().nullable(),
  update_recurring_rule: z.boolean().optional().default(true),
}).refine((data) => {
  if (data.recurring_enabled && data.recurring_end_date) {
    return data.recurring_end_date >= data.transaction_date;
  }
  return true;
}, {
  message: "종료일은 거래일 이후여야 합니다.",
  path: ["recurring_end_date"],
});

export const updateCategorySchema = z.object({
  id: z.string().uuid("유효하지 않은 카테고리 ID입니다."),
  name: z
    .string({ message: "카테고리 이름을 입력해 주세요." })
    .trim()
    .min(1, "카테고리 이름을 입력해 주세요.")
    .max(50, "카테고리 이름은 50자 이하이어야 합니다."),
  icon: z
    .string({ message: "아이콘을 선택해 주세요." })
    .trim()
    .min(1, "아이콘을 선택해 주세요.")
    .max(16, "아이콘이 너무 깁니다."),
  color: z
    .string({ message: "색상을 선택해 주세요." })
    .trim()
    .min(1, "색상을 선택해 주세요.")
    .max(16, "색상이 너무 깁니다."),
  expense_category: z
    .enum(["fixed", "variable", "irregular"], {
      message: "지출 유형이 올바르지 않습니다.",
    })
    .optional()
    .nullable(),
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

export {
  dateStringSchema,
  recurringRuleSchema,
  type RecurringRuleInput,
} from "./recurring/schemas.ts";
