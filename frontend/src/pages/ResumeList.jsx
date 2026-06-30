import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";

export default function ResumeList() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await API.get("/resumes");
      setResumes(data);
    } catch {
      toast.error("Could not load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this resume?")) return;
    try {
      await API.delete(`/resumes/${id}`);
      toast.success("Resume deleted");
      fetchResumes();
    } catch {
      toast.error("Could not delete resume");
    }
  };

  if (loading) return <div className="loading-screen">Loading resumes...</div>;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h2 className="section-title">Your Resumes</h2>
        <button className="btn btn-primary" onClick={() => navigate("/resumes/new")}>
          + New Resume
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="empty-state">
          <p>No resumes yet. Create your first one tailored for a specific role.</p>
          <button className="btn btn-primary" onClick={() => navigate("/resumes/new")}>
            Create Resume
          </button>
        </div>
      ) : (
        <div className="resume-list">
          {resumes.map((r) => (
            <div key={r.id} className="resume-card" onClick={() => navigate(`/resumes/${r.id}`)}>
              <div>
                <h3 className="resume-card-title">{r.title}</h3>
                <p className="resume-card-date">
                  Updated {new Date(r.updated_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>
              </div>
              <button className="btn-delete-note" onClick={(e) => handleDelete(r.id, e)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}