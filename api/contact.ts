import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

type Body = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (safe for your web app)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, email, subject, message } = (req.body || {}) as Body;

    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim();
    const cleanSubject = (subject || "").trim();
    const cleanMessage = (message || "").trim();

    if (cleanName.length < 2) return res.status(400).json({ error: "Name is required" });
    if (cleanEmail.length < 5) return res.status(400).json({ error: "Email is required" });
    if (cleanSubject.length < 2) return res.status(400).json({ error: "Subject is required" });
    if (cleanMessage.length < 2) return res.status(400).json({ error: "Message is required" });

    const EMAIL_USER = process.env.EMAIL_USER || "";
    const EMAIL_PASS = process.env.EMAIL_PASS || "";

    if (!EMAIL_USER || !EMAIL_PASS) {
      return res.status(500).json({ error: "Server email is not configured (missing env vars)." });
    }

    // Hotmail/Outlook SMTP (works with App Password)
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3",
      },
    });

    const safeName = escapeHtml(cleanName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeSubject = escapeHtml(cleanSubject);
    const safeMessage = escapeHtml(cleanMessage).replace(/\n/g, "<br/>");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2 style="margin:0 0 10px">New Contact Message (HILBU Website)</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr/>
        <p>${safeMessage}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"HILBU Contact" <${EMAIL_USER}>`,
      to: "mohd-mashal@hotmail.com",
      replyTo: cleanEmail,
      subject: `HILBU Contact: ${cleanSubject}`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "Email send failed",
    });
  }
}