"use client";

import { useState, useActionState } from "react";
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
  Send,
  Loader2,
  Bug,
  Lightbulb,
  MessageSquare,
  CircleCheck,
  Inbox,
  MessageSquareText,
} from "lucide-react";
import {
  MyFeedbackList,
  type Feedback,
} from "@/components/settings/my-feedback-list";

interface ContactFormState {
  error?: string;
  success?: boolean;
}

// 버그 분석에 필요한 기기 정보를 제출 시점에 수집
function collectDeviceInfo(): string {
  return JSON.stringify({
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    language: window.navigator.language,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    url: window.location.href,
  });
}

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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState("inquiry");

  // 성공/실패 후처리를 effect 대신 액션 안에서 직접 수행 (React 19 useActionState)
  const [, formAction] = useActionState(
    async (prev: ContactFormState, formData: FormData) => {
      formData.set("deviceInfo", collectDeviceInfo());
      const result = await submitFeedback(prev, formData);

      if (result.success) {
        toast.success("소중한 의견 감사합니다! 꼼꼼히 확인하겠습니다.", {
          duration: 3000,
          icon: <CircleCheck className="h-4 w-4" aria-hidden="true" />,
        });
        setIsOpen(false);
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    {} as ContactFormState,
  );

  const fetchFeedbacks = async () => {
    try {
      const data = await getMyFeedbacks();
      setFeedbacks(data);
    } catch (error) {
      console.error("문의 내역 조회 실패:", error);
    }
  };

  // 데이터 로딩은 effect 대신 탭 전환/다이얼로그 오픈 이벤트에서 직접 수행
  function handleTabChange(tab: string) {
    setActiveTab(tab);
    if (tab === "history") void fetchFeedbacks();
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen);
    if (nextOpen && activeTab === "history") void fetchFeedbacks();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="px-6 mb-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
              <TabsTrigger
                value="inquiry"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <MessageSquareText className="mr-1.5 h-4 w-4" aria-hidden="true" />
                문의하기
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Inbox className="mr-1.5 h-4 w-4" aria-hidden="true" />
                내 문의함
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
            <form action={formAction} className="space-y-4">
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
