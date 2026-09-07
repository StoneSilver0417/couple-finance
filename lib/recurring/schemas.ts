import { z } from "zod";
import { MAX_AMOUNT } from "../validation.ts";

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.")
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && val === date.toISOString().split('T')[0];
  }, "실존하는 유효한 날짜여야 합니다.");

export const recurringRuleSchema = z.object({
  type: z.enum(["income", "expense"], {
    message: "거래 유형이 올바르지 않습니다.",
  }),
  expense_type: z.enum(["fixed", "variable", "irregular"]).nullable().optional(),
  amount: z
    .number({ message: "금액은 숫자이어야 합니다." })
    .positive("금액은 0보다 큰 양수이어야 합니다.")
    .max(MAX_AMOUNT, "금액이 너무 큽니다."),
  category_id: z.string().min(1, "카테고리를 선택해 주세요.").max(64),
  memo: z.string().max(500, "메모는 500자 이하이어야 합니다.").nullable().optional(),
  target_day: z
    .number({ message: "반복 일자는 숫자여야 합니다." })
    .int("반복 일자는 정수여야 합니다.")
    .min(1, "반복 일자는 1일 이상이어야 합니다.")
    .max(31, "반복 일자는 31일 이하이어야 합니다."),
  start_date: dateStringSchema,
  end_date: dateStringSchema.nullable().optional(),
  is_active: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === "expense" && !data.expense_type) {
      return false;
    }
    return true;
  },
  {
    message: "지출 유형이 올바르지 않습니다.",
    path: ["expense_type"],
  }
).refine(
  (data) => {
    if (!data.end_date) return true;
    return data.start_date <= data.end_date;
  },
  {
    message: "종료일은 시작일보다 빠를 수 없습니다.",
    path: ["end_date"],
  }
);

export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;
