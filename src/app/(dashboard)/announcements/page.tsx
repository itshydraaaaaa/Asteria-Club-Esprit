import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Announcements & Bulletins"
        subtitle="Club-wide broadcasts, department notices, and Discord webhook sync"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <AnnouncementsFeed currentUser={user} />
      </div>
    </div>
  );
}
