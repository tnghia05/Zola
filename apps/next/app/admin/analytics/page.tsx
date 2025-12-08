"use client";

import { useEffect, useState } from "react";
import { getAdminAnalyticsChartApi, getContentStatsApi } from "@zola/app/api";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [metric, setMetric] = useState("users");
  const [chartData, setChartData] = useState<any[]>([]);
  const [contentStats, setContentStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, metric]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [chart, content] = await Promise.all([
        getAdminAnalyticsChartApi(timeRange, metric),
        getContentStatsApi(timeRange),
      ]);
      setChartData(chart.data);
      setContentStats(content);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#e4e6eb" }}>
        Analytics
      </h1>

      <div className="admin-filters">
        <select
          className="admin-filter-select"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
        <select
          className="admin-filter-select"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          <option value="users">Users</option>
          <option value="posts">Posts</option>
          <option value="reactions">Reactions</option>
          <option value="comments">Comments</option>
        </select>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Posts Created</div>
          <div className="admin-stat-card-value">{contentStats?.posts || 0}</div>
          <div className="admin-stat-card-change">In selected period</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Reels Created</div>
          <div className="admin-stat-card-value">{contentStats?.reels || 0}</div>
          <div className="admin-stat-card-change">In selected period</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card-title">Stories Created</div>
          <div className="admin-stat-card-value">{contentStats?.stories || 0}</div>
          <div className="admin-stat-card-change">In selected period</div>
        </div>
      </div>

      <div className="admin-chart-container">
        <div className="admin-chart-title">{metric.charAt(0).toUpperCase() + metric.slice(1)} Over Time</div>
        {isLoading ? (
          <div className="admin-loading">Đang tải...</div>
        ) : chartData.length === 0 ? (
          <div className="admin-empty">Không có dữ liệu</div>
        ) : (
          <div style={{ color: "#b0b3b8", fontSize: 14 }}>
            Chart visualization sẽ được thêm sau khi cài đặt chart library (recharts hoặc chart.js)
            <div style={{ marginTop: 16 }}>
              <pre style={{ background: "#2c2d2e", padding: 16, borderRadius: 8, overflow: "auto" }}>
                {JSON.stringify(chartData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

