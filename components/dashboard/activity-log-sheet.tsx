"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Wallet,
  CreditCard,
  Tag,
} from "lucide-react";
import { getActivityLogs, ActivityLog } from "@/lib/activity-log-actions";

const ACTION_ICONS = {
  CREATE: <Plus className="w-3 h-3" />,
  UPDATE: <Edit className="w-3 h-3" />,
  DELETE: <Trash2 className="w-3 h-3" />,
};

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-600",
  UPDATE: "bg-blue-100 text-blue-600",
  DELETE: "bg-red-100 text-red-600",
};

const TARGET_ICONS = {
  TRANSACTION: <CreditCard className="w-4 h-4" />,
  ASSET: <Wallet className="w-4 h-4" />,
  BUDGET: <Tag className="w-4 h-4" />,
  CATEGORY: <Tag className="w-4 h-4" />,
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export default function ActivityLogSheet() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open]);

  async function loadLogs() {
    setLoading(true);
    const result = await getActivityLogs(30);
    if (result.data) {
      setLogs(result.data);
    }
    setLoading(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="group flex items-center justify-center h-11 w-11 rounded-full bg-white/60 hover:bg-white transition-all duration-300 backdrop-blur-sm border border-white/50 shadow-candy text-text-secondary relative">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform text-primary-dark fill-current" />
          {logs.length > 0 && (
            <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-hidden">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Bell className="w-5 h-5 text-primary-dark" />
            활동 기록
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(70vh-100px)] py-4 -mx-2 px-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">아직 활동 기록이 없어요</p>
              <p className="text-sm mt-1">
                거래나 자산을 추가하면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500">
                    {TARGET_ICONS[log.target_table] || (
                      <Tag className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ACTION_COLORS[log.action_type]}`}
                      >
                        {ACTION_ICONS[log.action_type]}
                        {log.action_type}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-main truncate">
                      {log.description}
                    </p>
                    {log.profiles?.full_name && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {log.profiles.full_name} 님이
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
