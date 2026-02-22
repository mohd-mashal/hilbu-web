// FILE: api/admin-login.ts
// Secure admin login check (server-side). Works on Vercel and with `npx vercel dev`.

function parseCsv(v: any): string[] {
  return String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { email, password } = req.body || {};

    const inputEmail = String(email || "").trim().toLowerCase();
    const inputPass = String(password || "");

    if (!inputEmail || !inputPass) {
      res.status(400).json({ ok: false, error: "Missing email or password" });
      return;
    }

    // IMPORTANT: these MUST be server env vars (NO VITE_ prefix)
    const emails = parseCsv(process.env.ADMIN_EMAILS);
    const passwords = parseCsv(process.env.ADMIN_PASSWORDS);

    if (!emails.length || !passwords.length || emails.length !== passwords.length) {
      res.status(500).json({
        ok: false,
        error:
          "Server admin env vars not configured correctly (ADMIN_EMAILS / ADMIN_PASSWORDS).",
      });
      return;
    }

    const idx = emails.findIndex((e) => e.toLowerCase() === inputEmail);
    if (idx === -1) {
      res.status(401).json({ ok: false, error: "Invalid email or password" });
      return;
    }

    const expectedPass = passwords[idx] || "";
    if (inputPass !== expectedPass) {
      res.status(401).json({ ok: false, error: "Invalid email or password" });
      return;
    }

    // Minimal response. You can add token later if needed.
    res.status(200).json({ ok: true, email: emails[idx] });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}