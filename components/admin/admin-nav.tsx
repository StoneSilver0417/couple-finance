import Link from "next/link";

interface AdminNavProps {
  active: "feedbacks" | "users";
}

const items = [
  { key: "feedbacks" as const, href: "/admin/feedbacks", label: "피드백" },
  { key: "users" as const, href: "/admin/users", label: "사용자" },
];

export function AdminNav({ active }: AdminNavProps) {
  return (
    <nav
      aria-label="관리자 메뉴"
      className="glass-panel mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 p-1.5 shadow-sm"
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
