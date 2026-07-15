"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteGeminiApiKey,
  saveGeminiApiKey,
  type ReportActionState,
} from "@/lib/report-actions";

interface AiSettingsDialogProps {
  registered: boolean;
  maskedKey: string | null;
  reportHref: string;
  children: React.ReactNode;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full cursor-pointer rounded-xl font-bold"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          키 확인 중
        </>
      ) : (
        <>
          <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
          API 키 확인 후 저장
        </>
      )}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="h-11 cursor-pointer rounded-xl border-rose-200 font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      등록된 키 삭제
    </Button>
  );
}

export function AiSettingsDialog({
  registered,
  maskedKey,
  reportHref,
  children,
}: AiSettingsDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [, saveAction] = useActionState(
    async (previousState: ReportActionState, formData: FormData) => {
      const result = await saveGeminiApiKey(previousState, formData);
      if (result.success) {
        toast.success("Gemini API 키를 등록했습니다.");
        setIsOpen(false);
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    {} as ReportActionState,
  );

  const [, deleteAction] = useActionState(
    async () => {
      const result = await deleteGeminiApiKey();
      if (result.success) {
        toast.success("Gemini API 키를 삭제했습니다.");
        setIsOpen(false);
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    {} as ReportActionState,
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[2rem] border-white/70 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader className="p-6 pb-3 text-left">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl font-black text-text-main">
            Gemini API 키 관리
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            가구 구성원이 함께 사용할 월간 AI 보고서용 키를 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {registered ? (
            <>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-700">등록된 API 키</p>
                <p className="mt-1 font-mono text-lg font-black tracking-wide text-emerald-950">
                  {maskedKey || "등록됨"}
                </p>
              </div>

              <Link
                href={reportHref}
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                이번 달 보고서 보러가기
              </Link>

              <form action={deleteAction} className="flex justify-center">
                <DeleteButton />
              </form>
            </>
          ) : (
            <form action={saveAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key" className="font-bold">
                  Gemini API 키
                </Label>
                <Input
                  id="gemini-api-key"
                  name="apiKey"
                  type="password"
                  required
                  minLength={20}
                  maxLength={200}
                  autoComplete="off"
                  placeholder="Google AI Studio API 키를 입력하세요"
                  className="h-12 rounded-xl bg-white"
                />
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-800 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Google AI Studio에서 무료 키 발급
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-xs leading-relaxed">
                  키는 가구 데이터베이스에 <strong>평문으로 저장</strong>됩니다. 결제
                  수단을 연결하지 않은 무료 티어 전용 키를 발급해 사용하는 것을
                  권장합니다.
                </p>
              </div>

              <SaveButton />
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
