// FILE: src/screens/reports.tsx  (or ReportsScreen.tsx if that's your path)
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDB } from '../firebaseConfig';

type Status = 'pending' | 'approved' | 'rejected';

interface RawPayout {
  id: string;
  driverId?: string;
  driver?: string; // fallback field if exists
  amount?: number | string; // NET to driver (80%)
  bankName?: string;
  bank?: string; // fallback
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  status?: Status;
  timestamp?: any; // serverTimestamp | ISO | Date
}

interface PayoutRow {
  id: string;
  driverId: string;
  driverLabel: string; // what we display (id, or name if you later add it)
  dateISO: string; // YYYY-MM-DD
  bankLine: string; // BankName - AccountNumber
  accountName: string;
  iban: string;
  status: Status;
  net: number;    // requested (80%)
  gross: number;  // derived
  commission: number; // derived
  monthKey: string;   // YYYY-MM for filter
}

const COMMISSION = 0.20;
const PAYOUT_RATE = 1 - COMMISSION; // 0.8

export default function ReportsScreen() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<'all' | string>('all');
  const [onlyApproved, setOnlyApproved] = useState(false);

  // Fetch payouts from Firestore (reads the actual fields we saved earlier)
  useEffect(() => {
    const run = async () => {
      try {
        const db = getFirebaseDB();
        const qy = query(collection(db, 'payout_requests'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(qy);

        const mapped: PayoutRow[] = snap.docs.map((docSnap) => {
          const d = (docSnap.data() || {}) as RawPayout;

          const driverId = (d.driverId || d.driver || '—').toString();
          const driverLabel = driverId; // If you later store names, replace with that.

          // Normalize timestamp → Date
          const tsVal =
            typeof d.timestamp === 'string'
              ? new Date(d.timestamp)
              : d.timestamp?.toDate?.() instanceof Date
              ? d.timestamp.toDate()
              : d.timestamp instanceof Date
              ? d.timestamp
              : new Date();

          const dateISO = new Date(tsVal).toISOString().split('T')[0]; // YYYY-MM-DD
          const monthKey = dateISO.slice(0, 7); // YYYY-MM

          const bankName = (d.bankName || d.bank || 'N/A').toString();
          const accountNumber = (d.accountNumber || 'N/A').toString();
          const accountName = (d.accountName || 'N/A').toString();
          const iban = (d.iban || 'N/A').toString();
          const status = (d.status || 'pending') as Status;

          // Amount in payout_requests is NET to driver (80%)
          const net = Number(d.amount ?? 0) || 0;
          const gross = net / PAYOUT_RATE;
          const commission = gross * COMMISSION;

          return {
            id: docSnap.id,
            driverId,
            driverLabel,
            dateISO,
            bankLine: `${bankName} - ${accountNumber}`,
            accountName,
            iban,
            status,
            net: +net.toFixed(2),
            gross: +gross.toFixed(2),
            commission: +commission.toFixed(2),
            monthKey,
          };
        });

        setRows(mapped);
      } catch (e) {
        console.error('Error fetching payouts:', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Build month options dynamically from data
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.monthKey && set.add(r.monthKey));
    return ['all', ...Array.from(set).sort().reverse()];
  }, [rows]);

  // Apply filters
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchMonth = selectedMonth === 'all' || r.monthKey === selectedMonth;
      const matchStatus = !onlyApproved || r.status === 'approved';
      return matchMonth && matchStatus;
    });
  }, [rows, selectedMonth, onlyApproved]);

  // Totals (admin view uses NET list but shows full breakdown)
  const totals = useMemo(() => {
    const netSum = filtered.reduce((s, r) => s + r.net, 0);
    const grossEq = netSum / PAYOUT_RATE;
    const commission = grossEq * COMMISSION;
    return {
      netSum: +netSum.toFixed(2),
      grossEq: +grossEq.toFixed(2),
      commission: +commission.toFixed(2),
    };
  }, [filtered]);

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Driver',
      'Date',
      'Account Name',
      'Bank',
      'IBAN',
      'Status',
      'Gross (AED)',
      'Commission 20% (AED)',
      'Net to Driver (AED)',
    ];
    const rowsCSV = filtered.map((r) => [
      r.id,
      r.driverLabel,
      r.dateISO,
      r.accountName,
      r.bankLine,
      r.iban,
      r.status,
      r.gross.toFixed(2),
      r.commission.toFixed(2),
      r.net.toFixed(2),
    ]);
    const csvContent = [headers, ...rowsCSV].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hilbu_admin_report_${selectedMonth === 'all' ? 'all' : selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>Loading reports...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 HILBU Admin Report</h2>

      <div style={styles.filtersRow}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>🗓 Filter by Month:</label>
          <select
            style={styles.select}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value as any)}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m === 'all' ? 'All' : m}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <input
              type="checkbox"
              checked={onlyApproved}
              onChange={() => setOnlyApproved((v) => !v)}
              style={{ marginRight: 6 }}
            />
            ✅ Approved only
          </label>
        </div>

        <button style={styles.button} onClick={exportToCSV}>
          ⬇️ Export CSV
        </button>
      </div>

      <div style={styles.totalsBox}>
        <p style={styles.totalsText}>🧾 Gross Equivalent: AED {totals.grossEq.toFixed(2)}</p>
        <p style={styles.totalsText}>💼 HILBU Commission (20%): AED {totals.commission.toFixed(2)}</p>
        <p style={styles.totalsText}>💰 Total Net to Drivers: AED {totals.netSum.toFixed(2)}</p>
      </div>

      <div style={styles.section}>
        {filtered.length === 0 ? (
          <p style={styles.noData}>No payouts found.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} style={styles.card}>
              <div style={styles.rowWrap}>
                <p style={styles.label}><strong>Driver:</strong> {r.driverLabel}</p>
                <p style={styles.label}><strong>Date:</strong> {r.dateISO}</p>
                <p style={styles.label}><strong>Status:</strong>{' '}
                  <span
                    style={{
                      color:
                        r.status === 'approved' ? 'green' : r.status === 'rejected' ? '#cc0000' : '#cc9900',
                      fontWeight: 700,
                    }}
                  >
                    {r.status === 'approved' ? '✅ Approved' : r.status === 'rejected' ? '❌ Rejected' : '🕓 Pending'}
                  </span>
                </p>
              </div>

              <p style={styles.label}><strong>Account Name:</strong> {r.accountName}</p>
              <p style={styles.label}><strong>Bank:</strong> {r.bankLine}</p>
              <p style={styles.label}><strong>IBAN:</strong> {r.iban}</p>

              <div style={styles.breakdown}>
                <div style={styles.breakItem}>
                  <p style={styles.breakTitle}>Gross</p>
                  <p style={styles.breakValue}>AED {r.gross.toFixed(2)}</p>
                </div>
                <div style={styles.breakItem}>
                  <p style={styles.breakTitle}>Commission (20%)</p>
                  <p style={styles.breakValue}>AED {r.commission.toFixed(2)}</p>
                </div>
                <div style={styles.breakItem}>
                  <p style={styles.breakTitle}>Net to Driver (80%)</p>
                  <p style={styles.breakValue}>AED {r.net.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  filtersRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterGroup: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  select: {
    padding: 6,
    fontSize: 14,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '12px 16px',
    borderRadius: 10,
    fontWeight: 'bold',
    fontSize: 15,
    cursor: 'pointer',
    border: 'none',
    marginLeft: 'auto',
  },
  totalsBox: {
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #ddd',
    maxWidth: 900,
  },
  totalsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  section: {
    width: '100%',
    maxWidth: 900,
  },
  card: {
    backgroundColor: '#FFDC00',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
  },
  rowWrap: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  breakdown: {
    marginTop: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))',
    gap: 10,
  },
  breakItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    border: '1px solid #000',
  },
  breakTitle: { margin: 0, fontWeight: 700, color: '#000' },
  breakValue: { margin: 0, fontSize: 16, fontWeight: 700, color: '#000' },
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
