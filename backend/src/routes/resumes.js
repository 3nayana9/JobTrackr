const express = require("express");
const pool = require("../db/pool");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/resumes
// Get all resumes for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get resumes error:", err.message);
    res.status(500).json({ message: "Could not fetch resumes" });
  }
});

// GET /api/resumes/application/:applicationId
// Must come BEFORE /:id route, otherwise Express treats "application" as an id
router.get("/application/:applicationId", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM resumes WHERE application_id = $1 AND user_id = $2",
      [req.params.applicationId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get linked resumes error:", err.message);
    res.status(500).json({ message: "Could not fetch linked resumes" });
  }
});


const multer = require("multer");
const cloudinary = require("../utils/cloudinary");

// Store file in memory, we'll stream it to Cloudinary ourselves
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF or Word documents are allowed"));
  },
});

// POST /api/resumes/upload
// Upload a resume file from device and link it to an application
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  const { application_id, title } = req.body;

  try {
    // Stream the buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: `jobtracker/resumes/${req.user.id}`,
          public_id: `${Date.now()}-${req.file.originalname}`,
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const result = await pool.query(
      `INSERT INTO resumes (user_id, application_id, title, source, file_url, file_name)
       VALUES ($1, $2, $3, 'uploaded', $4, $5)
       RETURNING *`,
      [
        req.user.id,
        application_id || null,
        title || req.file.originalname,
        uploadResult.secure_url,
        req.file.originalname,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Resume upload error (full):", err);
    res.status(500).json({ message: "Could not upload resume" });
  }
});

// PUT /api/resumes/:id/link
// Link an EXISTING resume (builder or uploaded) to an application
router.put("/:id/link", protect, async (req, res) => {
  const { application_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE resumes SET application_id = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [application_id || null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Link resume error:", err.message);
    res.status(500).json({ message: "Could not link resume" });
  }
});

// GET /api/resumes/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get resume error:", err.message);
    res.status(500).json({ message: "Could not fetch resume" });
  }
});

// POST /api/resumes
// Create a new resume
router.post("/", protect, async (req, res) => {
  const { title, content, application_id } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Resume title is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO resumes (user_id, application_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, application_id || null, title, content || ""]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create resume error:", err.message);
    res.status(500).json({ message: "Could not create resume" });
  }
});

// PUT /api/resumes/:id
// Update resume content (autosave will hit this often)
router.put("/:id", protect, async (req, res) => {
  const { title, content, application_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE resumes
       SET title = $1, content = $2, application_id = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, content, application_id || null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update resume error:", err.message);
    res.status(500).json({ message: "Could not update resume" });
  }
});

// DELETE /api/resumes/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json({ message: "Resume deleted" });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ message: "Could not delete resume" });
  }
});

module.exports = router;