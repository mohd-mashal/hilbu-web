export default function Privacy() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f8f8',
      padding: '60px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 900,
        backgroundColor: '#fff',
        padding: '48px',
        borderRadius: 16,
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#FFDC00', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 16, color: '#444', marginBottom: 32 }}>
          This Privacy Policy explains how HILBU collects, uses, and protects your personal data when using our mobile and web services.
        </p>

        <Section title="1. Information We Collect" items={[
          "Name, phone number, and optional email",
          "Real-time user and driver locations",
          "Device model, OS version, identifiers",
          "Trip history, request logs, and timestamps",
          "Push tokens for service alerts"
        ]} />

        <Section title="2. How We Use Your Data" items={[
          "To match users with available drivers",
          "To send recovery status updates",
          "To log trips, generate invoices, and support services",
          "To monitor system performance"
        ]} />

        <Section title="3. Data Sharing">
          <p>
            We do not sell your data. Your information is only shared with trusted partners like Firebase and Google Maps to enable service. Admin access is restricted and role-based.
          </p>
        </Section>

        <Section title="4. Data Storage & Security">
          <p>
            All user data is encrypted and securely stored on Firebase servers with restricted access and protection via industry best practices.
          </p>
        </Section>

        <Section title="5. Your Rights" items={[
          "Access, update, or delete your data at any time",
          "Disable location access (may impact functionality)"
        ]} />

        <Section title="6. Children’s Privacy">
          <p>We do not knowingly collect data from users under 16. HILBU is not intended for children.</p>
        </Section>

        <Section title="7. Policy Updates">
          <p>We may update this policy. Changes will be shown on this page and announced inside the app.</p>
        </Section>

        <Section title="8. Contact Us">
          <p>
            Questions? Email us at:
            <br />
            <a href="mailto:support@hilbu.com" style={{ color: '#FFDC00', fontWeight: 600 }}>
              support@hilbu.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, items }: { title: string; children?: any; items?: string[] }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#000', marginBottom: 12 }}>{title}</h2>
      {items ? (
        <ul style={{ paddingLeft: 20, color: '#333', fontSize: 15, lineHeight: 1.8 }}>
          {items.map((item, index) => (
            <li key={index} style={{ marginBottom: 8 }}>{item}</li>
          ))}
        </ul>
      ) : children}
    </section>
  );
}
