export default function Privacy() {
  return (
    <div className="legal-page" style={{ paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#000' }}>Privacy Policy</h1>
        <p style={{ fontSize: 16, color: '#333' }}>
          Your privacy is important to us. This policy outlines how HILBU collects and uses your data.
        </p>
      </div>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600 }}>1. What We Collect</h2>
      <p>
        We collect your name, phone number, and (optional) email. We also collect real-time location data,
        device information, and usage logs such as job requests, timestamps, and job status.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>2. How We Use It</h2>
      <p>
        - To provide car recovery services and match you with drivers.<br />
        - To send status updates and notifications.<br />
        - To log and analyze service history and activity.<br />
        - To store trip records for support and reference.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>3. Sharing & Storage</h2>
      <p>
        We do not sell your data. Your data is stored securely in Firebase and shared only with trusted services
        (like Google Maps) when needed to perform services. Admins have role-based access.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>4. Your Rights</h2>
      <p>
        You may request access, deletion, or correction of your data at any time. You may also disable location access,
        which may impact service functionality.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>5. Children’s Policy</h2>
      <p>HILBU is not intended for users under 16. We do not knowingly collect data from children.</p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>6. Contact</h2>
      <p>
        For privacy inquiries, please email{' '}
        <a href="mailto:support@hilbu.com" style={{ color: '#FFDC00' }}>support@hilbu.com</a>
      </p>
    </div>
  );
}
