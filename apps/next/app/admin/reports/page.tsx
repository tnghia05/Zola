"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminReportsApi,
  getAdminReportDetailsApi,
  handleReportApi,
  bulkHandleReportsApi,
  PostReport,
} from "@zola/app/api";

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<PostReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<PostReport | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await getAdminReportsApi(params);
      setReports(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async (reportId: string, action: "resolve" | "dismiss", notes?: string) => {
    try {
      await handleReportApi(reportId, action, notes);
      loadReports();
      setSelectedReport(null);
    } catch (error) {
      alert("Failed to handle report");
    }
  };

  const handleBulkAction = async (action: "resolve" | "dismiss") => {
    if (selectedReports.size === 0) {
      alert("Please select reports");
      return;
    }
    if (!confirm(`Handle ${selectedReports.size} reports?`)) return;
    try {
      await bulkHandleReportsApi(Array.from(selectedReports), action);
      setSelectedReports(new Set());
      loadReports();
    } catch (error) {
      alert("Failed to handle reports");
    }
  };

  const toggleSelectReport = (reportId: string) => {
    const newSet = new Set(selectedReports);
    if (newSet.has(reportId)) {
      newSet.delete(reportId);
    } else {
      newSet.add(reportId);
    }
    setSelectedReports(newSet);
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#e4e6eb" }}>
        Reports Management
      </h1>

      <div className="admin-filters">
        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        {selectedReports.size > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => handleBulkAction("resolve")}
            >
              Resolve Selected ({selectedReports.size})
            </button>
            <button
              className="admin-btn admin-btn--secondary"
              onClick={() => handleBulkAction("dismiss")}
            >
              Dismiss Selected
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="admin-loading">Đang tải...</div>
      ) : reports.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🚨</div>
          <div className="admin-empty-text">Không có reports nào</div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedReports.size === reports.length && reports.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReports(new Set(reports.map((r) => r._id)));
                        } else {
                          setSelectedReports(new Set());
                        }
                      }}
                    />
                  </th>
                  <th>Reporter</th>
                  <th>Post</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const reporter = (report as any).reporterId || {};
                  const post = (report as any).postId || {};
                  return (
                    <tr key={report._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedReports.has(report._id)}
                          onChange={() => toggleSelectReport(report._id)}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {reporter.avatar ? (
                            <img
                              src={reporter.avatar}
                              alt={reporter.name}
                              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {reporter.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <span style={{ fontSize: 13 }}>{reporter.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>
                          {post.content || "(No content)"}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{report.reason}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              report.status === "PENDING"
                                ? "#f02849"
                                : report.status === "RESOLVED"
                                ? "#42b72a"
                                : "#1877f2",
                            color: "white",
                          }}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#b0b3b8" }}>
                        {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="admin-btn admin-btn--small admin-btn--secondary"
                            onClick={async () => {
                              try {
                                const details = await getAdminReportDetailsApi(report._id);
                                setSelectedReport(details);
                              } catch (error) {
                                alert("Failed to load report details");
                              }
                            }}
                          >
                            View
                          </button>
                          {report.status === "PENDING" && (
                            <>
                              <button
                                className="admin-btn admin-btn--small admin-btn--primary"
                                onClick={() => handleReport(report._id, "resolve")}
                              >
                                Resolve
                              </button>
                              <button
                                className="admin-btn admin-btn--small admin-btn--secondary"
                                onClick={() => handleReport(report._id, "dismiss")}
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="admin-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedReport && (
        <div className="admin-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Report Details</h3>
              <button className="admin-modal-close" onClick={() => setSelectedReport(null)}>
                ×
              </button>
            </div>
            <div style={{ color: "#e4e6eb" }}>
              <div style={{ marginBottom: 16 }}>
                <strong>Reporter:</strong> {(selectedReport as any).reporterId?.name || "Unknown"}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Reason:</strong> {selectedReport.reason}
              </div>
              {selectedReport.details && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Details:</strong> {selectedReport.details}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <strong>Status:</strong> {selectedReport.status}
              </div>
              {(selectedReport as any).postId && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Post Content:</strong> {(selectedReport as any).postId.content || "(No content)"}
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              {selectedReport.status === "PENDING" && (
                <>
                  <button
                    className="admin-btn admin-btn--primary"
                    onClick={() => handleReport(selectedReport._id, "resolve")}
                  >
                    Resolve
                  </button>
                  <button
                    className="admin-btn admin-btn--secondary"
                    onClick={() => handleReport(selectedReport._id, "dismiss")}
                  >
                    Dismiss
                  </button>
                </>
              )}
              <button className="admin-btn admin-btn--secondary" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

