import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";
import StatusBadge from "../components/StatusBadge";

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkedResumes, setLinkedResumes] = useState([]);
  const [allResumes, setAllResumes] = useState([]);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const { data } = await API.get(`/applications/${id}`);
      setApp(data);

      const resumesRes = await API.get(`/resumes/application/${id}`);
      setLinkedResumes(resumesRes.data);

      const allRes = await API.get(`/resumes`);
      setAllResumes(allRes.data);
    } catch {
      toast.error("Could not load application");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await API.post(`/applications/${id}/notes`, { content: note });
      setNote("");
      toast.success("Note added");
      fetchApplication();
    } catch {
      toast.error("Could not add note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await API.delete(`/applications/${id}/notes/${noteId}`);
      toast.success("Note deleted");
      fetchApplication();
    } catch {
      toast.error("Could not delete note");
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await API.put(`/applications/${id}/status`, { status: e.target.value });
      toast.success("Status updated");
      fetchApplication();
    } catch {
      toast.error("Could not update status");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("application_id", id);

    try {
      await API.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Resume uploaded");
      fetchApplication();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleLinkExisting = async (resumeId) => {
    try {
      await API.put(`/resumes/${resumeId}/link`, { application_id: id });
      toast.success("Resume linked");
      setShowLinkPanel(false);
      fetchApplication();
    } catch {
      toast.error("Could not link resume");
    }
  };

  const handleViewResume = (r) => {
    if (r.source === "uploaded") {
      window.open(r.file_url, "_blank", "noopener,noreferrer");
    } else {
      navigate(`/resumes/${r.id}`);
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!app) return null;

  return (
    <div className="page-container">
      <button className="btn-back" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>

      <div className="detail-card">
        <div className="detail-header">
          <div>
            <h2 className="detail-role">{app.role_title}</h2>
            <p className="detail-company">{app.company_name}</p>
            {app.location && <p className="detail-meta">{app.location}</p>}
            {app.salary_min && (
              <p className="detail-meta">
                ₹{app.salary_min.toLocaleString()} – ₹{app.salary_max?.toLocaleString()} per year
              </p>
            )}
            <p className="detail-meta">
              Applied on {new Date(app.applied_date).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>
          <div className="detail-status-block">
            <StatusBadge status={app.current_status} />
            <select
              className="status-select"
              value={app.current_status}
              onChange={handleStatusChange}
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
            {app.job_url && (
              <a href={app.job_url} target="_blank" rel="noreferrer" className="btn btn-outline">
                View Job Posting ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Linked Resumes */}
      <div className="resumes-section-card">
        <div className="resumes-section-header">
          <h3 className="notes-title">Resumes for this application</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <label className="btn btn-outline" style={{ cursor: "pointer" }}>
              {uploading ? "Uploading..." : "Upload File"}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
            <button className="btn btn-outline" onClick={() => setShowLinkPanel(!showLinkPanel)}>
              Use Existing
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/resumes/new?applicationId=${id}`)}
            >
              + Build New
            </button>
          </div>
        </div>

        {showLinkPanel && (
          <div className="dropdown" style={{ position: "static", marginBottom: "12px" }}>
            {allResumes.length === 0 && <p className="empty-notes">No saved resumes yet.</p>}
            {allResumes.map((r) => (
              <div key={r.id} className="dropdown-item" onClick={() => handleLinkExisting(r.id)}>
                {r.title} <span className="dropdown-meta">· {r.source}</span>
              </div>
            ))}
          </div>
        )}

        {linkedResumes.length === 0 ? (
          <p className="empty-notes">No resume linked yet.</p>
        ) : (
          <div className="linked-resume-list">
            {linkedResumes.map((r) => (
              <div
                key={r.id}
                className="linked-resume-item"
                onClick={() => handleViewResume(r)}
              >
                <span>
                  {r.title} {r.source === "uploaded" && <span className="dropdown-meta">📎 uploaded</span>}
                </span>
                <span className="resume-card-date">
                  {new Date(r.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes section */}
      <div className="notes-card">
        <h3 className="notes-title">Notes</h3>
        <form onSubmit={handleAddNote} className="notes-form">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add interview notes, recruiter details, follow-up reminders..."
            rows={3}
          />
          <button type="submit" className="btn btn-primary">
            Add Note
          </button>
        </form>

        <div className="notes-list">
          {app.notes?.length === 0 && (
            <p className="empty-notes">No notes yet. Add one above.</p>
          )}
          {app.notes?.map((n) => (
            <div key={n.id} className="note-item">
              <p className="note-content">{n.content}</p>
              <div className="note-footer">
                <span className="note-date">
                  {new Date(n.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </span>
                <button
                  className="btn-delete-note"
                  onClick={() => handleDeleteNote(n.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}