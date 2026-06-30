import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const verified = searchParams.get("verified");

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1 className="auth-title">JobTrackr</h1>
        {verified ? (
          <>
            <div style={{ fontSize: "3rem", margin: "1rem 0" }}>🎉</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Email Verified!</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Your account is now active. You can sign in.
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: "3rem", margin: "1rem 0" }}>📧</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Check your email</h2>
            <p style={{ color: "#64748b" }}>
              We sent a verification link to your email. Click it to activate your account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}