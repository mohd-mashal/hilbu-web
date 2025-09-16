// FILE: src/pages/AdminNotifications.tsx
import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseDB } from '../firebaseConfig';

type TargetScope = 'all' | 'users' | 'drivers';

export default function AdminNotifications() {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<TargetScope>('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  // 🔽 Advanced (optional) deep-link for driver jobs
  const [enableTapLink, setEnableTapLink] = useState(false);
  const [jobId, setJobId] = useState('');
  const [targetRoute, setTargetRoute] = useState('/driver/(tabs)/recovery-job-details');

  const isExpoToken = (t: string) =>
    typeof t === 'string' &&
    (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

  const collectTokens = async (scope: TargetScope) => {
    const db = getFirebaseDB();
    const tokens: string[] = [];

    // USERS
    if (scope === 'all' || scope === 'users') {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const t = d.data()?.expoPushToken ?? d.data()?.pushToken ?? d.data()?.token;
        if (t && isExpoToken(String(t))) tokens.push(String(t));
      });

      // Fallback: users_by_phone
      const usersByPhoneSnap = await getDocs(collection(db, 'users_by_phone'));
      usersByPhoneSnap.forEach((d) => {
        const t = d.data()?.expoPushToken ?? d.data()?.pushToken ?? d.data()?.token;
        if (t && isExpoToken(String(t))) tokens.push(String(t));
      });
    }

    // DRIVERS
    if (scope === 'all' || scope === 'drivers') {
      const driversSnap = await getDocs(collection(db, 'drivers'));
      driversSnap.forEach((d) => {
        const t = d.data()?.expoPushToken ?? d.data()?.pushToken ?? d.data()?.token;
        if (t && isExpoToken(String(t))) tokens.push(String(t));
      });

      // Fallback: drivers_by_phone
      const driversByPhoneSnap = await getDocs(collection(db, 'drivers_by_phone'));
      driversByPhoneSnap.forEach((d) => {
        const t = d.data()?.expoPushToken ?? d.data()?.pushToken ?? d.data()?.token;
        if (t && isExpoToken(String(t))) tokens.push(String(t));
      });
    }

    // de-dupe
    return Array.from(new Set(tokens));
  };

  const sendNotification = async () => {
    if (!message.trim()) {
      alert('Message cannot be empty.');
      return;
    }

    // If admin wants tap-to-open, require jobId (and ideally targeting drivers)
    if (enableTapLink) {
      if (!jobId.trim()) {
        alert('Enter a Job ID to include tap-to-open.');
        return;
      }
      if (target === 'users') {
        const cont = confirm(
          'You enabled tap-to-open for a DRIVER route but selected "Only Users". Continue?'
        );
        if (!cont) return;
      }
    }

    try {
      setSending(true);

      const expoTokens = await collectTokens(target);
      if (expoTokens.length === 0) {
        alert(
          'No valid Expo push tokens were found for the selected target.\n' +
            'If you expected drivers to receive it, open the driver app once to register its push token.'
        );
        setSending(false);
        return;
      }

      // Build standardized data payload (so taps open correctly on device)
      const data: Record<string, any> = { scope: target };

      if (enableTapLink) {
        // Standardized keys used by the app’s notification handlers
        data.role = 'driver';
        data.type = 'driver_job';
        data.targetRoute = targetRoute || '/driver/(tabs)/recovery-job-details';
        data.params = { jobId: jobId.trim() };
      }

      const app = getApp();
      const functions = getFunctions(app);
      const sendExpoPush = httpsCallable(functions, 'sendExpoPush');

      // Send (Cloud Function should handle batching)
      await sendExpoPush({
        tokens: expoTokens,
        title: 'HILBU',
        body: message,
        data,
        channelId: 'default',
        priority: 'high',
      });

      // Reset
      setMessage('');
      setTarget('all');
      setEnableTapLink(false);
      setJobId('');
      setTargetRoute('/driver/(tabs)/recovery-job-details');

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.title}>📣 Send Notification</h2>

        <div style={styles.card}>
          <textarea
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.input}
          />

          <div style={styles.selectWrapper}>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as TargetScope)}
              style={styles.select}
              disabled={sending}
            >
              <option value="all">🌍 All Users & Drivers</option>
              <option value="users">👤 Only Users</option>
              <option value="drivers">🚗 Only Drivers</option>
            </select>
          </div>

          {/* Advanced deep-link options for driver jobs */}
          <div style={styles.advancedBox}>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={enableTapLink}
                onChange={(e) => setEnableTapLink(e.target.checked)}
                disabled={sending}
              />
              <span style={styles.checkboxLabel}>
                Include tap-to-open (driver job deep-link)
              </span>
            </label>

            <div style={{ display: enableTapLink ? 'block' : 'none' }}>
              <div style={styles.inlineRow}>
                <div style={styles.inlineCol}>
                  <label style={styles.inlineLabel}>Job ID</label>
                  <input
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="e.g. abc123"
                    style={styles.textInput}
                    disabled={sending}
                  />
                </div>
                <div style={styles.inlineCol}>
                  <label style={styles.inlineLabel}>Target Route</label>
                  <input
                    value={targetRoute}
                    onChange={(e) => setTargetRoute(e.target.value)}
                    placeholder="/driver/(tabs)/recovery-job-details"
                    style={styles.textInput}
                    disabled={sending}
                  />
                </div>
              </div>
              <div style={styles.hint}>
                This sets: <code>role: "driver"</code>, <code>type: "driver_job"</code>,{' '}
                <code>targetRoute</code>, and <code>params: {"{ jobId }"}</code> so taps open the
                driver’s job screen even when the app is closed.
              </div>
            </div>
          </div>

          <button
            style={{ ...styles.button, opacity: sending ? 0.7 : 1 }}
            onClick={sendNotification}
            disabled={sending}
          >
            {sending ? 'Sending…' : '🚀 Send'}
          </button>

          {showSuccess && <div style={styles.success}>✅ Notification Sent!</div>}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    width: '100%',
    padding: 24,
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  container: { width: '100%', maxWidth: 600, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 24 },
  card: {
    backgroundColor: '#FFDC00',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxSizing: 'border-box',
  },
  input: {
    width: '100%',
    height: 120,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    border: '1px solid #000',
    resize: 'vertical',
    backgroundColor: '#fff',
    color: '#000',
    boxSizing: 'border-box',
  },
  selectWrapper: { width: '100%' },
  select: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    border: '1px solid #000',
    boxSizing: 'border-box',
  },

  // Advanced box
  advancedBox: {
    backgroundColor: '#fff',
    border: '1px solid #000',
    borderRadius: 12,
    padding: 12,
    textAlign: 'left',
  },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  checkboxLabel: { color: '#000', fontWeight: 600 },
  inlineRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  inlineCol: { display: 'flex', flexDirection: 'column', gap: 6 },
  inlineLabel: { fontSize: 13, fontWeight: 600, color: '#000' },
  textInput: {
    width: '100%',
    padding: 10,
    fontSize: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    border: '1px solid #000',
    boxSizing: 'border-box',
  },
  hint: { marginTop: 10, fontSize: 12, color: '#222' },

  button: {
    width: '100%',
    backgroundColor: '#000',
    color: '#FFDC00',
    fontWeight: 'bold',
    fontSize: 16,
    padding: 14,
    borderRadius: 10,
    cursor: 'pointer',
    border: 'none',
  },
  success: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontWeight: 'bold',
  },
};
