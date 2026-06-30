const jwt = require("jsonwebtoken");

// This runs before every protected route
// It checks if the user has a valid token
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Token comes as "Bearer <token>" in the header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token found" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decode the token and attach user info to the request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};

module.exports = protect;