import React from "react";
import { Link } from "react-router-dom";

const YELLOW = "#FFDC00";

export default function Terms() {
  const updated = new Date().toLocaleDateString();

  return (
    <div style={styles.page}>
      {/* Header (matches Home header) */}
      <div style={styles.siteHeader}>
        <div style={styles.headerLeft}>
          <img src="/icon.png" alt="HILBU" style={styles.headerLogo} />
          <span style={styles.headerTag}>Your Trusted Car Recovery Partner</span>
        </div>
        <div style={styles.headerRight}>
          <Link to="/" style={styles.headerPill}>Home</Link>
          <Link to="/privacy" style={styles.headerPill}>Privacy Policy</Link>
        </div>
      </div>
      <div style={styles.headerSpacer} />

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.title}>Terms & Conditions</h1>
          <p style={styles.kicker}>These terms govern the use of the HILBU platform.</p>
          <div style={styles.metaRow}>
            <span style={styles.badge}>Updated: {updated}</span>
            <span style={styles.dot} />
            <span style={styles.meta}>Mobile & Web</span>
          </div>
        </div>
        <div style={styles.heroArt}>
          <img src="/hero-truck.png" alt="HILBU Tow Truck" style={styles.heroImg} />
        </div>
      </section>

      {/* Content */}
      <main style={styles.container}>
        <Card n={1} title="Services">
          HILBU connects users with licensed recovery drivers via the HILBU apps and web. We are a technology platform and do not provide recovery services directly.
        </Card>

        <Card n={2} title="Eligibility">
          Users must be 16+ years old. Drivers must meet legal and operational standards and submit valid documentation.
        </Card>

        <Card n={3} title="User Responsibilities" bullets={[
          "Keep login credentials secure",
          "Provide accurate pickup/destination information",
          "Use the app respectfully and legally"
        ]} />

        <Card n={4} title="Driver Responsibilities" bullets={[
          "Submit valid ID and vehicle documents",
          "Update job statuses in real time",
          "Accept jobs only when available and safe"
        ]} />

        <Card n={5} title="Payment & Commission">
          HILBU deducts a 20% commission per trip for platform and support. Payments are settled outside the app; reporting is available to admins.
        </Card>

        <Card n={6} title="Location & Notifications">
          By using HILBU you agree to share your location for dispatching and safety, and to receive service-related notifications.
        </Card>

        <Card n={7} title="Suspension & Termination">
          Accounts may be suspended or terminated for violations, false documents, fraud, or abuse.
        </Card>

        <Card n={8} title="Limitation of Liability">
          HILBU is not liable for incidents between users and drivers. The contract for recovery services is between the user and the driver.
        </Card>

        <Card n={9} title="Contact">
          Questions? Email{" "}
          <a href="mailto:support@hilbu.com" style={styles.link}>support@hilbu.com</a>.
        </Card>

        <div style={styles.ctaRow}>
          <Link to="/" style={styles.ctaGhost}>← Back to Home</Link>
          <Link to="/privacy" style={styles.ctaSolid}>View Privacy Policy</Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <img src="/icon.png" alt="HILBU" style={styles.footerLogo} />
        <span>© {new Date().getFullYear()} HILBU Technologies</span>
      </footer>
    </div>
  );
}

function Card({
  n, title, children, bullets,
}: { n: number; title: string; children?: React.ReactNode; bullets?: string[] }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHead}>
        <span style={styles.num}>{n}</span>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>
      {bullets ? (
        <ul style={styles.list}>{bullets.map((b, i) => <li key={i} style={styles.li}>{b}</li>)}</ul>
      ) : (
        <p style={styles.body}>{children}</p>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "linear-gradient(180deg,#FFFCE6 0%,#FFF 100%)", minHeight: "100vh", color: "#000", fontFamily: "Poppins, sans-serif" },

  /* Header like Home */
  siteHeader: { position: "fixed", top: 0, left: 0, right: 0, height: 90, background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", zIndex: 100, boxShadow: "0 6px 16px rgba(0,0,0,.25)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 20 },
  headerLogo: { width: 150, height: 80, objectFit: "contain" },
  headerTag: { fontWeight: 700, fontSize: ".95rem", color: YELLOW },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  headerPill: { background: "#fff", color: "#000", border: `2px solid ${YELLOW}`, textDecoration: "none", padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: ".85rem" },
  headerSpacer: { height: 110 },

  hero: { maxWidth: 1200, margin: "24px auto 8px", padding: "24px 20px", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 20, alignItems: "center" },
  heroText: { padding: "14px 10px" },
  title: { fontSize: 40, lineHeight: 1.15, margin: 0, fontWeight: 900 },
  kicker: { margin: "10px 0 8px", color: "#333", fontSize: 16 },
  metaRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 6 },
  badge: { background: YELLOW, color: "#000", fontWeight: 800, padding: "6px 10px", borderRadius: 999, fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 999, background: "#bbb" },
  meta: { color: "#555", fontSize: 13 },

  heroArt: { display: "flex", justifyContent: "center" },
  heroImg: { width: 420, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,.15)" },

  container: { maxWidth: 980, margin: "8px auto 40px", padding: "0 16px" },

  card: { background: "#fff", borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: "0 6px 24px rgba(0,0,0,.06)", border: `1px solid rgba(0,0,0,.06)` },
  cardHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 6 },
  num: { width: 32, height: 32, borderRadius: 8, background: YELLOW, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900 },
  cardTitle: { fontSize: 20, margin: 0 },
  body: { color: "#333", margin: "8px 0 0", lineHeight: 1.7 },
  list: { paddingLeft: 20, margin: 0, color: "#333", lineHeight: 1.8 },
  li: { marginBottom: 6 },

  ctaRow: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20 },
  ctaGhost: { textDecoration: "none", color: "#000", border: "2px solid #000", padding: "10px 14px", borderRadius: 12, fontWeight: 800 },
  ctaSolid: { textDecoration: "none", color: "#000", background: YELLOW, padding: "10px 14px", borderRadius: 12, fontWeight: 800 },

  footer: { display: "flex", alignItems: "center", gap: 10, justifyContent: "center", background: "#000", color: "#fff", padding: "18px 16px" },
  footerLogo: { width: 34, height: 34, objectFit: "contain" },
};
