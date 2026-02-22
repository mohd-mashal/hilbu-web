import React from "react";

const YELLOW = "#FFDC00";

export default function Privacy() {
  const updated = new Date().toLocaleDateString();

  return (
    <div style={styles.page}>
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
        <Card
          n={1}
          title="Information We Collect"
          bullets={[
            "Name, phone number, and optional email",
            "Real-time user and driver locations (with permission)",
            "Device model, OS version, and app identifiers",
            "Trip history, request logs, and timestamps",
            "Push tokens for service alerts",
          ]}
        />

        <Card
          n={2}
          title="How We Use Data"
          bullets={[
            "Match users with available recovery drivers",
            "Send status updates and service notifications",
            "Log trips, generate reports, and provide support",
            "Monitor performance and improve reliability",
          ]}
        />

        <Card n={3} title="Data Sharing">
          We do not sell your data. We only share with trusted providers (e.g., Firebase, Google Maps)
          to enable the service. Admin access is restricted and role-based.
        </Card>

        <Card n={4} title="Storage & Security">
          Data is encrypted in transit and at rest. We apply least-privilege access and industry best practices.
        </Card>

        <Card
          n={5}
          title="Your Choices & Rights"
          bullets={[
            "Access, update, or request deletion of your data",
            "Disable location access (may limit functionality)",
            "Control notification permissions from device settings",
          ]}
        />

        <Card n={6} title="Children’s Privacy">
          HILBU is not intended for children under 16 and we do not knowingly collect their data.
        </Card>

        <Card n={7} title="Policy Updates">
          We may update this Policy. Changes will appear on this page and, where appropriate, inside the app.
        </Card>

        <Card n={8} title="Contact">
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
  bullets,
}: {
  n: number;
  title: string;
  children?: React.ReactNode;
  bullets?: string[];
}) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHead}>
        <span style={styles.num}>{n}</span>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>
      {bullets ? (
        <ul style={styles.list}>
          {bullets.map((b, i) => (
            <li key={i} style={styles.li}>
              {b}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.body}>{children}</p>
      )}
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
  title: { fontSize: 40, lineHeight: 1.15, margin: 0, fontWeight: 900 },
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