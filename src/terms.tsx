// FILE: src/pages/Terms.tsx (web)
// Primary Color: #FFDC00 (Yellow), Secondary: Black, Modern clean UI

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const YELLOW = "#FFDC00";
const TERMS_VERSION = "2025-10-17";
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

export default function Terms() {
  return (
    <div style={styles.page}>
      {/* Header (matches Home) */}
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
          <h1 style={styles.title}>Terms &amp; Conditions <small style={styles.versionChip}>v{TERMS_VERSION}</small></h1>
          <p style={styles.kicker}>These terms govern the use of the HILBU mobile and web platform.</p>
          <div style={styles.metaRow}>
            <span style={styles.badge}>Applies to: Users &amp; Drivers</span>
            <span style={styles.dot} />
            <span style={styles.meta}>Mobile &amp; Web</span>
          </div>
        </div>
        <div style={styles.heroArt}>
          <img src="/hero-truck.png" alt="HILBU Tow Truck" style={styles.heroImg} />
        </div>
      </section>

      {/* Content — EXACTLY matches the app’s clauses */}
      <main style={styles.container}>
        <Card n={1} title="Services">
          HILBU connects users to recovery drivers through the HILBU apps and admin-managed system. Users submit requests, and drivers accept or reject jobs. HILBU is a technology platform and does not provide towing/recovery services.
        </Card>

        <Card n={2} title="Eligibility">
          Users must be 16 years or older. Drivers must have valid documents and meet all applicable local requirements.
        </Card>

        <Card n={3} title="Responsibilities">
          <ul style={styles.list}>
            <li style={styles.li}>Users must enter correct pickup/drop-off information.</li>
            <li style={styles.li}>Drivers must follow the job flow and update status (on the way, arrived, completed).</li>
            <li style={styles.li}>All parties must act respectfully and comply with applicable laws.</li>
          </ul>
        </Card>

        <Card n={4} title="Payment & Commission">
          HILBU may facilitate payments and deducts a 20% commission from each completed job for platform services. <strong>This deduction and final earnings calculations are visible in the admin panel only</strong> (not to users or drivers).
        </Card>

        <Card n={5} title="Notifications & Location">
          You allow HILBU to use your device location and send push/onsite notifications for trip updates and safety features.
        </Card>

        <Card n={6} title="Marketplace Disclaimer (HILBU Not a Carrier)">
          HILBU is a marketplace/platform only. HILBU does not provide towing/recovery services and is not a transportation carrier, workshop, or logistics company. All services are performed under a direct agreement between the User and the independent Driver. Any loss, damage, delay, negligence, mistake, or dispute before, during, or after a recovery — including but not limited to vehicle scratches, dents, mechanical/electrical damage, winching/towing incidents, load shifts, falling loads, improper securing, roadside actions, or route decisions — is strictly between the User and the Driver. HILBU is not a party to those dealings and bears no responsibility for them.
        </Card>

        <Card n={7} title="No Inspection, Guarantee, or Warranty">
          HILBU does not inspect, certify, endorse, supervise, or guarantee any Driver, vehicle, equipment, price, quote, ETA, route, advice, statement, or outcome. Information displayed in the platform is provided by Users/Drivers and may be approximate or subject to change.
        </Card>

        <Card n={8} title="Insurance & Risk">
          It is the sole responsibility of the Driver and/or User to ensure appropriate insurance coverage for recovery operations (including vehicle/cargo and third-party liability). By using the platform, both parties acknowledge the inherent risks of vehicle recovery and agree that HILBU is not liable for any direct, indirect, incidental, special, consequential, or punitive losses arising from or related to the service.
        </Card>

        <Card n={9} title="Indemnity">
          Users and Drivers agree to defend, indemnify, and hold harmless HILBU, its owners, affiliates, and staff from any claims, demands, liabilities, damages, losses, costs, and expenses (including legal fees) arising out of or related to: (a) their use of the platform, (b) their provision or receipt of services, or (c) breach of these Terms.
        </Card>

        <Card n={10} title="Safety & Compliance">
          Drivers and Users must comply with all applicable road, transport, safety, and equipment regulations. Drivers are solely responsible for their licenses, permits, and vehicle/equipment safety.
        </Card>

        <Card n={11} title="Disputes">
          Any dispute, claim, chargeback, or complaint concerning a recovery must be resolved directly between the User and the Driver. HILBU may, at its sole discretion, provide limited support or pass along information, but has no obligation to mediate or resolve disputes.
        </Card>

        <Card n={12} title="Suspension & Termination">
          We may suspend or remove accounts that violate terms, submit false data/documents, or abuse the platform.
        </Card>

        <Card n={13} title="Updates">
          HILBU may update these Terms at any time. Continued use of the platform after an update constitutes acceptance of the updated Terms.
        </Card>

        <Card n={14} title="Jurisdiction">
          Subject to mandatory local consumer protection laws, these Terms are governed by the laws of the United Arab Emirates. Venue for any permitted claims shall be within the UAE courts.
        </Card>

        <Card n={15} title="Contact">
          Questions? Email{" "}
          <a href="mailto:support@hilbu.com" style={styles.link}>support@hilbu.com</a>.
        </Card>

        <div style={styles.ctaRow}>
          <Link to="/" style={styles.ctaGhost}>← Back to Home</Link>
          <Link to="/privacy" style={styles.ctaSolid}>View Privacy Policy</Link>
        </div>
      </main>

      {/* Footer (same structure as Home) */}
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
  n, title, children,
}: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHead}>
        <span style={styles.num}>{n}</span>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>
      <p style={styles.body}>{children}</p>
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
  title: { fontSize: 40, lineHeight: 1.15, margin: 0, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 },
  versionChip: { fontWeight: 800, fontSize: 14, background: "#000", color: "#fff", borderRadius: 999, padding: "4px 10px", border: `2px solid ${YELLOW}` },
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
