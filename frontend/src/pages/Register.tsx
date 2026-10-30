import axios from "axios";
import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "farmer" as "farmer" | "buyer",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(form);
      navigate("/profile", { replace: true });
    } catch (err: unknown) {
      setError(
        axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || "Registration failed"
          : "Registration failed"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <div className="auth-switch">
          <button type="button" onClick={() => navigate("/login")}>Email sign in</button>
          <button type="button" className="active">Sign up</button>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              className="auth-input"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className="auth-input"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-role">Role</label>
            <select
              id="register-role"
              className="auth-select"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "farmer" | "buyer" })
              }
            >
              <option value="farmer">Farmer</option>
              <option value="buyer">Equipment Owner</option>
            </select>
          </div>
          <button type="submit" className="auth-button" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
