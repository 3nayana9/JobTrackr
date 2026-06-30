import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const validatePassword = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Must contain at least one number";
  if (!/[!@#$%^&*]/.test(password)) return "Must contain at least one special character (!@#$%^&*)";
  return null;
};

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", form);
      login(data.user, data.token);
      toast.success("Account created! Check your email to verify.");
      navigate("/verify-email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">JobTrackr</h1>
        <p className="auth-subtitle">Create your free account</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Thrinayana Pattoori"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 chars, uppercase, number, special"
              required
            />
            {form.password && (
              <div className="password-strength">
                <div className={`strength-bar ${
                  form.password.length >= 8 &&
                  /[A-Z]/.test(form.password) &&
                  /[a-z]/.test(form.password) &&
                  /[0-9]/.test(form.password) &&
                  /[!@#$%^&*]/.test(form.password)
                    ? "strong"
                    : form.password.length >= 6
                    ? "medium"
                    : "weak"
                }`} />
                <span className="strength-label">
                  {form.password.length >= 8 &&
                  /[A-Z]/.test(form.password) &&
                  /[a-z]/.test(form.password) &&
                  /[0-9]/.test(form.password) &&
                  /[!@#$%^&*]/.test(form.password)
                    ? "Strong password ✓"
                    : form.password.length >= 6
                    ? "Could be stronger"
                    : "Too weak"}
                </span>
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}