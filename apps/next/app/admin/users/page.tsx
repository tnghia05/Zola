"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminUsersApi,
  banUserApi,
  unbanUserApi,
  updateUserRoleApi,
  verifyUserApi,
  unverifyUserApi,
  UserProfile,
} from "@zola/app/api";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    verified: "all",
    search: "",
  });

  useEffect(() => {
    loadUsers();
  }, [page, filters]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.role !== "all") params.role = filters.role;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.verified !== "all") params.verified = filters.verified;
      if (filters.search) params.search = filters.search;

      const data = await getAdminUsersApi(params);
      setUsers(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn ban user này?")) return;
    try {
      await banUserApi(userId);
      loadUsers();
    } catch (error) {
      alert("Failed to ban user");
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unbanUserApi(userId);
      loadUsers();
    } catch (error) {
      alert("Failed to unban user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: "user" | "admin" | "manager") => {
    if (!confirm(`Change role to ${newRole}?`)) return;
    try {
      await updateUserRoleApi(userId, newRole);
      loadUsers();
    } catch (error) {
      alert("Failed to update role");
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      await verifyUserApi(userId);
      loadUsers();
    } catch (error) {
      alert("Failed to verify user");
    }
  };

  const handleUnverify = async (userId: string) => {
    try {
      await unverifyUserApi(userId);
      loadUsers();
    } catch (error) {
      alert("Failed to unverify user");
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#e4e6eb" }}>
        Users Management
      </h1>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search users..."
          className="admin-filter-input"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="admin-filter-select"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
        <select
          className="admin-filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <select
          className="admin-filter-select"
          value={filters.verified}
          onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
        >
          <option value="all">All</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>
      </div>

      {isLoading ? (
        <div className="admin-loading">Đang tải...</div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">👥</div>
          <div className="admin-empty-text">Không có users nào</div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                          }}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{user.name || "N/A"}</span>
                        {user.isVerified && (
                          <span className="admin-verified-badge" title="Verified">✓</span>
                        )}
                      </div>
                    </td>
                    <td>{user.email || "N/A"}</td>
                    <td>
                      <select
                        value={user.role || "user"}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value as "user" | "admin" | "manager")
                        }
                        className="admin-filter-select admin-filter-select--small"
                        style={{ fontSize: 12, padding: "4px 8px" }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td>
                      {user.isBanned ? (
                        <span style={{ color: "#f02849" }}>Banned</span>
                      ) : (
                        <span style={{ color: "#42b72a" }}>Active</span>
                      )}
                    </td>
                    <td>
                      {user.isVerified ? (
                        <span style={{ color: "#1877f2" }}>✓ Verified</span>
                      ) : (
                        <span style={{ color: "#b0b3b8" }}>Not verified</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="admin-btn admin-btn--small admin-btn--secondary"
                          onClick={() => router.push(`/profile/${user._id}`)}
                        >
                          View
                        </button>
                        {user.isBanned ? (
                          <button
                            className="admin-btn admin-btn--small admin-btn--primary"
                            onClick={() => handleUnban(user._id)}
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            className="admin-btn admin-btn--small admin-btn--danger"
                            onClick={() => handleBan(user._id)}
                          >
                            Ban
                          </button>
                        )}
                        {user.isVerified ? (
                          <button
                            className="admin-btn admin-btn--small admin-btn--secondary"
                            onClick={() => handleUnverify(user._id)}
                          >
                            Unverify
                          </button>
                        ) : (
                          <button
                            className="admin-btn admin-btn--small admin-btn--primary"
                            onClick={() => handleVerify(user._id)}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}

