"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@zola/app/components/AppLayout";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { ReelsFeed } from "@zola/app/components/ReelsFeed.web";
import { Reel, getReelsFeedApi, getCurrentUserId } from "@zola/app/api";
import "@zola/app/styles/feed.css";

export default function ReelsPage() {
  const [initialReels, setInitialReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReels = async () => {
      try {
        const data = await getReelsFeedApi(undefined, 10);
        setInitialReels(data.items);
      } catch (error) {
        console.error("Failed to load reels:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadReels();
  }, []);

  const header = (
    <FacebookNavbarWeb
      currentUser={null}
      onLogout={() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          window.location.href = "/login";
        }
      }}
    />
  );

  if (isLoading) {
    return (
      <AppLayout header={header} hideSidebars={true}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            color: "#e4e6eb",
          }}
        >
          Đang tải...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout header={header} hideSidebars={true}>
      <ReelsFeed initialReels={initialReels} />
    </AppLayout>
  );
}

