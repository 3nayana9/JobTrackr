const express = require("express");
const pool = require("../db/pool");
const protect = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

// GET /api/applications/:id/notes
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notes WHERE application_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get notes error:", err.message);
    res.status(500).json({ message: "Could not fetch notes" });
  }
});

// POST /api/applications/:id/notes
router.post("/", protect, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: "Note content cannot be empty" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO notes (application_id, content) VALUES ($1, $2) RETURNING *",
      [req.params.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create note error:", err.message);
    res.status(500).json({ message: "Could not create note" });
  }
});

// DELETE /api/applications/:id/notes/:noteId
router.delete("/:noteId", protect, async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [req.params.noteId]);
    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete note error:", err.message);
    res.status(500).json({ message: "Could not delete note" });
  }
});

module.exports = router;