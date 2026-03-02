import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";

/**
 * Local development helper:
 * Vercel serverless functions do NOT always load .env/.env.local automatically under `vercel dev`
 * for non-Next.js projects. This loader reads env values from local files when missing.
 *
 * - In production on Vercel: uses process.env as usual.
 * - Locally: tries `.env.local`, `.env`, and `.vercel/.env.development.local`.
 */
function loadLocalEnvIfMissing(keys: string[]) {
  try {
    const missing = keys.filter((k) => !process.env[k]);
    if (!missing.length) return;

    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, ".env.local"),
      path.join(cwd, ".env"),
      path.join(cwd, ".vercel", ".env.development.local"),
      path.join(cwd, ".vercel", ".env.local"),
    ];

    const contentParts: string[] = [];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        contentParts.push(fs.readFileSync(file, "utf8"));
      }
    }
    if (!contentParts.length) return;

    const content = contentParts.join("\n");
    for (const lineRaw of content.split(/\r?\n/)) {
      const line = lineRaw.trim();
      if (!line || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const k = line.slice(0, eq).trim();
      if (!k) continue;

      // Only set keys we care about (avoid accidental overrides)
      if (!keys.includes(k)) continue;

      let v = line.slice(eq + 1).trim();

      // Remove surrounding quotes if present
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }

      if (!process.env[k] && v) {
        process.env[k] = v;
      }
    }
  } catch {
    // never crash the API due to env loading
  }
}

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

  // Try to load locally (dev) if Vercel didn't inject env vars.
  loadLocalEnvIfMissing(["ADMIN_EMAILS", "ADMIN_PASSWORDS"]);

  const emailsRaw = process.env.ADMIN_EMAILS;
  const passwordsRaw = process.env.ADMIN_PASSWORDS;

  if (!emailsRaw || !passwordsRaw) {
    return res.status(500).json({
      ok: false,
      error:
        "Server admin env vars not configured correctly (ADMIN_EMAILS / ADMIN_PASSWORDS).",
    });
  }

  const emails = parseCsv(emailsRaw).map((e) => e.toLowerCase());
  const passwords = parseCsv(passwordsRaw);

  console.log("ADMIN_EMAILS raw:", emailsRaw);
  console.log(
    "ADMIN_PASSWORDS raw length:",
    passwordsRaw ? passwordsRaw.length : 0
  );

  if (!emails.length || !passwords.length || emails.length !== passwords.length) {
    return res.status(500).json({
      ok: false,
      error:
        "Server admin env vars not configured correctly (ADMIN_EMAILS / ADMIN_PASSWORDS).",
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