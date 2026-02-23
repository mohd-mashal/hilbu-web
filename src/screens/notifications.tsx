// FILE: src/pages/AdminNotifications.tsx
import React, { useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseDB } from '../firebaseConfig';

type TargetScope = 'all' | 'users' | 'drivers';

const FUNCTIONS_REGION =
  (import.meta as any)?.env?.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';

// Expo token helper
const isExpoToken = (t: unknown) =>
  typeof t === 'string' &&
  (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

// Flatten possible token shapes
function extractTokens(obj: any): string[] {
  const out: string[] = [];
  const candidates = [
    obj?.expoPushToken,
    obj?.pushToken,
    obj?.token,
    obj?.notificationToken,
    obj?.fcmToken, // sometimes projects store expo’s proxy token here
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) c.forEach((x) => isExpoToken(x) && out.push(String(x)));
    else if (typeof c === 'string' && isExpoToken(c)) out.push(c);
  }
  return out;
}

export default function AdminNotifications() {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<TargetScope>('all');
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [foundCount, setFoundCount] = useState<number | null>(null);

  const previewText = useMemo(() => {
    if (foundCount == null) return '';
    if (foundCount === 0) return 'No registered devices found for this audience.';
    return `Found ${foundCount} device${foundCount === 1 ? '' : 's'} to notify.`;
  }, [foundCount]);

  // Collect Expo push tokens from Firestore (deduped)
  const collectTokens = async (scope: TargetScope) => {
    const db = getFirebaseDB();
    const bag: string[] = [];

    const pull = async (coll: string) => {
      const snap = await getDocs(collection(db, coll));
      snap.forEach((d) => {
        extractTokens(d.data()).forEach((t) => bag.push(t));
      });
    };

    if (scope === 'all' || scope === 'users') {
      await pull('users');
      // fallback mirror
      try { await pull('users_by_phone'); } catch { /* optional */ }
    }
    if (scope === 'all' || scope === 'drivers') {
      await pull('drivers');
      // fallback mirror
      try { await pull('drivers_by_phone'); } catch { /* optional */ }
    }

    // de-dupe
    return Array.from(new Set(bag));
  };

  const handlePreview = async () => {
    setFoundCount(null);
    const tokens = await collectTokens(target);
    setFoundCount(tokens.length);
    if (tokens.length === 0) {
      alert(
        'No valid Expo push tokens found.\nAsk users/drivers to open the app once to register their device.'
      );
    }
  };

  const sendNotification = async () => {
    if (!message.trim()) {
      alert('Message cannot be empty.');
      return;
    }

    try {
      setSending(true);
      const tokens = await collectTokens(target);
      setFoundCount(tokens.length);

      if (tokens.length === 0) {
        alert('No registered devices to send to.');
        setSending(false);
        return;
      }

      // Cloud Function client
      const app = getApp();
      const functions = getFunctions(app, FUNCTIONS_REGION);
      const sendExpoPush = httpsCallable(functions, 'sendExpoPush');

      // Batch into chunks (<= 90 keeps us safe)
      const chunkSize = 90;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        // Minimal data payload for inbox/tap handling
        await sendExpoPush({
          tokens: chunk,
          title: 'HILBU',
          body: message,
          data: { scope: target },
          channelId: 'default',
          priority: 'high',
        });
      }

      setMessage('');
      setTarget('all');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error('Error sending notification:', err);
      alert(
        `Failed to send notification.\n${
          err?.message || 'Check Cloud Function "sendExpoPush" and region.'
        }`
      );
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

          <div style={styles.previewRow}>
            <button
              style={{ ...styles.secondary, opacity: sending ? 0.6 : 1 }}
              onClick={handlePreview}
              disabled={sending}
              title="Count how many devices will receive this"
            >
              Preview Audience
            </button>
            <span style={styles.previewText}>{previewText}</span>
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

        <div style={styles.tip}>
          Tip: Notifications deliver when the device has a valid Expo push token (app opened at least
          once). Uninstalled apps won’t receive messages.
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
  container: { width: '100%', maxWidth: 640, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 24 },
  card: {
    backgroundColor: '#FFDC00',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxSizing: 'border-box',
  },
  input: {
    width: '100%',
    height: 130,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    border: '1px solid #000',
    resize: 'vertical',
    backgroundColor: '#fff',
    color: '#000',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    border: '1px solid #000',
    boxSizing: 'border-box',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  previewText: { color: '#000', fontSize: 14, textAlign: 'left', flex: 1 },
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
  secondary: {
    backgroundColor: '#000',
    color: '#FFDC00',
    fontWeight: 'bold',
    fontSize: 14,
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    border: 'none',
    whiteSpace: 'nowrap',
  },
  success: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  tip: { marginTop: 12, color: '#333', fontSize: 12 },
};
