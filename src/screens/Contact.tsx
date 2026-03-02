import { useMemo, useState } from "react";
import "./Contact.css";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactTopic = "Support" | "Partnership" | "Investment" | "Media" | "Other";

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

  const [topic, setTopic] = useState<ContactTopic>("Investment");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const [msg, setMsg] = useState<string>("");

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number>(-1);

  const update = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const emailLooksOk = /\S+@\S+\.\S+/.test(form.email.trim());

  const canSend =
    form.name.trim().length >= 2 &&
    emailLooksOk &&
    form.subject.trim().length >= 2 &&
    form.message.trim().length >= 10;

  function applyTopic(t: ContactTopic) {
    setTopic(t);

    const subjectMap: Record<ContactTopic, string> = {
      Investment: "Investment Inquiry — HILBU",
      Partnership: "Partnership Inquiry — HILBU",
      Support: "Support Request — HILBU",
      Media: "Media Inquiry — HILBU",
      Other: "General Inquiry — HILBU",
    };

    const s = subjectMap[t] || "General Inquiry — HILBU";
    setForm((p) => {
      const shouldReplace =
        p.subject.trim().length === 0 ||
        Object.values(subjectMap).includes(p.subject.trim());
      return { ...p, subject: shouldReplace ? s : p.subject };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || loading) return;

    setLoading(true);
    setOk(null);
    setMsg("");

    try {
      const payload = {
        ...form,
        topic,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send. Try again.");

      setOk(true);
      setMsg("Thanks! We received your message and will get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setTopic("Investment");
      setOpenFaq(0);
    } catch (err: any) {
      setOk(false);
      setMsg(err?.message || "Failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const faqs = [
    {
      q: "How fast do you usually reply?",
      a: "We aim to respond as soon as possible. For investment or partnership inquiries, include your availability so we can schedule quickly.",
    },
    {
      q: "What should investors include in the message?",
      a: "Please include your name, company (if any), preferred contact method, and what you want to explore (equity, funding amount, timeline). If you have a deck request, mention it.",
    },
    {
      q: "Is my message confidential?",
      a: "Yes. Your details are used only to reply to your inquiry. We do not sell your data.",
    },
  ];

  return (
    <div className="contact-page">
      <div className="contact-shell">
        <div className="contact-hero">
          <div className="contact-heroTop">
            <div className="contact-kicker">
              <span className="dot" />
              <span>HILBU • Car Recovery Service</span>
            </div>

            <h1 className="contact-title">
              Let’s talk. <span className="accentText">Support</span>,{" "}
              <span className="accentText">partnerships</span>, or{" "}
              <span className="accentText">investors</span>.
            </h1>

            <p className="contact-sub">
              Use the form below. If you’re contacting us about investment or
              partnerships, include what you’re looking for and the best time to
              contact you.
            </p>

            <div className="contact-badges">
              <div className="badge">
                <span className="badgeIcon">⚡</span>
                <div className="badgeText">
                  <div className="badgeTitle">Fast response</div>
                  <div className="badgeSub">We reply as soon as possible</div>
                </div>
              </div>

              <div className="badge">
                <span className="badgeIcon">🔒</span>
                <div className="badgeText">
                  <div className="badgeTitle">Confidential</div>
                  <div className="badgeSub">Your details stay private</div>
                </div>
              </div>

              <div className="badge">
                <span className="badgeIcon">🌍</span>
                <div className="badgeText">
                  <div className="badgeTitle">UAE-first</div>
                  <div className="badgeSub">Built for real emergencies</div>
                </div>
              </div>
            </div>

            {/* ✅ NEW: FAQ accordion replaces the empty space */}
            <div className="faqCard">
              <div className="faqTitle">Quick FAQs</div>
              <div className="faqList">
                {faqs.map((f, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`faqItem ${isOpen ? "open" : ""}`}
                      onClick={() => setOpenFaq((p) => (p === idx ? -1 : idx))}
                      aria-expanded={isOpen}
                    >
                      <div className="faqQ">
                        <span className="faqQText">{f.q}</span>
                        <span className="faqChevron">{isOpen ? "−" : "+"}</span>
                      </div>
                      <div className="faqA">{f.a}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="contact-note">
              Tip: For investors, add your preferred contact method and
              availability inside the message.
            </div>
          </div>

          <div className="contact-sideCard">
            <div className="sideHeader">
              <div className="sidePill">Quick Topic</div>
              <div className="sideTitle">Choose a topic</div>
              <div className="sideSub">
                This will pre-fill a professional subject line.
              </div>
            </div>

            <div className="topicGrid">
              {(
                ["Investment", "Partnership", "Support", "Media", "Other"] as ContactTopic[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`topicBtn ${topic === t ? "active" : ""}`}
                  onClick={() => applyTopic(t)}
                >
                  <span className="topicName">{t}</span>
                  <span className="topicHint">
                    {t === "Investment"
                      ? "Pitch, deck, call"
                      : t === "Partnership"
                      ? "Business, vendors"
                      : t === "Support"
                      ? "Help with the app"
                      : t === "Media"
                      ? "Press, interviews"
                      : "Anything else"}
                  </span>
                </button>
              ))}
            </div>

            <div className="sideMini">
              <div className="miniRow">
                <span className="miniDot" />
                <span>Modern, clean, bilingual product</span>
              </div>
              <div className="miniRow">
                <span className="miniDot" />
                <span>Designed for emergency speed</span>
              </div>
              <div className="miniRow">
                <span className="miniDot" />
                <span>Built for UAE operations & growth</span>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-head">
            <h2>Send a message</h2>
            <p>
              Fill the form below and we will get back to you as soon as
              possible.
            </p>
          </div>

          <form onSubmit={onSubmit} className="contact-form">
            <div className="row">
              <div className="field">
                <label>Your Name</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label>Your Email</label>
                <input
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                />
                {!emailLooksOk && form.email.trim().length > 0 && (
                  <div className="helper bad">Please enter a valid email.</div>
                )}
              </div>
            </div>

            <div className="field">
              <label>Subject</label>
              <input
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="Example: Investment Inquiry — HILBU"
              />
              <div className="helper">
                Selected topic: <b>{topic}</b>
              </div>
            </div>

            <div className="field">
              <label>Message</label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Write your message here..."
                rows={7}
              />
              <div className="helper">
                {Math.max(0, 10 - form.message.trim().length)} characters left to
                enable send (minimum 10).
              </div>
            </div>

            {ok !== null && (
              <div className={`notice ${ok ? "ok" : "bad"}`}>{msg}</div>
            )}

            <button
              className="contact-send"
              type="submit"
              disabled={!canSend || loading}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

            <div className="fineprint">
              By sending, you agree we may contact you back about your inquiry.
              We do not sell your data.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}