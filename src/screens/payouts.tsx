import React, { useEffect, useState } from 'react';
import { getFirebaseDB } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';

interface Payout {
  id: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  amount?: number;
  status?: string;
  timestamp?: string;
}

export default function AdminPayouts() {
  const [requests, setRequests] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirebaseDB();

  // Real-time listener for payout requests
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'payout_requests'),
      (snapshot) => {
        const data: Payout[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Payout[];
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
      const ref = doc(db, 'payout_requests', id);
      await updateDoc(ref, { status: 'approved' });

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
      );
      alert('✅ Payout Approved');
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('❌ Failed to approve payout. Try again.');
    }
  };

  const totalAmount = requests.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  const totalCommission = totalAmount * 0.2;
  const totalEarnings = totalAmount - totalCommission;

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
        <p style={styles.warning}>⚠️ Minimum payout request must be AED 100.</p>
      </div>

      <div style={styles.totalsBox}>
        <p style={styles.totalsText}>📊 Total Requested: AED {totalAmount.toFixed(2)}</p>
        <p style={styles.totalsText}>💼 HILBU Commission (20%): AED {totalCommission.toFixed(2)}</p>
        <p style={styles.totalsText}>💰 Total Earnings (After): AED {totalEarnings.toFixed(2)}</p>
      </div>

      <div style={styles.list}>
        {requests.map((item) => {
          const commission = (item.amount || 0) * 0.2;
          const earnings = (item.amount || 0) - commission;

          return (
            <div key={item.id} style={styles.card}>
              <p style={styles.row}><strong>👤 Account Name:</strong> {item.accountName || 'N/A'}</p>
              <p style={styles.row}><strong>💰 Requested Amount:</strong> AED {(item.amount || 0).toFixed(2)}</p>
              <p style={styles.row}><strong>🏦 Bank:</strong> {item.bankName || 'N/A'} - {item.accountNumber || 'N/A'}</p>
              <p style={styles.row}><strong>IBAN:</strong> {item.iban || 'N/A'}</p>
              <p style={styles.row}><strong>HILBU Commission (20%):</strong> AED {commission.toFixed(2)}</p>
              <p style={styles.row}><strong>Earnings (After):</strong> AED {earnings.toFixed(2)}</p>

              <p
                style={{
                  ...styles.status,
                  color: item.status === 'approved' ? 'green' : '#cc9900',
                }}
              >
                {item.status === 'approved' ? '✅ Approved' : '🕓 Pending Approval'}
              </p>

              {item.status === 'pending' && (
                <button style={styles.button} onClick={() => approve(item.id)}>
                  Approve Payout
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageBox: {
    backgroundColor: '#fff4f4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    border: '1px solid #cc0000',
  },
  warning: {
    color: '#cc0000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  totalsBox: {
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #ddd',
  },
  totalsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFDC00',
    padding: 20,
    borderRadius: 16,
    boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
  },
  row: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  loadingText: {
    fontSize: 20,
    color: '#000',
  },
  noData: {
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
  },
};
