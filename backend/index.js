const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth");
const applicationRoutes = require("./src/routes/applications");
const companyRoutes = require("./src/routes/companies");
const statsRoutes = require("./src/routes/stats");
const noteRoutes = require("./src/routes/notes");
const resumeRoutes = require("./src/routes/resumes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/applications/:id/notes", noteRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/resumes", resumeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "JobTrackr API is live 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});