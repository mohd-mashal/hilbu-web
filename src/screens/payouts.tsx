// FILE: src/screens/payouts.tsx  (AdminPayouts.tsx)
import React, { useEffect, useMemo, useState } from 'react';
import { getFirebaseDB } from '../firebaseConfig';
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  getDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface Payout {
  id: string;
  driverId?: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  amount?: number; // NET to driver (80%)
  status?: 'pending' | 'approved' | 'rejected';
  timestamp?: string; // request time
  bankRef?: string;
  paidAt?: string;
  paidBy?: string;
  reason?: string;
  receiptUrl?: string;
}

const COMMISSION = 0.20;
const PAYOUT_RATE = 1 - COMMISSION; // 0.8

// ✅ Same normalization style as your mobile notifications file
const normalizeE164 = (phone?: string | null) => {
  if (!phone) return '';
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.startsWith('00')) clean = clean.slice(2);
  if (!clean.startsWith('971') && clean.length > 0 && clean[0] === '0') clean = clean.slice(1);
  return clean.length ? `+${clean}` : '';
};
const noPlus = (phone?: string | null) => (phone || '').replace(/\s/g, '').replace(/^\+/, '');

export default function AdminPayouts() {
  const [requests, setRequests] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirebaseDB();

  // ✅ Send Expo push (same endpoint family you use in app)
  const sendExpoPush = async (expoPushToken: string, title: string, body: string) => {
    try {
      if (!expoPushToken) return;

      // Don’t over-restrict prefix, just ensure it looks like a push token
      const ok =
        expoPushToken.includes('PushToken') || expoPushToken.includes('ExponentPushToken');
      if (!ok) return;

      await fetch('https://api.expo.dev/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: 'default',
          title,
          body,
          data: { type: 'payout' },
          priority: 'high',
        }),
      }).catch(() => {});
    } catch (e) {
      console.error('sendExpoPush error:', e);
    }
  };

  // ✅ Robust driver token lookup (matches your saving locations)
  const getDriverPushToken = async (driverIdRaw: string): Promise<string | null> => {
    try {
      const driverId = (driverIdRaw || '').toString().trim();
      if (!driverId) return null;

      // Try direct drivers/{driverId}
      const d1 = await getDoc(doc(db, 'drivers', driverId));
      if (d1.exists()) {
        const data: any = d1.data();
        const token =
          data.expoPushToken ||
          data.pushToken ||
          data.notificationToken ||
          data.expo_token ||
          null;
        if (token && typeof token === 'string') return token;
      }

      // If driverId is phone-like, try normalized docId without +
      const e164 = normalizeE164(driverId);
      const key = noPlus(e164);

      if (key) {
        const d2 = await getDoc(doc(db, 'drivers', key));
        if (d2.exists()) {
          const data: any = d2.data();
          const token =
            data.expoPushToken ||
            data.pushToken ||
            data.notificationToken ||
            data.expo_token ||
            null;
          if (token && typeof token === 'string') return token;
        }
      }

      // Try drivers_by_phone/+E164 and drivers_by_phone/noPlus(E164)
      if (e164) {
        const p1 = await getDoc(doc(db, 'drivers_by_phone', e164));
        if (p1.exists()) {
          const data: any = p1.data();
          const token = data.expoPushToken || data.pushToken || null;
          if (token && typeof token === 'string') return token;
        }

        if (key) {
          const p2 = await getDoc(doc(db, 'drivers_by_phone', key));
          if (p2.exists()) {
            const data: any = p2.data();
            const token = data.expoPushToken || data.pushToken || null;
            if (token && typeof token === 'string') return token;
          }
        }
      }

      return null;
    } catch (e) {
      console.error('getDriverPushToken error:', e);
      return null;
    }
  };

  useEffect(() => {
    const qy = query(collection(db, 'payout_requests'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      qy,
      (snapshot) => {
        const data: Payout[] = snapshot.docs.map((d) => {
          const raw: any = d.data();
          const tsRaw = raw.timestamp;
          const paidRaw = raw.paidAt;

          const ts =
            typeof tsRaw === 'string'
              ? tsRaw
              : tsRaw?.toDate?.()?.toISOString?.() || new Date().toISOString();

          const paidAt =
            paidRaw &&
            (typeof paidRaw === 'string'
              ? paidRaw
              : paidRaw?.toDate?.()?.toISOString?.() || '');

          return {
            id: d.id,
            ...raw,
            timestamp: ts,
            paidAt,
          } as Payout;
        });

        setRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching payout requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  const approve = async (id: string) => {
    try {
      const refDoc = doc(db, 'payout_requests', id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) throw new Error('Missing request');
      const req = snap.data() as any;

      const bankRefInput =
        window.prompt(
          'Enter bank transfer reference (SWIFT / Ref No.). If you don’t have it now, type: PENDING',
          req.bankRef || 'PENDING'
        ) || 'PENDING';

      const paidByInput =
        window.prompt('Enter your name or initials (required):', req.paidBy || '') || '';

      const paidByFinal = paidByInput.trim() ? paidByInput.trim() : 'Admin';
      const bankRefFinal = bankRefInput.trim() ? bankRefInput.trim() : 'PENDING';

      await updateDoc(refDoc, {
        status: 'approved',
        paidAt: serverTimestamp(),
        bankRef: bankRefFinal,
        paidBy: paidByFinal,
      });

      await addDoc(collection(db, 'transfers'), {
        payoutRequestId: id,
        driverId: req.driverId || '',
        amount: Number(req.amount || 0),
        status: 'approved',
        approvedAt: serverTimestamp(),
        bankRef: bankRefFinal,
        approvedBy: paidByFinal,
      }).catch(() => {});

      const msg = `✅ Your payout of AED ${Number(req.amount || 0).toFixed(2)} has been approved.${
        bankRefFinal ? ` Ref: ${bankRefFinal}` : ''
      }`;

      await addDoc(collection(db, 'notifications'), {
        type: 'payout_approved',
        title: 'Payout Approved',
        message: msg,
        audience: req.driverId || 'driver',
        createdAt: serverTimestamp(),
      }).catch(() => {});

      const driverToken = await getDriverPushToken((req.driverId || '').toString());
      if (driverToken) {
        await sendExpoPush(driverToken, 'Payout Approved', msg);
      } else {
        console.warn('No driver push token found for:', req.driverId);
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'approved',
                bankRef: bankRefFinal,
                paidBy: paidByFinal,
                paidAt: new Date().toISOString(),
              }
            : r
        )
      );

      alert('✅ Payout Approved');
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('❌ Failed to approve payout. Try again.');
    }
  };

  const reject = async (id: string, defaultReason = 'Not eligible') => {
    try {
      const reasonInput = window.prompt('Reason for rejection:', defaultReason) || defaultReason;

      const refDoc = doc(db, 'payout_requests', id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) throw new Error('Missing request');
      const req = snap.data() as any;

      await updateDoc(refDoc, { status: 'rejected', reason: reasonInput });

      const msg = `❌ Your payout request was rejected. Reason: ${reasonInput}`;

      await addDoc(collection(db, 'notifications'), {
        type: 'payout_rejected',
        title: 'Payout Rejected',
        message: msg,
        audience: req.driverId || 'driver',
        createdAt: serverTimestamp(),
      }).catch(() => {});

      const driverToken = await getDriverPushToken((req.driverId || '').toString());
      if (driverToken) {
        await sendExpoPush(driverToken, 'Payout Rejected', msg);
      } else {
        console.warn('No driver push token found for:', req.driverId);
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected', reason: reasonInput } : r))
      );

      alert('⚠️ Payout Rejected');
    } catch (error) {
      console.error('Error rejecting payout:', error);
      alert('❌ Failed to reject payout. Try again.');
    }
  };

  const totals = useMemo(() => {
    const netSum = requests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const grossEq = netSum / PAYOUT_RATE;
    const commission = grossEq * COMMISSION;
    return {
      netSum: +netSum.toFixed(2),
      grossEq: +grossEq.toFixed(2),
      commission: +commission.toFixed(2),
    };
  }, [requests]);

  const formatDate = (val?: string) => {
    if (!val) return '';
    try {
      return new Date(val).toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return val;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>Loading payout requests...</h2>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>No payout requests found.</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💸 Payout Requests</h1>

      <div style={styles.messageBox}>
        <p style={styles.warning}>⚠️ Minimum payout request must be AED 100 (net to driver).</p>
      </div>

      <div style={styles.totalsBox}>
        <p style={styles.totalsText}>📊 Total Requested (Net to Drivers): AED {totals.netSum.toFixed(2)}</p>
        <p style={styles.totalsText}>💼 HILBU Commission (20% of Gross): AED {totals.commission.toFixed(2)}</p>
        <p style={styles.totalsText}>🧾 Gross Equivalent: AED {totals.grossEq.toFixed(2)}</p>
      </div>

      <div style={styles.list}>
        {requests.map((item) => {
          const net = Number(item.amount) || 0;
          const gross = net / PAYOUT_RATE;
          const commission = gross * COMMISSION;
          const whenRequested = item.timestamp ? formatDate(item.timestamp) : '';
          const whenPaid = item.paidAt ? formatDate(item.paidAt) : '';

          return (
            <div key={item.id} style={styles.card}>
              <p style={styles.row}><strong>📅 Requested:</strong> {whenRequested || '—'}</p>
              <p style={styles.row}><strong>👤 Driver:</strong> {item.driverId || '—'}</p>
              <p style={styles.row}><strong>👤 Account Name:</strong> {item.accountName || 'N/A'}</p>
              <p style={styles.row}><strong>🏦 Bank:</strong> {item.bankName || 'N/A'} - {item.accountNumber || 'N/A'}</p>
              <p style={styles.row}><strong>IBAN:</strong> {item.iban || 'N/A'}</p>

              <p style={styles.row}><strong>💰 Requested (Net to Driver):</strong> AED {net.toFixed(2)}</p>
              <p style={styles.row}><strong>🧾 Gross Equivalent:</strong> AED {gross.toFixed(2)}</p>
              <p style={styles.row}><strong>💼 HILBU Commission (20%):</strong> AED {commission.toFixed(2)}</p>

              {item.status === 'approved' && (
                <>
                  <p style={styles.row}><strong>✅ Paid on:</strong> {whenPaid || '—'}</p>
                  <p style={styles.row}><strong>Ref:</strong> {item.bankRef || '—'}</p>
                  <p style={styles.row}><strong>Processed by:</strong> {item.paidBy || '—'}</p>
                </>
              )}

              {item.status === 'rejected' && item.reason && (
                <p style={{ ...styles.row, color: '#cc0000' }}><strong>Reason:</strong> {item.reason}</p>
              )}

              <p
                style={{
                  ...styles.status,
                  color:
                    item.status === 'approved'
                      ? 'green'
                      : item.status === 'rejected'
                      ? '#cc0000'
                      : '#cc9900',
                }}
              >
                {item.status === 'approved'
                  ? '✅ Approved'
                  : item.status === 'rejected'
                  ? '❌ Rejected'
                  : '🕓 Pending Approval'}
              </p>

              {item.status !== 'approved' && item.status !== 'rejected' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={styles.button} onClick={() => approve(item.id)}>Approve Payout</button>
                  <button
                    style={{ ...styles.button, backgroundColor: '#cc0000', color: '#fff' }}
                    onClick={() => reject(item.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, backgroundColor: '#fff', minHeight: '100vh' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 16, textAlign: 'center' },
  messageBox: {
    backgroundColor: '#fff4f4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    border: '1px solid #cc0000',
  },
  warning: { color: '#cc0000', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  totalsBox: {
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #ddd',
  },
  totalsText: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  list: { display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFDC00', padding: 20, borderRadius: 16, boxShadow: '0 4px 8px rgba(0,0,0,0.08)' },
  row: { fontSize: 16, color: '#000', marginBottom: 6 },
  status: { marginTop: 10, fontSize: 16, fontWeight: 'bold' },
  button: {
    marginTop: 14,
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '12px 16px',
    fontSize: 16,
    fontWeight: 'bold',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
  },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  loadingText: { fontSize: 20, color: '#000' },
};
