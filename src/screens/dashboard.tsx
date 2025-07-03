import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent.web';

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

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: ScreenKey) => void }) {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'overview' | 'analytics'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-auth');
    if (saved !== 'true') {
      window.location.href = '/login';
    } else {
      setReady(true);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!ready) return null;

  const totalUsers = 120;
  const totalDrivers = 40;
  const totalTrips = 300;
  const totalPayouts = 8;

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
          onClick={() => setTab('analytics')}
          style={{ ...styles.tab, ...(tab === 'analytics' ? styles.activeTab : {}) }}
        >
          <span style={{ ...styles.tabText, ...(tab === 'analytics' ? styles.activeTabText : {}) }}>
            Analytics
          </span>
        </button>
      </div>

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

      {tab === 'analytics' && (
        <div style={styles.mapContainer}>
          <h3 style={styles.mapTitle}>Live Map</h3>
          <MapComponent />
        </div>
      )}

      <div style={styles.logsContainer}>
        <h3 style={styles.sectionTitle}>📝 Recent System Logs</h3>
        <p style={styles.logText}>• Driver A completed a trip in Downtown</p>
        <p style={styles.logText}>• New payout request from Driver C</p>
        <p style={styles.logText}>• User Y requested car recovery</p>
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
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 14px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
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
  mapContainer: {
    height: 440,
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #ccc',
    marginBottom: 30,
    padding: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    textAlign: 'center',
  },
  logsContainer: {
    marginTop: 30,
  },
  logText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
};
