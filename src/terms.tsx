import React from "react";

const YELLOW = "#FFDC00";
const TERMS_VERSION = "2025-10-17";

export default function Terms() {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.title}>
            Terms &amp; Conditions <small style={styles.versionChip}>v{TERMS_VERSION}</small>
          </h1>
          <p style={styles.kicker}>
            These terms govern the use of the HILBU mobile and web platform.
          </p>
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

      <main style={styles.container}>
        <Card n={1} title="Services">
          HILBU connects users to recovery drivers through the HILBU apps and admin-managed system. Users submit requests,
          and drivers accept or reject jobs. HILBU is a technology platform and does not provide towing/recovery services.
        </Card>

        <Card n={2} title="Eligibility">
          Users must be 16 years or older. Drivers must have valid documents and meet all applicable local requirements.
        </Card>

        <section style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.num}>3</span>
            <h2 style={styles.cardTitle}>Responsibilities</h2>
          </div>
          <ul style={styles.list}>
            <li style={styles.li}>Users must enter correct pickup/drop-off information.</li>
            <li style={styles.li}>Drivers must follow the job flow and update status (on the way, arrived, completed).</li>
            <li style={styles.li}>All parties must act respectfully and comply with applicable laws.</li>
          </ul>
        </section>

        <Card n={4} title="Payment & Commission">
          HILBU may facilitate payments and deducts a 20% commission from each completed job for platform services.{" "}
          <strong>This deduction and final earnings calculations are visible in the admin panel only</strong> (not to users or drivers).
        </Card>

        <Card n={5} title="Notifications & Location">
          You allow HILBU to use your device location and send push/onsite notifications for trip updates and safety features.
        </Card>

        <Card n={6} title="Marketplace Disclaimer (HILBU Not a Carrier)">
          HILBU is a marketplace/platform only. HILBU does not provide towing/recovery services and is not a transportation carrier,
          workshop, or logistics company. All services are performed under a direct agreement between the User and the independent Driver.
          Any loss, damage, delay, negligence, mistake, or dispute before, during, or after a recovery — including but not limited to vehicle scratches,
          dents, mechanical/electrical damage, winching/towing incidents, load shifts, falling loads, improper securing, roadside actions, or route decisions —
          is strictly between the User and the Driver. HILBU is not a party to those dealings and bears no responsibility for them.
        </Card>

        <Card n={7} title="No Inspection, Guarantee, or Warranty">
          HILBU does not inspect, certify, endorse, supervise, or guarantee any Driver, vehicle, equipment, price, quote, ETA, route, advice, statement, or outcome.
          Information displayed in the platform is provided by Users/Drivers and may be approximate or subject to change.
        </Card>

        <Card n={8} title="Insurance & Risk">
          It is the sole responsibility of the Driver and/or User to ensure appropriate insurance coverage for recovery operations (including vehicle/cargo and third-party liability).
          By using the platform, both parties acknowledge the inherent risks of vehicle recovery and agree that HILBU is not liable for any direct, indirect, incidental, special,
          consequential, or punitive losses arising from or related to the service.
        </Card>

        <Card n={9} title="Indemnity">
          Users and Drivers agree to defend, indemnify, and hold harmless HILBU, its owners, affiliates, and staff from any claims, demands, liabilities, damages, losses, costs, and expenses
          (including legal fees) arising out of or related to: (a) their use of the platform, (b) their provision or receipt of services, or (c) breach of these Terms.
        </Card>

        <Card n={10} title="Safety & Compliance">
          Drivers and Users must comply with all applicable road, transport, safety, and equipment regulations. Drivers are solely responsible for their licenses, permits, and vehicle/equipment safety.
        </Card>

        <Card n={11} title="Disputes">
          Any dispute, claim, chargeback, or complaint concerning a recovery must be resolved directly between the User and the Driver.
          HILBU may, at its sole discretion, provide limited support or pass along information, but has no obligation to mediate or resolve disputes.
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
          <a href="mailto:support@hilbu.com" style={styles.link}>
            support@hilbu.com
          </a>
          .
        </Card>
      </main>
    </div>
  );
}

function Card({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children?: React.ReactNode;
}) {
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
  page: {
    background: "linear-gradient(180deg,#FFFCE6 0%,#FFF 100%)",
    minHeight: "calc(100vh - 200px)",
    color: "#000",
    fontFamily: "Poppins, sans-serif",
    width: "100%",
  },

  hero: {
    maxWidth: 1200,
    margin: "24px auto 8px",
    padding: "24px 20px",
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 20,
    alignItems: "center",
  },
  heroText: { padding: "14px 10px" },
  title: {
    fontSize: 40,
    lineHeight: 1.15,
    margin: 0,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  versionChip: {
    fontWeight: 800,
    fontSize: 14,
    background: "#000",
    color: "#fff",
    borderRadius: 999,
    padding: "4px 10px",
    border: `2px solid ${YELLOW}`,
  },
  kicker: { margin: "10px 0 8px", color: "#333", fontSize: 16 },
  metaRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 6 },
  badge: {
    background: YELLOW,
    color: "#000",
    fontWeight: 800,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 999, background: "#bbb" },
  meta: { color: "#555", fontSize: 13 },

  heroArt: { display: "flex", justifyContent: "center" },
  heroImg: { width: 420, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,.15)" },

  container: { maxWidth: 980, margin: "8px auto 40px", padding: "0 16px" },

  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
  },
  cardHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 6 },
  num: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: YELLOW,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },
  cardTitle: { fontSize: 20, margin: 0 },
  body: { color: "#333", margin: "8px 0 0", lineHeight: 1.7 },
  list: { paddingLeft: 20, margin: 0, color: "#333", lineHeight: 1.8 },
  li: { marginBottom: 6 },

  link: { color: "#000", fontWeight: 800, textDecoration: "underline" },
};