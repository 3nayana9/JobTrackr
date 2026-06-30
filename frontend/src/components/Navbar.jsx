import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        JobTrackr
      </Link>
      <div className="navbar-right">
        <Link to="/" className="nav-link">List View</Link>
        <Link to="/board" className="nav-link">Board View</Link>
        <Link to="/resumes" className="nav-link">Resumes</Link>
        <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <span className="navbar-user">Hey, {user?.name?.split(" ")[0]} 👋</span>
        <button onClick={handleLogout} className="btn btn-outline">
          Logout
        </button>
      </div>
    </nav>
  );
}