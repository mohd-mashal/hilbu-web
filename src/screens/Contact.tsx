import { useMemo, useState } from "react";
import "./Contact.css";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function Contact() {
  const API_URL = useMemo(() => {
    return (import.meta as any).env?.VITE_CONTACT_API_URL || "/api/contact";
  }, []);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const [msg, setMsg] = useState<string>("");

  const update = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const canSend =
    form.name.trim().length >= 2 &&
    form.email.trim().length >= 5 &&
    form.subject.trim().length >= 2 &&
    form.message.trim().length >= 10;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || loading) return;

    setLoading(true);
    setOk(null);
    setMsg("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send. Try again.");

      setOk(true);
      setMsg("Message sent successfully.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setOk(false);
      setMsg(err?.message || "Failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-card">
        <div className="contact-head">
          <h1>Contact Us</h1>
          <p>Send us your message and we will reply as soon as possible.</p>
        </div>

        <form onSubmit={onSubmit} className="contact-form">
          <div className="row">
            <div className="field">
              <label>Your Name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="field">
              <label>Your Email</label>
              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="Email address"
                type="email"
              />
            </div>
          </div>

          <div className="field">
            <label>Subject</label>
            <input
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Example: App Support / Complaint / Partnership"
            />
          </div>

          <div className="field">
            <label>Message</label>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Write your message here..."
              rows={6}
            />
          </div>

          {ok !== null && (
            <div className={`notice ${ok ? "ok" : "bad"}`}>{msg}</div>
          )}

          <button className="contact-send" type="submit" disabled={!canSend || loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}