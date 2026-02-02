"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Asset, Profile } from "@/types";

interface Member {
  id: string;
  full_name: string | null;
}

interface AssetFilterTabsProps {
  assets: Asset[];
  members: Member[];
  currentUserId: string;
  onFilterChange: (filteredAssets: Asset[], filterId?: string) => void;
}

export default function AssetFilterTabs({
  assets,
  members,
  currentUserId,
  onFilterChange,
}: AssetFilterTabsProps) {
  const [activeTab, setActiveTab] = useState("ALL");

  // Check conditions for showing tabs
  const hasSpouse = members.length > 1;
  const hasChildAssets = assets.some((a) => a.owner_type === "CHILD");
  const spouse = members.find((m) => m.id !== currentUserId);

  // Build tabs list
  const tabs = useMemo(() => {
    const tabList = [
      { id: "ALL", label: "전체" },
      { id: "JOINT", label: "공동" },
      { id: currentUserId, label: "나" },
    ];

    if (hasSpouse && spouse) {
      tabList.push({
        id: spouse.id,
        label: spouse.full_name?.split(" ")[0] || "배우자",
      });
    }

    if (hasChildAssets) {
      tabList.push({ id: "CHILD", label: "자녀" });
    }

    return tabList;
  }, [currentUserId, hasSpouse, hasChildAssets, spouse]);

  // Filter assets based on selected tab
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    let filtered: Asset[];

    if (tabId === "ALL") {
      filtered = assets;
    } else if (tabId === "JOINT") {
      filtered = assets.filter((a) => a.owner_type === "JOINT");
    } else if (tabId === "CHILD") {
      filtered = assets.filter((a) => a.owner_type === "CHILD");
    } else {
      // Individual user's assets
      filtered = assets.filter(
        (a) => a.owner_type === "INDIVIDUAL" && a.owner_profile_id === tabId
      );
    }

    onFilterChange(filtered, tabId);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full h-auto p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 flex gap-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex-1 rounded-xl py-2 px-3 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-dark transition-all"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
