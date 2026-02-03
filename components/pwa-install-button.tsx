"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS 체크
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // 이미 설치되어 있는지 체크
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Android/Desktop용 설치 프롬프트 이벤트 캡처
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-500/20 rounded-2xl text-green-300">
        <Check className="h-5 w-5" />
        <span className="font-bold">앱이 이미 설치되어 있습니다</span>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl">
          <Smartphone className="h-6 w-6 text-blue-400" />
          <div>
            <p className="font-bold text-sm">iOS에서 설치하기</p>
            <p className="text-xs text-gray-400">Safari 브라우저에서만 가능</p>
          </div>
        </div>
        <ol className="text-xs text-gray-400 space-y-2 pl-4">
          <li>1. Safari 하단의 <span className="text-white font-bold">공유 버튼</span> (□↑) 탭</li>
          <li>2. <span className="text-white font-bold">"홈 화면에 추가"</span> 선택</li>
          <li>3. <span className="text-white font-bold">"추가"</span> 버튼 탭</li>
        </ol>
      </div>
    );
  }

  if (installPrompt) {
    return (
      <Button
        onClick={handleInstall}
        className="w-full h-14 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
      >
        <Download className="mr-2 h-5 w-5" />
        앱 설치하기
      </Button>
    );
  }

  // Android에서 Chrome이 아닌 경우 또는 Desktop
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
          <span className="block text-xs font-bold text-gray-300 mb-1">iOS</span>
          <span className="text-[10px] text-gray-500">공유 → 홈 화면 추가</span>
        </div>
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
          <span className="block text-xs font-bold text-gray-300 mb-1">Android</span>
          <span className="text-[10px] text-gray-500">메뉴(⋮) → 앱 설치</span>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 text-center">
        Chrome/Safari 브라우저에서 설치할 수 있습니다
      </p>
    </div>
  );
}
