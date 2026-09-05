"use client";

import Link from "next/link";
import { WifiOff, RotateCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-mesh">
      <div className="w-full max-w-md space-y-6 glass-card p-8 rounded-3xl border border-white/80 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <WifiOff className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            인터넷 연결이 끊겼습니다
          </h1>
          <p className="text-sm text-text-secondary break-keep">
            네트워크 연결을 확인한 후 다시 시도해주세요. 부부가계부 앱의 주요 데이터는 보안을 위해 연결 시에만 동기화됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => typeof window !== "undefined" && window.location.reload()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-white transition-all hover:bg-primary-dark active:scale-95"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            다시 시도
          </button>
          <Link
            href="/"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-text-main transition-all hover:bg-slate-50 active:scale-95"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            메인으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
