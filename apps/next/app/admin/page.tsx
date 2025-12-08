"use client";

import { useEffect, useState } from "react";
import { getAdminDashboardStatsApi } from "@zola/app/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getAdminDashboardStatsApi();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return <div className="admin-loading">Đang tải...</div>;
  }

  if (!stats) {
    return <div className="admin-empty">Không thể tải dữ liệu</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#e4e6eb" }}>
        Dashboard
      </h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Total Users</div>
          <div className="admin-stat-card-value">{stats.users?.total?.toLocaleString() || 0}</div>
          <div className="admin-stat-card-change">
            {stats.users?.active || 0} active
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Total Posts</div>
          <div className="admin-stat-card-value">{stats.posts?.total?.toLocaleString() || 0}</div>
          <div className="admin-stat-card-change">
            {stats.posts?.active || 0} active
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Reports</div>
          <div className="admin-stat-card-value">{stats.reports?.total || 0}</div>
          <div className="admin-stat-card-change admin-stat-card-change--negative">
            {stats.reports?.pending || 0} pending
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Engagement (7d)</div>
          <div className="admin-stat-card-value">
            {(stats.engagement?.postsCreated || 0) + (stats.engagement?.reactionsGiven || 0) + (stats.engagement?.commentsCreated || 0)}
          </div>
          <div className="admin-stat-card-change">
            {stats.engagement?.postsCreated || 0} posts, {stats.engagement?.reactionsGiven || 0} reactions, {stats.engagement?.commentsCreated || 0} comments
          </div>
        </div>
      </div>

      <div className="admin-chart-container">
        <div className="admin-chart-title">Recent Activity</div>
        <div style={{ color: "#b0b3b8", fontSize: 14 }}>
          Charts sẽ được thêm sau khi cài đặt chart library (recharts hoặc chart.js)
        </div>
      </div>
    </div>
  );
}

