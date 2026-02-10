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
import { submitFeedback, getMyFeedbacks } from "@/lib/feedback-actions";
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
import { MyFeedbackList } from "@/components/settings/my-feedback-list";

// 오픈채팅방 링크 (추후 실제 링크로 교체 필요)
const KAKAO_OPEN_CHAT_URL = "";
// 개발자 이메일 (환경변수 설정 필요)
const EMAIL_ADDRESS =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@example.com";

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
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("inquiry");

  useEffect(() => {
    if (state.success) {
      toast.success("소중한 의견 감사합니다! 꼼꼼히 확인하겠습니다.", {
        duration: 3000,
        icon: "💌",
      });
      setIsOpen(false);
      // 성공 후 목록 갱신을 위해 탭 초기화 등 필요한 조치
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const fetchFeedbacks = async () => {
    try {
      const data = await getMyFeedbacks();
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    }
  };

  // 탭 변경 시 로딩
  useEffect(() => {
    if (activeTab === "history" && isOpen) {
      fetchFeedbacks();
    }
  }, [activeTab, isOpen]);

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 mb-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
              <TabsTrigger
                value="inquiry"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                📝 문의하기
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                📂 내 문의함
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="history"
            className="p-6 pt-2 space-y-4 focus-visible:ring-0 outline-none"
          >
            <MyFeedbackList feedbacks={feedbacks} />
          </TabsContent>

          <TabsContent
            value="inquiry"
            className="p-6 pt-2 focus-visible:ring-0 outline-none"
          >
            <div className="mb-6 bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="text-xs text-gray-600">
                  <p className="font-bold text-gray-800">
                    이메일로 직접 문의하기
                  </p>
                  <p>{EMAIL_ADDRESS}</p>
                </div>
              </div>
              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 text-blue-600 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                보내기
              </a>
            </div>

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
