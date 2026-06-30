import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import API from "../api/axios";

export default function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Resume");
  const [content, setContent] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [applications, setApplications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(id !== "new");
  const previewRef = useRef(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
  fetchApplications();
  if (id !== "new") {
    fetchResume();
  } else {
    const preselectedAppId = searchParams.get("applicationId");
    if (preselectedAppId) {
      setApplicationId(preselectedAppId);
    }
  }
}, [id]);

  const fetchApplications = async () => {
    try {
      const { data } = await API.get("/applications");
      setApplications(data);
    } catch {
      // silently fail, dropdown will just be empty
    }
  };

  const fetchResume = async () => {
    try {
      const { data } = await API.get(`/resumes/${id}`);
      setTitle(data.title);
      setContent(data.content);
      setApplicationId(data.application_id || "");
    } catch {
      toast.error("Could not load resume");
      navigate("/resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id === "new") {
        const { data } = await API.post("/resumes", {
          title,
          content,
          application_id: applicationId || null,
        });
        toast.success("Resume created");
        navigate(`/resumes/${data.id}`, { replace: true });
      } else {
        await API.put(`/resumes/${id}`, {
          title,
          content,
          application_id: applicationId || null,
        });
        toast.success("Resume saved");
      }
    } catch {
      toast.error("Could not save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = previewRef.current;
    if (!element) return;

    toast.loading("Generating PDF...", { id: "pdf" });

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/\s+/g, "_")}.pdf`);

      toast.success("PDF downloaded!", { id: "pdf" });
    } catch {
      toast.error("Could not generate PDF", { id: "pdf" });
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  };

  if (loading) return <div className="loading-screen">Loading resume...</div>;

  return (
    <div className="page-container resume-editor-page">
      <button className="btn-back" onClick={() => navigate("/resumes")}>
        ← Back to Resumes
      </button>

      <div className="resume-editor-header">
        <input
          className="resume-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resume title (e.g. Frontend Developer Resume)"
        />
        <div className="resume-editor-actions">
          <button className="btn btn-outline" onClick={handleDownloadPDF}>
            Download PDF
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Resume"}
          </button>
        </div>
      </div>

      {/* Link this resume to a specific application */}
      <div className="resume-link-row">
        <label>Link to application:</label>
        <select
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
        >
          <option value="">— Not linked —</option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.role_title} @ {app.company_name}
            </option>
          ))}
        </select>
      </div>

      <div className="resume-editor-body">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder="Start writing your resume... Add your experience, skills, education..."
        />
      </div>

      <div className="resume-pdf-preview" ref={previewRef}>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}