import React, { useEffect, useState } from "react";

type ApiResp = { ok: true } | { ok: false; error?: string };

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-auth");
    if (saved === "true") {
      window.location.href = "/Dashboard";
    }
  }, []);

  const handleLogin = async () => {
    if (loading) return;

    const cleanEmail = String(email || "").trim();
    const cleanPassword = String(password || "").trim();

    if (!cleanEmail || !cleanPassword) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data: ApiResp = await r.json().catch(() => ({ ok: false, error: "Bad server response" }));

      if (r.ok && (data as any).ok === true) {
        localStorage.setItem("admin-auth", "true");
        window.location.href = "/Dashboard";
        return;
      }

      alert((data as any).error || "Invalid email or password");
    } catch {
      alert("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <h2 style={styles.title}>Admin Login</h2>

      <input
        type="email"
        placeholder="Enter Admin Email"
        style={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
      />

      <input
        type="password"
        placeholder="Enter Admin Password"
        style={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleLogin();
        }}
      />

      <button style={{ ...styles.loginButton, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#FFDC00",
    padding: 14,
    borderRadius: 12,
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
    cursor: "pointer",
    border: "none",
  },
};