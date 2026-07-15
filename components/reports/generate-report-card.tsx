"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateMonthlyReport,
  type ReportActionState,
} from "@/lib/report-actions";

interface GenerateReportCardProps {
  yearMonth: string;
  mode?: "initial" | "regenerate";
}

function GenerateSubmitContent({ mode }: { mode: "initial" | "regenerate" }) {
  const { pending } = useFormStatus();

  return (
    <>
      {mode === "initial" && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-dark shadow-sm ring-1 ring-primary/20">
          {pending ? (
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          ) : (
            <BrainCircuit className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
      )}

      {pending && mode === "initial" ? (
        <div className="mb-6 text-center" role="status" aria-live="polite">
          <h2 className="text-xl font-black text-text-main">
            AI가 한 달 가계부를 분석하고 있어요
          </h2>
          <p className="mt-2 text-sm font-medium text-text-secondary">
            창을 닫지 말고 잠시 기다려주세요. 최대 30초 정도 걸릴 수 있어요.
          </p>
        </div>
      ) : mode === "initial" ? (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-black text-text-main">
            이번 달의 금융 흐름을 돌아볼까요?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            앱이 계산한 집계를 바탕으로 Gemini가 실용적인 코멘트와 절약 팁을
            정리해드려요.
          </p>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className={
          mode === "initial"
            ? "h-12 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-primary-dark to-primary font-bold text-white shadow-lg shadow-primary/20 transition-colors"
            : "h-11 cursor-pointer rounded-xl bg-white px-4 font-bold text-primary-dark shadow-sm ring-1 ring-primary/20 hover:bg-primary/5"
        }
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {mode === "initial" ? "보고서 생성 중" : "다시 분석 중"}
          </>
        ) : mode === "initial" ? (
          <>
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            AI 보고서 만들기
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            보고서 다시 만들기
          </>
        )}
      </Button>
    </>
  );
}

export function GenerateReportCard({
  yearMonth,
  mode = "initial",
}: GenerateReportCardProps) {
  const router = useRouter();
  const [, formAction] = useActionState(
    async (previousState: ReportActionState, formData: FormData) => {
      const result = await generateMonthlyReport(previousState, formData);
      if (result.success) {
        toast.success(
          mode === "initial"
            ? "월간 AI 보고서를 만들었습니다."
            : "월간 AI 보고서를 새로 만들었습니다.",
        );
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    {} as ReportActionState,
  );

  return (
    <form
      action={formAction}
      className={
        mode === "initial"
          ? "glass-panel flex w-full flex-col items-center rounded-[2rem] border border-white/70 p-6 shadow-glass"
          : "flex justify-end"
      }
    >
      <input type="hidden" name="yearMonth" value={yearMonth} />
      <GenerateSubmitContent mode={mode} />
    </form>
  );
}
