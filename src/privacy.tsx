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
          <img
            src="/hero-truck.png"
            alt="HILBU Tow Truck"
            style={styles.heroImg}
          />
        </div>
      </section>

      <main style={styles.container}>
        <Card
          n={1}
          title="Information We Collect"
          bullets={[
            "Name, phone number, and optional email",
            "Real-time user and driver locations, with permission",
            "Device model, OS version, and app identifiers",
            "Trip history, recovery request logs, and timestamps",
            "Push notification tokens used for service alerts",
          ]}
        />

        <Card
          n={2}
          title="How We Use Data"
          bullets={[
            "Match users with available recovery drivers",
            "Allow drivers to receive and manage recovery requests",
            "Send status updates and service notifications",
            "Support live trip and driver location tracking",
            "Log trips, generate reports, and provide customer support",
            "Monitor performance and improve service reliability",
          ]}
        />

        <Card n={3} title="Data Sharing">
          We do not sell your personal data. We may share necessary data with
          trusted service providers, such as Firebase and Google Maps, only when
          required to operate HILBU services. Administrative access is restricted
          and role-based.
        </Card>

        <Card n={4} title="Storage & Security">
          Data is protected using appropriate technical and organizational
          security measures. Data transmitted between the HILBU application and
          our service providers is encrypted in transit. Access to stored data is
          restricted based on operational requirements.
        </Card>

        <Card
          n={5}
          title="Your Choices & Rights"
          bullets={[
            "Request access to your personal data",
            "Request corrections to inaccurate information",
            "Request deletion of your HILBU account and associated personal data",
            "Disable location access from your device settings, although this may limit app functionality",
            "Control notification permissions from your device settings",
          ]}
        />

        <section id="delete-account" style={styles.deleteCard}>
          <div style={styles.cardHead}>
            <span style={styles.num}>6</span>
            <h2 style={styles.cardTitle}>Account & Data Deletion</h2>
          </div>

          <p style={styles.body}>
            Users and drivers of HILBU may request permanent deletion of their
            account and associated personal data at any time.
          </p>

          <h3 style={styles.subTitle}>How to request account deletion</h3>

          <ol style={styles.steps}>
            <li style={styles.li}>
              Send an email to{" "}
              <a
                href="mailto:support@hilbu.com?subject=HILBU Account Deletion Request"
                style={styles.link}
              >
                support@hilbu.com
              </a>
              .
            </li>

            <li style={styles.li}>
              Use the subject: <strong>HILBU Account Deletion Request</strong>.
            </li>

            <li style={styles.li}>
              Include the phone number or email address associated with your
              HILBU account so we can identify the correct account.
            </li>

            <li style={styles.li}>
              HILBU may contact you to verify account ownership before processing
              the deletion request.
            </li>
          </ol>

          <h3 style={styles.subTitle}>Data deleted with your account</h3>

          <ul style={styles.list}>
            <li style={styles.li}>Account profile information</li>
            <li style={styles.li}>Name and contact information</li>
            <li style={styles.li}>Stored location information associated with the account</li>
            <li style={styles.li}>Device and notification identifiers associated with the account</li>
            <li style={styles.li}>Other personal information associated with the HILBU account</li>
          </ul>

          <h3 style={styles.subTitle}>Data that may be retained</h3>

          <p style={styles.body}>
            Certain transaction, trip, security, fraud-prevention, dispute,
            accounting, or legal records may be retained where necessary to
            comply with applicable legal or regulatory requirements.
          </p>

          <p style={styles.body}>
            Account deletion requests are normally processed within{" "}
            <strong>30 days</strong>. Data that is not legally required to be
            retained will be deleted or anonymized during this period. Information
            that must be retained for legal or regulatory purposes will only be
            kept for the period required by applicable law.
          </p>

          <div style={styles.deleteBox}>
            <strong>Request account deletion:</strong>
            <br />
            <a
              href="mailto:support@hilbu.com?subject=HILBU Account Deletion Request"
              style={styles.deleteLink}
            >
              support@hilbu.com
            </a>
          </div>
        </section>

        <Card n={7} title="Children’s Privacy">
          HILBU is not intended for children under 16 and we do not knowingly
          collect personal information from children under 16.
        </Card>

        <Card n={8} title="Policy Updates">
          We may update this Privacy Policy from time to time. Any changes will
          appear on this page and, where appropriate, may also be communicated
          through the HILBU application.
        </Card>

        <Card n={9} title="Contact">
          For privacy questions, account deletion requests, or other support,
          contact{" "}
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

  heroText: {
    padding: "14px 10px",
  },

  title: {
    fontSize: 40,
    lineHeight: 1.15,
    margin: 0,
    fontWeight: 900,
  },

  kicker: {
    margin: "10px 0 8px",
    color: "#333",
    fontSize: 16,
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },

  badge: {
    background: YELLOW,
    color: "#000",
    fontWeight: 800,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "#bbb",
  },

  meta: {
    color: "#555",
    fontSize: 13,
  },

  heroArt: {
    display: "flex",
    justifyContent: "center",
  },

  heroImg: {
    width: 420,
    maxWidth: "100%",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,.15)",
  },

  container: {
    maxWidth: 980,
    margin: "8px auto 40px",
    padding: "0 16px",
  },

  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
  },

  deleteCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,.08)",
    border: `2px solid ${YELLOW}`,
    scrollMarginTop: 24,
  },

  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },

  num: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: YELLOW,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: 20,
    margin: 0,
  },

  subTitle: {
    fontSize: 16,
    fontWeight: 800,
    margin: "22px 0 8px",
  },

  body: {
    color: "#333",
    margin: "8px 0 0",
    lineHeight: 1.7,
  },

  list: {
    paddingLeft: 20,
    margin: "8px 0 0",
    color: "#333",
    lineHeight: 1.8,
  },

  steps: {
    paddingLeft: 22,
    margin: "8px 0 0",
    color: "#333",
    lineHeight: 1.8,
  },

  li: {
    marginBottom: 6,
  },

  link: {
    color: "#000",
    fontWeight: 800,
    textDecoration: "underline",
  },

  deleteBox: {
    marginTop: 22,
    padding: 18,
    borderRadius: 12,
    background: YELLOW,
    color: "#000",
    lineHeight: 1.7,
  },

  deleteLink: {
    color: "#000",
    fontWeight: 900,
    textDecoration: "underline",
    fontSize: 16,
  },
};