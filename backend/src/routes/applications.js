const express = require("express");
const pool = require("../db/pool");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/applications
// Fetch all applications for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name AS company_name, c.industry, c.location
       FROM applications a
       LEFT JOIN companies c ON a.company_id = c.id
       WHERE a.user_id = $1
       ORDER BY a.applied_date DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get applications error:", err.message);
    res.status(500).json({ message: "Could not fetch applications" });
  }
});

// POST /api/applications
// Add a new job application
router.post("/", protect, async (req, res) => {
  const { company_id, role_title, job_url, salary_min, salary_max, applied_date } = req.body;

  if (!role_title || !company_id) {
    return res.status(400).json({ message: "Role title and company are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO applications 
        (user_id, company_id, role_title, job_url, salary_min, salary_max, applied_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        company_id,
        role_title,
        job_url || null,
        salary_min || null,
        salary_max || null,
        applied_date || new Date(),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create application error:", err.message);
    res.status(500).json({ message: "Could not create application" });
  }
});

// GET /api/applications/:id
// Get a single application with its notes
router.get("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name AS company_name, c.industry, c.location
       FROM applications a
       LEFT JOIN companies c ON a.company_id = c.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Also grab all notes for this application
    const notes = await pool.query(
      "SELECT * FROM notes WHERE application_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );

    res.json({ ...result.rows[0], notes: notes.rows });
  } catch (err) {
    console.error("Get application error:", err.message);
    res.status(500).json({ message: "Could not fetch application" });
  }
});

// PUT /api/applications/:id/status
// Update just the status of an application
router.put("/:id/status", protect, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["applied", "interviewing", "offer", "rejected"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const result = await pool.query(
      `UPDATE applications 
       SET current_status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({ message: "Could not update status" });
  }
});

// PUT /api/applications/:id
// Update full application details
router.put("/:id", protect, async (req, res) => {
  const { role_title, job_url, salary_min, salary_max } = req.body;

  try {
    const result = await pool.query(
      `UPDATE applications
       SET role_title = $1, job_url = $2, salary_min = $3, salary_max = $4, updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [role_title, job_url, salary_min, salary_max, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update application error:", err.message);
    res.status(500).json({ message: "Could not update application" });
  }
});

// DELETE /api/applications/:id
// Remove an application (notes delete automatically via CASCADE)
router.delete("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: "Application deleted successfully" });
  } catch (err) {
    console.error("Delete application error:", err.message);
    res.status(500).json({ message: "Could not delete application" });
  }
});

module.exports = router;