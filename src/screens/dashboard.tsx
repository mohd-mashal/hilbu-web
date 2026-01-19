import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

type ScreenKey =
  | 'dashboard'
  | 'users'
  | 'drivers'
  | 'trips'
  | 'reports'
  | 'notifications'
  | 'liveactivity'
  | 'payouts'
  | 'support';

const toText = (v: any) => (typeof v === 'string' ? v : v?.address ?? '');

// Nice status text
const prettyStatus = (s?: string) => {
  const v = (s || '').toLowerCase();
  switch (v) {
    case 'pending':
      return 'Pending';
    case 'accepted':
    case 'assigned':
      return 'Accepted';
    case 'on_the_way':
      return 'On the way';
    case 'arrived':
      return 'Arrived';
    case 'completed':
      return 'Completed';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    default:
      return v || 'Unknown';
  }
};

// Status badge color
const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase();
  switch (v) {
    case 'pending':
      return '#FFB347'; // orange
    case 'accepted':
    case 'assigned':
      return '#4C8DFF'; // blue
    case 'on_the_way':
      return '#9B59B6'; // purple
    case 'arrived':
      return '#7F8C8D'; // grey
    case 'completed':
      return '#2ECC71'; // green
    case 'cancelled':
    case 'canceled':
      return '#E74C3C'; // red
    default:
      return '#888888';
  }
};

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: ScreenKey) => void }) {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'overview' | 'liveactivity'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('admin-auth');
    if (saved !== 'true') {
      window.location.href = '/login';
    } else {
      setReady(true);
      fetchStats();
      fetchRecentJobs();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      setTotalUsers(usersSnap.size);

      const driversSnap = await getDocs(collection(firestore, 'drivers'));
      setTotalDrivers(driversSnap.size);

      const tripsSnap = await getDocs(collection(firestore, 'trip_history_user'));
      setTotalTrips(tripsSnap.size);

      const payoutsSnap = await getDocs(collection(firestore, 'payout_requests'));
      setTotalPayouts(payoutsSnap.size);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const jobsQuery = query(
        collection(firestore, 'recovery_requests'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const jobsSnap = await getDocs(jobsQuery);
      const jobs: any[] = [];
      jobsSnap.forEach((doc) => jobs.push({ id: doc.id, ...doc.data() }));
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchStats(), fetchRecentJobs()]).finally(() =>
      setTimeout(() => setRefreshing(false), 500)
    );
  };

  if (!ready) return null;

  return (
    <div style={styles.container}>
      <div style={styles.statusBar}>
        <div style={styles.dot} />
        <span style={styles.statusText}>API: Online</span>
      </div>

      <div style={styles.headerRow}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Top tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setTab('overview')}
          style={{ ...styles.tab, ...(tab === 'overview' ? styles.activeTab : {}) }}
        >
          <span style={{ ...styles.tabText, ...(tab === 'overview' ? styles.activeTabText : {}) }}>
            Overview
          </span>
        </button>
        <button
          onClick={() => {
            setTab('liveactivity');
            setActiveTab('liveactivity'); // go to Live Activity page
          }}
          style={{ ...styles.tab, ...(tab === 'liveactivity' ? styles.activeTab : {}) }}
        >
          <span
            style={{ ...styles.tabText, ...(tab === 'liveactivity' ? styles.activeTabText : {}) }}
          >
            Live Activity
          </span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <>
          <h2 style={styles.sectionTitle}>📊 Live Overview</h2>
          <div style={styles.cardRow}>
            <Card
              label="👤 Total Users"
              value={totalUsers}
              sub="active this month"
              onPress={() => setActiveTab('users')}
            />
            <Card
              label="🚗 Total Drivers"
              value={totalDrivers}
              sub="registered"
              onPress={() => setActiveTab('drivers')}
            />
            <Card
              label="🛣️ Total Trips"
              value={totalTrips}
              sub="completed"
              onPress={() => setActiveTab('trips')}
            />
            <Card
              label="💰 Payout Requests"
              value={totalPayouts}
              sub="pending"
              onPress={() => setActiveTab('payouts')}
            />
          </div>
        </>
      )}

      {/* RECENT JOBS – improved visual style */}
      <div style={styles.jobsBlock}>
        <h3 style={styles.sectionTitle}>📄 Recent Recovery Jobs</h3>
        {recentJobs.length === 0 ? (
          <p style={styles.noJobs}>No recent recovery jobs found.</p>
        ) : (
          <div style={styles.jobsList}>
            {recentJobs.map((job) => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobTopRow}>
                  <span style={styles.jobRoute}>
                    {job.pickupAddress || toText(job.pickup)} →{' '}
                    {job.dropoffAddress || toText(job.dropoff)}
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusColor(job.status),
                    }}
                  >
                    {prettyStatus(job.status)}
                  </span>
                </div>
                <div style={styles.jobMetaRow}>
                  {job.userPhone && (
                    <span style={styles.jobMetaItem}>User: {job.userPhone}</span>
                  )}
                  {job.driverPhone && (
                    <span style={styles.jobMetaItem}>Driver: {job.driverPhone}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  onPress,
}: {
  label: string;
  value: number;
  sub: string;
  onPress?: () => void;
}) {
  return (
    <div
      onClick={onPress}
      style={{
        ...styles.card,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 6px 14px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 6px rgba(0,0,0,0.1)';
      }}
    >
      <p style={styles.cardLabel}>{label}</p>
      <p style={styles.cardValue}>{value}</p>
      <p style={styles.cardSub}>{sub}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: 'green',
    borderRadius: '50%',
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'green',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshButton: {
    backgroundColor: '#000',
    color: '#FFDC00',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    marginBottom: 20,
    gap: 16,
  },
  tab: {
    background: 'none',
    border: 'none',
    paddingBottom: 6,
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
  },
  activeTab: {
    borderColor: '#FFDC00',
  },
  tabText: {
    fontSize: 15,
    color: '#555',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#FFDC00',
    borderRadius: 14,
    padding: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  cardSub: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },

  // recent jobs styles
  jobsBlock: {
    marginTop: 24,
  },
  noJobs: {
    fontSize: 14,
    color: '#555',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  jobCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 14,
    border: '1px solid #eee',
  },
  jobTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  jobRoute: {
    fontSize: 14,
    color: '#000',
    fontWeight: 500,
  },
  statusBadge: {
    fontSize: 12,
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 999,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  jobMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  jobMetaItem: {
    fontSize: 12,
    color: '#555',
  },
};
