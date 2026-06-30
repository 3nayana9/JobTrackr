const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

const router = express.Router();

// Helper to generate a token for a user
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// POST /api/auth/register
// Creates a new user account
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password must be 8+ characters with uppercase, lowercase, number and special character"
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a random token for email verification
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, verified, verification_token) 
       VALUES ($1, $2, $3, FALSE, $4) 
       RETURNING id, name, email`,
      [name, email, hashedPassword, verificationToken]
    );

    const newUser = result.rows[0];

    // Send verification email — don't block registration if it fails
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr.message);
    }

    res.status(201).json({
      message: "Account created! Please check your email to verify your account.",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Something went wrong, try again" });
  }
});
// POST /api/auth/login
// Logs in an existing user and returns a token
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please enter email and password" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    // Add this after the isMatch check in login route
    if (!user.verified) {
      return res.status(401).json({ 
        message: "Please verify your email before logging in. Check your inbox." 
      });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the plain password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Logged in successfully",
      token: generateToken(user),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Something went wrong, try again" });
  }
});


// GET /api/auth/verify-email?token=xxx
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    await pool.query(
      "UPDATE users SET verified = TRUE, verification_token = NULL WHERE verification_token = $1",
      [token]
    );

    // Redirect to frontend with success message
    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
  } catch (err) {
    console.error("Verify email error:", err.message);
    res.status(500).json({ message: "Verification failed" });
  }
});
module.exports = router;