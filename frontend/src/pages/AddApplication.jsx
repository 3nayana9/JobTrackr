import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";

export default function AddApplication() {
  const [form, setForm] = useState({
    role_title: "",
    job_url: "",
    salary_min: "",
    salary_max: "",
    applied_date: new Date().toISOString().split("T")[0],
  });
  const [companySearch, setCompanySearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // resume attachment state
  const [allResumes, setAllResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const { data } = await API.get("/resumes");
        setAllResumes(data);
      } catch {
        // non-blocking, ok to fail silently
      }
    };
    fetchResumes();
  }, []);

  // Search companies as user types
  useEffect(() => {
    if (companySearch.length < 2) {
      setCompanies([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get(`/companies?search=${companySearch}`);
        setCompanies(data);
      } catch {
        // silently fail on search
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setCompanySearch(company.name);
    setCompanies([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany) {
      toast.error("Please select or create a company");
      return;
    }
    setLoading(true);
    try {
      const { data: newApp } = await API.post("/applications", {
        ...form,
        company_id: selectedCompany.id,
      });

      // attach resume, if the user picked one
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        formData.append("application_id", newApp.id);
        await API.post("/resumes/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (selectedResumeId) {
        await API.put(`/resumes/${selectedResumeId}/link`, {
          application_id: newApp.id,
        });
      }

      toast.success("Application added!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add application");
    } finally {
      setLoading(false);
    }
  };

  const createAndSelectCompany = async () => {
    if (!companySearch.trim()) return;
    try {
      const { data } = await API.post("/companies", { name: companySearch });
      selectCompany(data);
      toast.success(`Company "${data.name}" added`);
    } catch {
      toast.error("Could not create company");
    }
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h2 className="form-title">Add New Application</h2>
        <p className="form-subtitle">Track a job you've applied to</p>

        <form onSubmit={handleSubmit} className="app-form">
          {/* Company search */}
          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setSelectedCompany(null);
              }}
              placeholder="Search or type a company name"
            />
            {companies.length > 0 && (
              <div className="dropdown">
                {companies.map((c) => (
                  <div key={c.id} className="dropdown-item" onClick={() => selectCompany(c)}>
                    {c.name} {c.location && <span className="dropdown-meta">· {c.location}</span>}
                  </div>
                ))}
              </div>
            )}
            {companySearch.length > 1 && !selectedCompany && companies.length === 0 && (
              <button type="button" className="btn-link" onClick={createAndSelectCompany}>
                + Add "{companySearch}" as new company
              </button>
            )}
            {selectedCompany && (
              <p className="selected-company">✓ {selectedCompany.name}</p>
            )}
          </div>

          <div className="form-group">
            <label>Role Title</label>
            <input
              type="text"
              name="role_title"
              value={form.role_title}
              onChange={handleChange}
              placeholder="Frontend Developer"
              required
            />
          </div>

          <div className="form-group">
            <label>Job URL <span className="optional">(optional)</span></label>
            <input
              type="url"
              name="job_url"
              value={form.job_url}
              onChange={handleChange}
              placeholder="https://careers.company.com/job/123"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Min Salary <span className="optional">(₹/year)</span></label>
              <input
                type="number"
                name="salary_min"
                value={form.salary_min}
                onChange={handleChange}
                placeholder="600000"
              />
            </div>
            <div className="form-group">
              <label>Max Salary <span className="optional">(₹/year)</span></label>
              <input
                type="number"
                name="salary_max"
                value={form.salary_max}
                onChange={handleChange}
                placeholder="900000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Date Applied</label>
            <input
              type="date"
              name="applied_date"
              value={form.applied_date}
              onChange={handleChange}
            />
          </div>

          {/* Resume attachment */}
          <div className="form-group">
            <label>Resume <span className="optional">(optional)</span></label>

            <select
              value={selectedResumeId}
              onChange={(e) => {
                setSelectedResumeId(e.target.value);
                if (e.target.value) setResumeFile(null);
              }}
              disabled={!!resumeFile}
            >
              <option value="">— Select an existing resume —</option>
              {allResumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.source})
                </option>
              ))}
            </select>

            <p className="form-subtitle" style={{ margin: "8px 0" }}>or upload a new file</p>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                setResumeFile(e.target.files[0] || null);
                if (e.target.files[0]) setSelectedResumeId("");
              }}
              disabled={!!selectedResumeId}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}