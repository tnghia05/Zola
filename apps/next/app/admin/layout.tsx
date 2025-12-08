"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserId, getUserById } from "@zola/app/api";
import { AppLayout } from "@zola/app/components/AppLayout";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import "@zola/app/styles/admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
    role?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          router.push("/login");
          return;
        }

        const user = await getUserById(userId);
        setCurrentUser(user);

        // Check if user is admin or manager
        if (user.role === "admin" || user.role === "manager") {
          setIsAuthorized(true);
        } else {
          router.push("/feed");
        }
      } catch (error) {
        console.error("Failed to check auth:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#B0B3B8" }}>
        Đang tải...
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/posts", label: "Posts", icon: "📝" },
    { path: "/admin/reports", label: "Reports", icon: "🚨" },
    { path: "/admin/analytics", label: "Analytics", icon: "📈" },
    { path: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  const header = (
    <FacebookNavbarWeb
      currentUser={currentUser}
      onLogout={() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          window.location.href = "/login";
        }
      }}
    />
  );

  return (
    <AppLayout header={header} hideSidebars={true}>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h2>Admin Panel</h2>
          </div>
          <nav className="admin-nav">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`admin-nav-item ${pathname === item.path ? "admin-nav-item--active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.path);
                }}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </AppLayout>
  );
}

