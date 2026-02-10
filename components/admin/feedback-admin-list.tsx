"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  Mail,
  Monitor,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { updateFeedbackAnswer } from "@/lib/admin-actions";
import { toast } from "sonner";

interface Feedback {
  id: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
  admin_comment?: string;
  contact_email?: string;
  device_info?: any;
  profiles?: {
    full_name: string;
    email: string;
  };
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
  pending: { label: "대기중", color: "bg-gray-100 text-gray-600", icon: Clock },
  in_progress: {
    label: "처리중",
    color: "bg-blue-100 text-blue-600",
    icon: Clock,
  },
  resolved: {
    label: "해결됨",
    color: "bg-green-100 text-green-600",
    icon: CheckCircle2,
  },
  closed: {
    label: "종료",
    color: "bg-gray-200 text-gray-500",
    icon: CheckCircle2,
  },
};

export function FeedbackAdminList({
  initialFeedbacks,
}: {
  initialFeedbacks: Feedback[];
}) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("resolved");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleUpdate = async (id: string) => {
    if (!comment.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await updateFeedbackAnswer(id, comment, status);
      toast.success("제출되었습니다.");

      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, admin_comment: comment, status: status } : f,
        ),
      );
      setReplyingId(null);
      setComment("");
    } catch (error) {
      toast.error("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {feedbacks.map((item) => {
        const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
        const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const isReplying = replyingId === item.id;
        const isExpanded = expandedId === item.id;

        return (
          <Card
            key={item.id}
            className="border border-gray-100 shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-all"
          >
            <CardHeader className="p-5 bg-gray-50/50 flex flex-row items-center justify-between space-y-0 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${typeInfo.color}`}>
                  <typeInfo.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900">
                      {typeInfo.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`border-0 font-bold px-2 py-0.5 rounded-lg ${statusInfo.color}`}
                    >
                      <statusInfo.icon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                    {format(new Date(item.created_at), "yyyy.MM.dd HH:mm", {
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {item.profiles?.full_name} ({item.profiles?.email})
                  </span>
                  {item.contact_email &&
                    item.contact_email !== item.profiles?.email && (
                      <span className="text-secondary ml-1">
                        • 회신: {item.contact_email}
                      </span>
                    )}
                </div>

                <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap bg-gray-50 p-4 rounded-2xl">
                  {item.content}
                </p>

                {isExpanded && item.device_info && (
                  <div className="flex items-start gap-2 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                    <Monitor className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                    <div className="text-[10px] text-indigo-600 font-mono break-all opacity-80">
                      {JSON.stringify(item.device_info, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              {item.admin_comment && !isReplying && (
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs font-black text-primary uppercase tracking-wider">
                      나의 답변
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-3.5 border-l-2 border-primary/30">
                    {item.admin_comment}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-[11px] h-8 rounded-lg font-bold text-gray-400 hover:text-primary transition-colors"
                    onClick={() => {
                      setReplyingId(item.id);
                      setComment(item.admin_comment || "");
                      setStatus(item.status);
                    }}
                  >
                    답변 수정하기
                  </Button>
                </div>
              )}

              {isReplying ? (
                <div className="space-y-3 pt-2 bg-gray-50/50 p-4 rounded-3xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-700">
                      답변 작성
                    </span>
                    <div className="flex gap-1 bg-white p-1 rounded-xl border">
                      {Object.entries(STATUS_CONFIG).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() => setStatus(key)}
                          className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${
                            status === key
                              ? "bg-gray-900 text-white"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {info.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="사용자에게 전달할 답변을 입력하세요..."
                    className="rounded-2xl border-gray-200 min-h-[120px] bg-white text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 rounded-xl h-11 font-black bg-gray-900 hover:bg-black text-white"
                      disabled={loading}
                      onClick={() => handleUpdate(item.id)}
                    >
                      {loading ? "제출 중..." : "답변 저장"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 font-bold border-gray-200"
                      onClick={() => {
                        setReplyingId(null);
                        setComment("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                !item.admin_comment && (
                  <Button
                    className="w-full rounded-2xl h-12 font-black bg-primary hover:bg-primary-dark text-white shadow-soft"
                    onClick={() => {
                      setReplyingId(item.id);
                      setComment("");
                      setStatus("resolved");
                    }}
                  >
                    답변 남기기
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
