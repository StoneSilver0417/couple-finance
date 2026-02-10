"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { submitFeedback } from "@/lib/feedback-actions";
import { toast } from "sonner";
import {
  MessageCircle,
  Mail,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

// 오픈채팅방 링크 (추후 실제 링크로 교체 필요)
const KAKAO_OPEN_CHAT_URL = "";
const EMAIL_ADDRESS = "developer@example.com"; // 개발자 이메일

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full rounded-xl h-12 font-bold bg-primary hover:bg-primary-dark transition-colors"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          전송 중...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          문의하기
        </>
      )}
    </Button>
  );
}

export function FeedbackDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(submitFeedback, {}); // React 19: useActionState
  const [deviceInfo, setDeviceInfo] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("소중한 의견 감사합니다! 꼼꼼히 확인하겠습니다.", {
        duration: 3000,
        icon: "💌",
      });
      setIsOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  // 기기 정보 수집
  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = {
        userAgent: window.navigator.userAgent,
        platform: window.navigator.platform,
        language: window.navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        url: window.location.href,
      };
      setDeviceInfo(JSON.stringify(info));
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none bg-white/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-black text-center">
            무엇을 도와드릴까요?
          </DialogTitle>
          <DialogDescription className="text-center">
            버그 제보나 기능 제안은 언제나 환영입니다!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="chat" className="w-full">
          <div className="px-6 mb-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
              <TabsTrigger
                value="chat"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                💬 실시간/이메일
              </TabsTrigger>
              <TabsTrigger
                value="form"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                📝 앱 내 문의
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="chat"
            className="p-6 pt-2 space-y-4 focus-visible:ring-0 outline-none"
          >
            <div className="space-y-3">
              <a
                href={KAKAO_OPEN_CHAT_URL || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => !KAKAO_OPEN_CHAT_URL && e.preventDefault()}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  KAKAO_OPEN_CHAT_URL
                    ? "bg-[#FAE100]/10 border-[#FAE100]/30 hover:bg-[#FAE100]/20 cursor-pointer"
                    : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${KAKAO_OPEN_CHAT_URL ? "bg-[#FAE100]" : "bg-gray-200"}`}
                >
                  💬
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">카카오톡 오픈채팅</h3>
                  <p className="text-xs text-gray-500">
                    {KAKAO_OPEN_CHAT_URL
                      ? "가장 빠르게 답변을 받을 수 있어요"
                      : "현재 준비 중입니다"}
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100/50 transition-all cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">이메일 문의</h3>
                  <p className="text-xs text-gray-500">{EMAIL_ADDRESS}</p>
                </div>
              </a>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center leading-relaxed">
              <p>
                평일 10:00 - 18:00 사이에 답변해 드립니다.
                <br />
                주말 및 공휴일은 답변이 지연될 수 있습니다.
              </p>
            </div>
          </TabsContent>

          <TabsContent
            value="form"
            className="p-6 pt-2 focus-visible:ring-0 outline-none"
          >
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="deviceInfo" value={deviceInfo} />

              <div className="space-y-2">
                <Label
                  htmlFor="type"
                  className="text-sm font-bold text-gray-700"
                >
                  문의 유형
                </Label>
                <Select name="type" defaultValue="inquiry">
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white h-11">
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" /> 버그 신고
                      </div>
                    </SelectItem>
                    <SelectItem value="suggestion">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" /> 기능
                        제안
                      </div>
                    </SelectItem>
                    <SelectItem value="inquiry">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" /> 일반
                        문의
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="content"
                  className="text-sm font-bold text-gray-700"
                >
                  내용
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="구체적인 내용을 적어주시면 큰 도움이 됩니다. (버그의 경우 발생 경로 등)"
                  className="rounded-xl border-gray-200 bg-white min-h-[120px] resize-none p-3 text-sm focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-bold text-gray-700"
                >
                  답변 받을 이메일 (선택)
                </Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="미입력 시 가입된 이메일로 답변"
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
