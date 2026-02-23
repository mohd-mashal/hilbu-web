import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "crypto";

function stripQuotes(s: string) {
  const t = String(s ?? "").trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function parseCsv(v: any): string[] {
  return stripQuotes(String(v ?? ""))
    .split(",")
    .map((s) => stripQuotes(s).trim())
    .filter(Boolean);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const emailsRaw = process.env.ADMIN_EMAILS;
  const passwordsRaw = process.env.ADMIN_PASSWORDS;

  if (!emailsRaw || !passwordsRaw) {
    return res.status(500).json({
      ok: false,
      error: "Server admin env vars not configured correctly (ADMIN_EMAILS / ADMIN_PASSWORDS).",
    });
  }

  const emails = parseCsv(emailsRaw).map((e) => e.toLowerCase());
  const passwords = parseCsv(passwordsRaw);

  if (!emails.length || !passwords.length || emails.length !== passwords.length) {
    return res.status(500).json({
      ok: false,
      error: "Server admin env vars not configured correctly (ADMIN_EMAILS / ADMIN_PASSWORDS).",
    });
  }

  const body: any =
    typeof req.body === "string"
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body || {};

  const email = stripQuotes(String(body.email ?? "")).trim().toLowerCase();
  const password = stripQuotes(String(body.password ?? ""));

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing email or password" });
  }

  const idx = emails.findIndex((e) => e === email);
  if (idx === -1) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  if (!safeEqual(password, String(passwords[idx] ?? ""))) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  return res.status(200).json({ ok: true });
}