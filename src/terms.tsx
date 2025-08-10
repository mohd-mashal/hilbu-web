export default function Terms() {
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
          Terms & Conditions
        </h1>
        <p style={{ fontSize: 16, color: '#444', marginBottom: 32 }}>
          These terms govern your use of the HILBU recovery services. By using HILBU, you accept these conditions.
        </p>

        <Section title="1. Services">
          <p>HILBU connects users with licensed recovery drivers through mobile and web platforms.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>Users must be 16+ years old. Drivers must meet legal and operational standards.</p>
        </Section>

        <Section title="3. User Responsibilities" items={[
          "Keep login credentials secure",
          "Submit accurate pickup/dropoff info",
          "Use the app respectfully and legally"
        ]} />

        <Section title="4. Driver Responsibilities" items={[
          "Submit valid ID and vehicle documents",
          "Update job statuses in real-time",
          "Only accept jobs when available"
        ]} />

        <Section title="5. Payment & Commission">
          <p>HILBU deducts 20% commission from each trip. No in-app payments are collected.</p>
        </Section>

        <Section title="6. Location & Notifications">
          <p>By using HILBU, you agree to share your location and receive service-related notifications.</p>
        </Section>

        <Section title="7. Suspension">
          <p>Accounts can be suspended or terminated for violations, false documents, or abuse.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>HILBU is a platform only. We are not liable for incidents between users and drivers.</p>
        </Section>

        <Section title="9. Contact Us">
          <p>
            For support, contact:
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
