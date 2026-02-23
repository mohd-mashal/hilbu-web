import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function safeText(v: any, max = 5000) {
  const s = String(v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function stripQuotes(s: string) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/**
 * Fallback loader for LOCAL dev only:
 * If vercel dev doesn't inject env into the function, read .env.local and set missing values.
 * On Vercel production this file doesn't exist, so it does nothing.
 */
function loadEnvFallback() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;

      const key = trimmed.slice(0, idx).trim();
      const value = stripQuotes(trimmed.slice(idx + 1).trim());

      if (key && process.env[key] == null) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  // ensure env exists locally
  loadEnvFallback();

  const to = (process.env.CONTACT_TO_EMAIL || "").trim();
  const apiKey = (process.env.RESEND_API_KEY || "").trim();

  if (!to || !apiKey) {
    return json(res, 500, {
      ok: false,
      error: "Server email env vars not configured",
      missing: {
        CONTACT_TO_EMAIL: !to,
        RESEND_API_KEY: !apiKey,
      },
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

  const name = safeText(body.name, 200);
  const email = safeText(body.email, 200);
  const message = safeText(body.message, 5000);
  const phone = safeText(body.phone, 100);
  const subjectFromUser = safeText(body.subject, 200);

  if (!name || !email || !message) {
    return json(res, 400, { ok: false, error: "Missing fields" });
  }

  const subject = subjectFromUser ? `HILBU Contact: ${subjectFromUser}` : `HILBU Contact Message`;

  const text =
`New message from HILBU Contact Form

Name: ${name}
Email: ${email}
Phone: ${phone || "-"}

Message:
${message}
`;

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "HILBU Contact <onboarding@resend.dev>",
      to: [to],
      replyTo: email,
      subject,
      text,
    });

    return json(res, 200, { ok: true });
  } catch (e) {
    console.error("RESEND ERROR:", e);
    return json(res, 500, { ok: false, error: "Email sending failed" });
  }
}