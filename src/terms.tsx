export default function Terms() {
  return (
    <div className="legal-page" style={{ paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#000' }}>Terms & Conditions</h1>
        <p style={{ fontSize: 16, color: '#333' }}>
          Please read the following terms and conditions before using HILBU.
        </p>
      </div>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600 }}>1. Eligibility</h2>
      <p>You must be at least 16 years old. Drivers must meet local tow regulations and legal requirements.</p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>2. User Responsibilities</h2>
      <p>
        All users are responsible for keeping login credentials secure. Admins reserve the right to suspend
        accounts for abuse or illegal activity.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>3. Location & Notifications</h2>
      <p>
        Location access is required for matching with recovery drivers. Notifications are sent for job updates
        and alerts. By using HILBU, you consent to this use.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>4. Payment & Commission</h2>
      <p>
        Payments are not processed inside the app at this time. A 20% admin commission is applied per job
        and is visible only to administrators in the dashboard.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>5. Account Suspension</h2>
      <p>
        HILBU may suspend or terminate user accounts for violating these terms or for fraudulent or harmful activity.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>6. Liability Disclaimer</h2>
      <p>
        HILBU acts as a technology platform to connect users and drivers. We are not responsible for any direct
        or indirect damage, injury, or dispute arising between users and drivers.
      </p>

      <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, marginTop: 24 }}>7. Contact</h2>
      <p>
        For any questions, please contact us at{' '}
        <a href="mailto:support@hilbu.com" style={{ color: '#FFDC00' }}>support@hilbu.com</a>
      </p>
    </div>
  );
}
