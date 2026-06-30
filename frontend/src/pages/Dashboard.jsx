import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ applied: 0, interviewing: 0, offer: 0, rejected: 0 });
  const [timeline, setTimeline] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, statsRes, timelineRes] = await Promise.all([
        API.get("/applications"),
        API.get("/stats/summary"),
        API.get("/stats/timeline"),
      ]);
      setApplications(appsRes.data);
      setStats(statsRes.data);
      setTimeline(timelineRes.data);
    } catch (err) {
      toast.error("Could not load your applications");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await API.delete(`/applications/${id}`);
      toast.success("Application removed");
      fetchData();
    } catch {
      toast.error("Could not delete");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/applications/${id}/status`, { status });
      toast.success("Status updated");
      fetchData();
    } catch {
      toast.error("Could not update status");
    }
  };

  // First filter by status tab, then filter by search query
  const filtered = applications
    .filter((a) => filter === "all" || a.current_status === filter)
    .filter((a) =>
      searchQuery === "" ||
      a.role_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) return <div className="loading-screen">Loading your applications...</div>;

  return (
    <div className="page-container">

      {/* Summary cards */}
      <div className="stats-grid">
        <StatCard label="Applied" count={stats.applied} color="#3b82f6" />
        <StatCard label="Interviewing" count={stats.interviewing} color="#f59e0b" />
        <StatCard label="Offers" count={stats.offer} color="#10b981" />
        <StatCard label="Rejected" count={stats.rejected} color="#ef4444" />
      </div>

      {/* Chart */}
      {timeline.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">Applications Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeline}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Header row */}
      <div className="dashboard-header">
        <h2 className="section-title">Your Applications ({filtered.length})</h2>
        <button className="btn btn-primary" onClick={() => navigate("/add")}>
          + Add Application
        </button>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by role or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {["all", "applied", "interviewing", "offer", "rejected"].map((s) => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No applications here yet.</p>
          <button className="btn btn-primary" onClick={() => navigate("/add")}>
            Add your first one
          </button>
        </div>
      ) : (
        <div className="applications-list">
          {filtered.map((app) => (
            <div key={app.id} className="app-card">
              <div className="app-card-left" onClick={() => navigate(`/application/${app.id}`)}>
                <h3 className="app-role">{app.role_title}</h3>
                <p className="app-company">{app.company_name}</p>
                {app.salary_min && (
                  <p className="app-salary">
                    ₹{app.salary_min.toLocaleString()} – ₹{app.salary_max?.toLocaleString()}
                  </p>
                )}
                <p className="app-date">
                  Applied {new Date(app.applied_date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>
              </div>
              <div className="app-card-right">
                <StatusBadge status={app.current_status} />
                <select
                  className="status-select"
                  value={app.current_status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                >
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  className="btn btn-danger-sm"
                  onClick={() => handleDelete(app.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}