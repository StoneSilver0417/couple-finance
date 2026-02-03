"use client";

import ActivityLogSheet from "./activity-log-sheet";

interface Member {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface DashboardHeaderProps {
  members: Member[];
  householdName: string;
}

export default function DashboardHeader({
  members,
  householdName,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between p-6 pt-10">
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer">
          <div className="flex -space-x-4">
            {members && members.length > 0 ? (
              members.map((member, i) => (
                <div
                  key={member.id}
                  className="h-12 w-12 rounded-full ring-4 ring-white/90 bg-cover bg-center shadow-md transform transition group-hover:-translate-x-1 bg-gray-200 flex items-center justify-center text-lg"
                  style={{
                    backgroundImage: member.avatar_url
                      ? `url(${member.avatar_url})`
                      : undefined,
                    zIndex: 10 - i,
                  }}
                >
                  {!member.avatar_url && (member.full_name?.[0] || "U")}
                </div>
              ))
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 ring-4 ring-white/90" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-white h-6 w-6 flex items-center justify-center rounded-full ring-2 ring-white shadow-sm text-[10px] animate-bounce-subtle">
            ❤️
          </div>
        </div>
        <div>
          <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
            우리 가계부
          </p>
          <h2 className="text-xl font-black text-text-main leading-none tracking-tight">
            {householdName}
          </h2>
        </div>
      </div>
      <ActivityLogSheet />
    </header>
  );
}
