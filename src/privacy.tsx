import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const YELLOW = "#FFDC00";
const IOS_URL =
  "https://apps.apple.com/us/app/hilbu/id6751604180?platform=iphone";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.hilbu.recovery";

/* Store badge with QR (same behavior as Home) */
function StoreBadgeWithQR({
  imgSrc,
  alt,
  href,
  label,
}: {
  imgSrc: string;
  alt: string;
  href: string;
  label: "iPhone" | "Android";
}) {
  const [show, setShow] = useState(false);
  const [allowHover, setAllowHover] = useState(true);

  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia("(hover: hover)");
      setAllowHover(!!mq?.matches);
    } catch {
      setAllowHover(true);
    }
  }, []);

  const QR_SIZE = 300;
  const LOGO_SIZE = 54;
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?` +
    `size=${QR_SIZE}x${QR_SIZE}&margin=8&ecc=H&format=png&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(
      href
    )}`;

  return (
    <div
      style={styles.storeBadgeWrap}
      onMouseEnter={() => allowHover && setShow(true)}
      onMouseLeave={() => allowHover && setShow(false)}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={alt}
        style={styles.storeBadgeLink}
      >
        <img src={imgSrc} alt={alt} style={styles.storeMiniIconActive} />
      </a>

      {allowHover && show && (
        <div style={styles.qrPopover}>
          <div style={styles.qrBox}>
            <div style={{ ...styles.qrCanvasWrap, width: QR_SIZE, height: QR_SIZE }}>
              <img
                src={qrUrl}
                alt={`${label} QR`}
                style={{ ...styles.qrImg, width: QR_SIZE, height: QR_SIZE }}
              />
              <div style={{ ...styles.qrLogoWrap, width: LOGO_SIZE, height: LOGO_SIZE }}>
                <img
                  src="/InvoiceLogo.png"
                  alt="HILBU"
                  style={{ width: LOGO_SIZE - 6, height: LOGO_SIZE - 6, objectFit: "contain" }}
                />
              </div>
            </div>
            <div style={styles.qrLabelSmall}>{label}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Privacy() {
  const updated = new Date().toLocaleDateString();

  return (
    <div style={styles.page}>
      {/* Header like Home */}
      <div style={styles.siteHeader}>
        <div style={styles.headerLeft}>
          <img src="/icon.png" alt="HILBU" style={styles.headerLogo} />
          <span style={styles.headerTag}>Your Trusted Car Recovery Partner</span>
        </div>
        <div style={styles.headerRight}>
          <Link to="/" style={styles.headerPill}>Home</Link>
          <Link to="/terms" style={styles.headerPill}>Terms &amp; Conditions</Link>
        </div>
      </div>
      <div style={styles.headerSpacer} />

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.kicker}>
            How HILBU collects, uses, and protects data across our mobile and web services.
          </p>
          <div style={styles.metaRow}>
            <span style={styles.badge}>Updated: {updated}</span>
            <span style={styles.dot} />
            <span style={styles.meta}>We respect your privacy</span>
          </div>
        </div>
        <div style={styles.heroArt}>
          <img src="/hero-truck.png" alt="HILBU Tow Truck" style={styles.heroImg} />
        </div>
      </section>

      <main style={styles.container}>
        <Card n={1} title="Information We Collect" bullets={[
          "Name, phone number, and optional email",
          "Real-time user and driver locations (with permission)",
          "Device model, OS version, and app identifiers",
          "Trip history, request logs, and timestamps",
          "Push tokens for service alerts",
        ]} />

        <Card n={2} title="How We Use Data" bullets={[
          "Match users with available recovery drivers",
          "Send status updates and service notifications",
          "Log trips, generate reports, and provide support",
          "Monitor performance and improve reliability",
        ]} />

        <Card n={3} title="Data Sharing">
          We do not sell your data. We only share with trusted providers (e.g., Firebase, Google Maps) to enable the service. Admin access is restricted and role-based.
        </Card>

        <Card n={4} title="Storage & Security">
          Data is encrypted in transit and at rest. We apply least-privilege access and industry best practices.
        </Card>

        <Card n={5} title="Your Choices & Rights" bullets={[
          "Access, update, or request deletion of your data",
          "Disable location access (may limit functionality)",
          "Control notification permissions from device settings",
        ]} />

        <Card n={6} title="Children’s Privacy">
          HILBU is not intended for children under 16 and we do not knowingly collect their data.
        </Card>

        <Card n={7} title="Policy Updates">
          We may update this Policy. Changes will appear on this page and, where appropriate, inside the app.
        </Card>

        <Card n={8} title="Contact">
          Questions? Email{" "}
          <a href="mailto:support@hilbu.com" style={styles.link}>support@hilbu.com</a>.
        </Card>

        <div style={styles.ctaRow}>
          <Link to="/" style={styles.ctaGhost}>← Back to Home</Link>
          <Link to="/terms" style={styles.ctaSolid}>View Terms &amp; Conditions</Link>
        </div>
      </main>

      {/* Footer (same as Home) */}
      <footer style={styles.homeFooter}>
        <div style={styles.footerLeft}>
          <img src="/icon.png" alt="HILBU" style={styles.footerLogo} />
          <span>© {new Date().getFullYear()} HILBU Technologies</span>
        </div>

        <div style={styles.footerStores}>
          <StoreBadgeWithQR
            imgSrc="/appstore.png"
            alt="Download on the App Store"
            href={IOS_URL}
            label="iPhone"
          />
          <StoreBadgeWithQR
            imgSrc="/playstore.png"
            alt="Get it on Google Play"
            href={ANDROID_URL}
            label="Android"
          />
        </div>

        <div style={styles.footerLinks}>
          <Link to="/terms" style={styles.footerLink}>Terms &amp; Conditions</Link>
          <Link to="/privacy" style={styles.footerLink}>Privacy Policy</Link>
        </div>
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

  /* Footer like Home (grid + QR popover support) */
  homeFooter: { display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16, padding: "18px 24px 28px", background: "#000", color: "#fff", width: "100%", boxSizing: "border-box" },
  footerLeft: { display: "flex", alignItems: "center", gap: 12, fontSize: ".98rem" },
  footerLogo: { width: 70, height: 46, objectFit: "contain" },
  footerStores: { display: "flex", alignItems: "center", gap: 12, justifySelf: "center" },
  footerLinks: { display: "flex", gap: 14, justifyContent: "flex-end" },
  footerLink: { color: YELLOW, textDecoration: "none", fontWeight: 700, borderBottom: "2px solid transparent" },

  /* Store badge + QR styles */
  storeMiniIconActive: { height: 36, opacity: 1, cursor: "pointer", borderRadius: 6, transition: "transform 0.12s ease" },
  storeBadgeLink: { display: "inline-flex", alignItems: "center" },
  storeBadgeWrap: { position: "relative", display: "inline-flex", alignItems: "center" },
  qrPopover: { position: "absolute", top: -360, left: "50%", transform: "translateX(-50%)", zIndex: 50, pointerEvents: "none" },
  qrBox: { background: "#fff", border: `2px solid ${YELLOW}`, borderRadius: 12, boxShadow: "0 10px 24px rgba(0,0,0,.25)", padding: 10, textAlign: "center" },
  qrCanvasWrap: { position: "relative", width: 300, height: 300 },
  qrImg: { width: 300, height: 300, display: "block" },
  qrLogoWrap: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px #fff" },
  qrLabelSmall: { marginTop: 6, fontSize: 12, fontWeight: 600, color: "#000" },
};
