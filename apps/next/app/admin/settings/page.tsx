"use client";

import { useEffect, useState } from "react";
import { getSystemSettingsApi, updateSystemSettingsApi, getSystemLogsApi, SystemSettings } from "@zola/app/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSystemSettingsApi();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await getSystemLogsApi({ page: 1, limit: 50 });
      setLogs(data.items);
    } catch (error) {
      console.error("Failed to load logs:", error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await updateSystemSettingsApi(settings);
      alert("Settings saved successfully");
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Đang tải...</div>;
  }

  if (!settings) {
    return <div className="admin-empty">Không thể tải settings</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#e4e6eb" }}>
        System Settings
      </h1>

      <div className="admin-chart-container">
        <div className="admin-chart-title">General Settings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#e4e6eb", fontWeight: 600 }}>
              Maintenance Mode
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              <span>Enable maintenance mode</span>
            </label>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#e4e6eb", fontWeight: 600 }}>
              Registration Enabled
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
              />
              <span>Allow new user registration</span>
            </label>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#e4e6eb", fontWeight: 600 }}>
              Max Post Length
            </label>
            <input
              type="number"
              className="admin-filter-input"
              value={settings.maxPostLength}
              onChange={(e) => setSettings({ ...settings, maxPostLength: Number(e.target.value) })}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#e4e6eb", fontWeight: 600 }}>
              Max Media Per Post
            </label>
            <input
              type="number"
              className="admin-filter-input"
              value={settings.maxMediaPerPost}
              onChange={(e) => setSettings({ ...settings, maxMediaPerPost: Number(e.target.value) })}
            />
          </div>

          <div className="admin-modal-actions">
            <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-chart-container" style={{ marginTop: 24 }}>
        <div className="admin-chart-title">System Logs</div>
        {logs.length === 0 ? (
          <div className="admin-empty">Không có logs</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td>{log.eventType}</td>
                    <td>{(log as any).userId?.name || "System"}</td>
                    <td style={{ fontSize: 12, color: "#b0b3b8" }}>
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

