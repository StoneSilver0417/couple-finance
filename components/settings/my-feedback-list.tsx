"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Feedback {
  id: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
  admin_comment?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> =
  {
    bug: { label: "버그", icon: Bug, color: "text-red-500 bg-red-50" },
    suggestion: {
      label: "제안",
      icon: Lightbulb,
      color: "text-yellow-500 bg-yellow-50",
    },
    inquiry: {
      label: "문의",
      icon: MessageSquare,
      color: "text-blue-500 bg-blue-50",
    },
    other: {
      label: "기타",
      icon: MessageSquare,
      color: "text-gray-500 bg-gray-50",
    },
  };

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "접수완료",
    color: "bg-gray-100 text-gray-600",
    icon: Clock,
  },
  in_progress: {
    label: "처리중",
    color: "bg-blue-100 text-blue-600",
    icon: Clock,
  },
  resolved: {
    label: "답변완료",
    color: "bg-green-100 text-green-600",
    icon: CheckCircle2,
  },
  closed: {
    label: "종료됨",
    color: "bg-gray-200 text-gray-500",
    icon: CheckCircle2,
  },
};

export function MyFeedbackList({ feedbacks }: { feedbacks: Feedback[] }) {
  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[300px]">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <p className="font-bold text-gray-900 mb-1">
          작성한 문의 내역이 없습니다
        </p>
        <p className="text-sm text-gray-500">
          궁금한 점이나 제안하고 싶은 내용이 있다면
          <br /> 언제든 알려주세요!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full pr-4">
      <div className="space-y-4">
        {feedbacks.map((item) => {
          const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
          const statusInfo =
            STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

          return (
            <Card
              key={item.id}
              className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="p-4 bg-gray-50/50 flex flex-row items-center justify-between space-y-0 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                    <typeInfo.icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm text-gray-700">
                    {typeInfo.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium px-2 py-0.5 rounded-full bg-white border">
                    {format(new Date(item.created_at), "yyyy.MM.dd", {
                      locale: ko,
                    })}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`border-0 font-bold ${statusInfo.color}`}
                >
                  <statusInfo.icon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {item.admin_comment && (
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-blue-600">
                        답변 내용
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap pl-3.5 border-l-2 border-blue-200">
                      {item.admin_comment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
