"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm("정말 로그아웃 하시겠습니까?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("로그아웃되었습니다");
      router.push("/login");
    }
  };

  return (
    <div className="glass-panel p-5 rounded-[2rem] border border-red-100">
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        로그아웃
      </button>
    </div>
  );
}
