import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdmin, getAllFeedbacks } from "@/lib/admin-actions";
import { FeedbackAdminList } from "@/components/admin/feedback-admin-list";

export default async function AdminFeedbacksPage() {
  const isUserAdmin = await isAdmin();

  if (!isUserAdmin) {
    redirect("/settings");
  }

  const feedbacks = await getAllFeedbacks();

  return (
    <div className="flex-1 w-full animate-fade-in min-h-screen">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-10 sticky top-0 bg-[#FDFDFD]/80 backdrop-blur-xl z-20">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div>
          <p className="text-[10px] text-primary font-black tracking-widest uppercase mb-0.5">
            Admin Console
          </p>
          <h1 className="text-2xl font-black text-text-main tracking-tight">
            피드백 관리
          </h1>
        </div>
      </header>

      <main className="px-6">
        <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-indigo-500 mt-0.5" />
          <div className="text-xs text-indigo-700 leading-relaxed font-medium">
            <p className="font-bold mb-1">관리자 모드입니다.</p>
            <p>
              사용자들이 남긴 소중한 피드백을 확인하고 답변을 남겨보세요. 답변
              시 사용자 앱의 '내 문의함'에 즉시 반영됩니다.
            </p>
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Inbox className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              도착한 피드백이 없습니다
            </h3>
            <p className="text-sm text-gray-500">깨끗한 상태네요! 👍</p>
          </div>
        ) : (
          <FeedbackAdminList initialFeedbacks={feedbacks} />
        )}
      </main>
    </div>
  );
}
