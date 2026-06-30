const express = require("express");
const pool = require("../db/pool");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/companies?search=google
// Used for autocomplete when adding an application
router.get("/", protect, async (req, res) => {
  const { search } = req.query;

  try {
    let result;

    if (search) {
      result = await pool.query(
        "SELECT * FROM companies WHERE LOWER(name) LIKE LOWER($1) LIMIT 10",
        [`%${search}%`]
      );
    } else {
      result = await pool.query("SELECT * FROM companies ORDER BY name LIMIT 20");
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Get companies error:", err.message);
    res.status(500).json({ message: "Could not fetch companies" });
  }
});

// POST /api/companies
// Add a new company if it doesn't exist yet
router.post("/", protect, async (req, res) => {
  const { name, industry, location } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Company name is required" });
  }

  try {
    // Don't create duplicates — return existing one if found
    const existing = await pool.query(
      "SELECT * FROM companies WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      "INSERT INTO companies (name, industry, location) VALUES ($1, $2, $3) RETURNING *",
      [name, industry || null, location || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create company error:", err.message);
    res.status(500).json({ message: "Could not create company" });
  }
});

module.exports = router;