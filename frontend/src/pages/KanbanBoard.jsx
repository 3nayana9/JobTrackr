import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import API from "../api/axios";

const COLUMNS = [
  { id: "applied", label: "Applied", color: "#3b82f6" },
  { id: "interviewing", label: "Interviewing", color: "#f59e0b" },
  { id: "offer", label: "Offer", color: "#10b981" },
  { id: "rejected", label: "Rejected", color: "#ef4444" },
];

export default function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await API.get("/applications");
      setApplications(data);
    } catch {
      toast.error("Could not load applications");
    } finally {
      setLoading(false);
    }
  };

  // Group applications by their current status into columns
  const getColumnItems = (status) =>
    applications.filter((app) => app.current_status === status);

  // Called when a card is dropped into a new column
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside any column, or dropped in the same spot
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;

    // Update UI immediately for a snappy feel
    setApplications((prev) =>
      prev.map((app) =>
        app.id === draggableId ? { ...app, current_status: newStatus } : app
      )
    );

    // Then sync with backend
    try {
      await API.put(`/applications/${draggableId}/status`, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
    } catch {
      toast.error("Could not update status");
      fetchApplications(); // revert on failure
    }
  };

  if (loading) return <div className="loading-screen">Loading board...</div>;

  return (
    <div className="kanban-page">
      <div className="kanban-header">
        <h2 className="section-title">Application Board</h2>
        <button className="btn btn-primary" onClick={() => navigate("/add")}>
          + Add Application
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-columns">
          {COLUMNS.map((col) => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header" style={{ borderTop: `3px solid ${col.color}` }}>
                <span>{col.label}</span>
                <span className="kanban-count">{getColumnItems(col.id).length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-dropzone ${snapshot.isDraggingOver ? "dragging-over" : ""}`}
                  >
                    {getColumnItems(col.id).map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-card ${snapshot.isDragging ? "dragging" : ""}`}
                            onClick={() => navigate(`/application/${app.id}`)}
                          >
                            <p className="kanban-card-role">{app.role_title}</p>
                            <p className="kanban-card-company">{app.company_name}</p>
                            {app.salary_min && (
                              <p className="kanban-card-salary">
                                ₹{(app.salary_min / 100000).toFixed(1)}L - ₹{(app.salary_max / 100000).toFixed(1)}L
                              </p>
                            )}
                            <p className="kanban-card-date">
                              {new Date(app.applied_date).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short"
                              })}
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {getColumnItems(col.id).length === 0 && (
                      <p className="kanban-empty">Drop applications here</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}