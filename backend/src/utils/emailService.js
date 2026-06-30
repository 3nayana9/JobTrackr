const nodemailer = require("nodemailer");
require("dotenv").config();

// Updated transporter config to handle Render's IPv6 / Port constraints
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Must be false for port 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // This forces Node to prioritize IPv4 connections over broken IPv6 networks
    rejectUnauthorized: false
  }
});

// Send a verification email with a clickable link
const sendVerificationEmail = async (req, email, name, token) => {
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const verificationUrl = `${hostUrl}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"JobTrackr" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your JobTrackr account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6;">JobTrackr</h1>
        <h2>Hey ${name}, welcome aboard! 👋</h2>
        <p>Thanks for signing up. Just one more step — verify your email address to activate your account.</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Verify My Email
        </a>
        <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">JobTrackr — Track your job hunt smarter.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };