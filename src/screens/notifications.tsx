// src/pages/AdminNotifications.tsx
import React, { useState } from 'react';
import { getFirebaseDB } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function AdminNotifications() {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'users' | 'drivers'>('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const sendNotification = async () => {
    if (!message.trim()) {
      alert('Message cannot be empty.');
      return;
    }

    try {
      setSending(true);

      const db = getFirebaseDB();
      const tokens: string[] = [];

      // Users
      if (target === 'all' || target === 'users') {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((doc) => {
          const t = doc.data()?.expoPushToken;
          if (t) tokens.push(String(t));
        });
      }

      // Drivers
      if (target === 'all' || target === 'drivers') {
        const driversSnap = await getDocs(collection(db, 'drivers'));
        driversSnap.forEach((doc) => {
          const t = doc.data()?.expoPushToken;
          if (t) tokens.push(String(t));
        });
      }

      // Deduplicate + keep only Expo tokens
      const unique = Array.from(new Set(tokens));
      const expoTokens = unique.filter((t) => t.startsWith('ExponentPushToken['));

      if (expoTokens.length === 0) {
        alert('No devices are registered for push notifications.');
        setSending(false);
        return;
      }

      // Call Cloud Function (CORS-safe, handles batching)
      const app = getApp();
      const functions = getFunctions(app);
      const sendExpoPush = httpsCallable(functions, 'sendExpoPush');

      await sendExpoPush({
        tokens: expoTokens,
        title: 'HILBU',
        body: message,
        data: { scope: target }
      });

      setMessage('');
      setTarget('all');
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
              onChange={(e) => setTarget(e.target.value as 'all' | 'users' | 'drivers')}
              style={styles.select}
              disabled={sending}
            >
              <option value="all">🌍 All Users & Drivers</option>
              <option value="users">👤 Only Users</option>
              <option value="drivers">🚗 Only Drivers</option>
            </select>
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
  container: {
    width: '100%',
    maxWidth: 600,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
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
  selectWrapper: {
    width: '100%',
  },
  select: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    border: '1px solid #000', // ← fixed quote here
    boxSizing: 'border-box',
  },
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
