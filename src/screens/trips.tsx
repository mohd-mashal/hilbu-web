import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDB } from '../firebaseConfig';

interface TripData {
  id: string;
  driver: string;
  rider: string;
  date: string;
  amount: number;
  pickup?: string;
  dropoff?: string;
  status?: string;
  paymentStatus?: string;
  commission: number;
  earnings: number;
}

const normalizeStatus = (v: any) => {
  const s = String(v ?? '').trim().toLowerCase();

  // common aliases
  if (s === 'assigned') return 'accepted';
  if (s === 'on the way') return 'on_the_way';
  if (s === 'ontheway') return 'on_the_way';
  if (s === 'arrive') return 'arrived';
  if (s === 'canceled') return 'cancelled'; // unify spelling
  if (s === 'cancel') return 'cancelled';

  return s || 'completed';
};

const normalizePayment = (v: any) => {
  const s = String(v ?? '').trim().toLowerCase();

  // treat these as "paid"
  if (['paid', 'success', 'succeeded', 'completed', 'captured', 'done'].includes(s)) return 'paid';

  // treat empty as unknown
  if (!s) return 'unknown';

  return s;
};

export default function AdminTrips() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔎 Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('');

  useEffect(() => {
    const fetchTrips = async () => {
      const db = getFirebaseDB();
      try {
        const tripsSnap = await getDocs(collection(db, 'trip_history_driver'));

        const tripsData: TripData[] = tripsSnap.docs.map((docSnap) => {
          const data: any = docSnap.data();

          // timestamp: Firestore Timestamp, ISO string, number, or createdAt
          let dt: Date;
          if (data?.timestamp?.toDate) {
            dt = data.timestamp.toDate();
          } else if (typeof data?.timestamp === 'string' || typeof data?.timestamp === 'number') {
            dt = new Date(data.timestamp);
          } else if (data?.createdAt?.toDate) {
            dt = data.createdAt.toDate();
          } else if (typeof data?.createdAt === 'string' || typeof data?.createdAt === 'number') {
            dt = new Date(data.createdAt);
          } else {
            dt = new Date();
          }

          // amount: can be number or string like "AED 120.50"
          const amountNum =
            typeof data?.amount === 'number'
              ? data.amount
              : parseFloat(String(data?.amount ?? '0').replace(/[^\d.]/g, '')) || 0;

          // pickup / dropoff: string or { address, coords }
          const pickupStr =
            typeof data?.pickup === 'string' ? data.pickup : data?.pickup?.address || 'N/A';

          const dropoffStr =
            typeof data?.dropoff === 'string' ? data.dropoff : data?.dropoff?.address || 'N/A';

          const status = normalizeStatus(data?.status);

          const paymentStatus = normalizePayment(data?.paymentStatus);

          // commission & earnings (prefer DB, else 20% rule)
          const commissionFromDb = typeof data?.commission === 'number' ? data.commission : null;
          const earningsFromDb = typeof data?.earnings === 'number' ? data.earnings : null;

          const commission = commissionFromDb !== null ? commissionFromDb : amountNum * 0.2; // 20%
          const earnings = earningsFromDb !== null ? earningsFromDb : amountNum - commission;

          return {
            id: docSnap.id,
            driver: data?.driverPhone || data?.driverId || 'Unknown Driver',
            rider: data?.userPhone || data?.userId || 'Unknown User',
            date: dt.toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            amount: amountNum,
            pickup: pickupStr,
            dropoff: dropoffStr,
            status,
            paymentStatus,
            commission,
            earnings,
          };
        });

        setTrips(tripsData);
      } catch (error) {
        console.error('Error fetching trips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // ✅ Apply filters
  const filteredTrips = trips.filter((t) => {
    const st = (t.status || '').toLowerCase();
    const pay = (t.paymentStatus || '').toLowerCase();

    // status filter
    if (statusFilter !== 'all' && st !== statusFilter) return false;

    // payment filter
    if (paymentFilter === 'paid' && pay !== 'paid') return false;
    if (paymentFilter === 'unpaid' && pay === 'paid') return false;
    if (paymentFilter === 'unknown' && pay !== 'unknown') return false;

    // driver filter (phone/id contains text)
    if (driverFilter.trim() && !t.driver.toLowerCase().includes(driverFilter.trim().toLowerCase()))
      return false;

    return true;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>Loading trip history...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧾 Trip History</h1>

      {/* 🔎 Filters row */}
      <div style={styles.filtersRow}>
        <div style={styles.filterBlock}>
          <label style={styles.filterLabel}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="on_the_way">On the way</option>
            <option value="arrived">Arrived</option>
          </select>
        </div>

        <div style={styles.filterBlock}>
          <label style={styles.filterLabel}>Payment</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div style={styles.filterBlock}>
          <label style={styles.filterLabel}>Driver (phone / ID)</label>
          <input
            type="text"
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            placeholder="e.g. +9715..."
            style={styles.filterInput}
          />
        </div>
      </div>

      <div style={styles.list}>
        {filteredTrips.length === 0 ? (
          <p style={styles.noData}>No trips found with current filters.</p>
        ) : (
          filteredTrips.map((item) => {
            const statusLabel =
              item.status?.charAt(0).toUpperCase() + (item.status?.slice(1) || '');
            const payLabel =
              item.paymentStatus?.charAt(0).toUpperCase() + (item.paymentStatus?.slice(1) || '');

            return (
              <div key={item.id} style={styles.card}>
                <p style={styles.label}>
                  <strong>🚗 Driver:</strong> {item.driver}
                </p>
                <p style={styles.label}>
                  <strong>🙋 Rider:</strong> {item.rider}
                </p>
                <p style={styles.label}>
                  <strong>📍 Pickup:</strong> {item.pickup}
                </p>
                <p style={styles.label}>
                  <strong>📍 Drop-off:</strong> {item.dropoff}
                </p>
                <p style={styles.label}>
                  <strong>📅 Date:</strong> {item.date}
                </p>

                <div style={styles.badgeRow}>
                  <span style={styles.statusBadge}>Status: {statusLabel || '—'}</span>
                  <span style={styles.paymentBadge}>Payment: {payLabel || '—'}</span>
                </div>

                <p style={styles.label}>
                  <strong>💵 Amount:</strong> AED {item.amount.toFixed(2)}
                </p>
                <p style={styles.label}>
                  <strong>🏦 HILBU 20% Commission:</strong> AED {item.commission.toFixed(2)}
                </p>
                <p style={styles.labelGreen}>
                  <strong>✅ Earnings After 20%:</strong>
                  <span style={styles.valueGreen}> AED {item.earnings.toFixed(2)}</span>
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  filtersRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  filterBlock: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 160,
  },
  filterLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    fontWeight: 600,
  },
  filterSelect: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #ccc',
    fontSize: 13,
  },
  filterInput: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #ccc',
    fontSize: 13,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    backgroundColor: '#FFDC00',
    padding: 20,
    borderRadius: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    border: '1px solid #000',
  },
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
  },
  labelGreen: {
    fontSize: 16,
    color: '#006400',
    marginTop: 10,
    fontWeight: 'bold',
  },
  valueGreen: {
    color: '#006400',
    fontWeight: 'normal',
    marginLeft: 6,
  },
  badgeRow: {
    display: 'flex',
    gap: 10,
    margin: '8px 0 10px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: '#000',
    color: '#FFDC00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentBadge: {
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#fff',
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
