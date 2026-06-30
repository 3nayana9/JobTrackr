const express = require("express");
const pool = require("../db/pool");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/stats/summary
// Returns counts grouped by status for the dashboard cards
router.get("/summary", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT current_status, COUNT(*) AS count
       FROM applications
       WHERE user_id = $1
       GROUP BY current_status`,
      [req.user.id]
    );

    // Build a clean object like { applied: 5, interviewing: 2, offer: 1, rejected: 3 }
    const summary = { applied: 0, interviewing: 0, offer: 0, rejected: 0 };
    result.rows.forEach((row) => {
      summary[row.current_status] = parseInt(row.count);
    });

    res.json(summary);
  } catch (err) {
    console.error("Stats summary error:", err.message);
    res.status(500).json({ message: "Could not fetch stats" });
  }
});

// GET /api/stats/timeline
// Returns applications grouped by month for the chart
router.get("/timeline", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT TO_CHAR(applied_date, 'Mon YYYY') AS month,
              COUNT(*) AS count
       FROM applications
       WHERE user_id = $1
       GROUP BY month, DATE_TRUNC('month', applied_date)
       ORDER BY DATE_TRUNC('month', applied_date)`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Stats timeline error:", err.message);
    res.status(500).json({ message: "Could not fetch timeline" });
  }
});

module.exports = router;