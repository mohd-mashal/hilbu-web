import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
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

const getStatus = (value: any) => String(value || '').toLowerCase().trim();

// HILBU service types: old trips without serviceType are always Recovery.
// Pickup must be explicitly tagged serviceType: 'pickup' when booking is enabled.
type HilbuService = 'recovery' | 'pickup';

const getJobService = (job: any): HilbuService =>
  String(job?.serviceType || '').trim().toLowerCase() === 'pickup' ? 'pickup' : 'recovery';

const serviceLabel = (job: any) =>
  getJobService(job) === 'pickup' ? 'Pickup Delivery' : 'Car Recovery';

type ServiceTripStats = { active: number; completed: number; cancelled: number };
type ServiceBreakdown = Record<HilbuService, ServiceTripStats>;
const blankServiceBreakdown = (): ServiceBreakdown => ({
  recovery: { active: 0, completed: 0, cancelled: 0 },
  pickup: { active: 0, completed: 0, cancelled: 0 },
});

const isPendingUser = (user: any) => {
  const status = getStatus(user.status || user.approvalStatus || user.accountStatus);
  return (
    status === 'pending' ||
    status === 'pending_approval' ||
    status === 'waiting' ||
    status === 'under_review'
  );
};

const isActiveTripStatus = (status?: string) => {
  const v = getStatus(status);
  return v === 'pending' || v === 'accepted' || v === 'assigned' || v === 'on_the_way' || v === 'arrived';
};


const isCancelledTripStatus = (status?: string) => {
  const v = getStatus(status);
  return v === 'cancelled' || v === 'canceled' || v === 'rejected';
};

const prettyStatus = (s?: string) => {
  const v = getStatus(s);

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
    case 'rejected':
      return 'Rejected';
    default:
      return v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Unknown';
  }
};

const statusColor = (s?: string) => {
  const v = getStatus(s);

  switch (v) {
    case 'pending':
      return '#FFB347';
    case 'accepted':
    case 'assigned':
      return '#4C8DFF';
    case 'on_the_way':
      return '#9B59B6';
    case 'arrived':
      return '#7F8C8D';
    case 'completed':
      return '#2ECC71';
    case 'cancelled':
    case 'canceled':
    case 'rejected':
      return '#E74C3C';
    default:
      return '#888888';
  }
};

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: ScreenKey) => void }) {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'overview' | 'liveactivity'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingDrivers, setPendingDrivers] = useState(0);
  const [activeTrips, setActiveTrips] = useState(0);
  const [completedTrips, setCompletedTrips] = useState(0);
  const [cancelledTrips, setCancelledTrips] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [pendingSupportMessages, setPendingSupportMessages] = useState(0);

  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown>(blankServiceBreakdown);

  useEffect(() => {
    const saved = localStorage.getItem('admin-auth');

    if (saved !== 'true') {
      window.location.href = '/login';
    } else {
      setReady(true);
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchStats(), fetchRecentJobs()]);
  };

  const fetchStats = async () => {
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const usersData: any[] = [];
      usersSnap.forEach((docSnap) => usersData.push({ id: docSnap.id, ...docSnap.data() }));
      setPendingUsers(usersData.filter(isPendingUser).length);

      const pendingDriversQuery = query(
        collection(firestore, 'drivers'),
        where('status', '==', 'pending_approval')
      );
      const pendingDriversSnap = await getDocs(pendingDriversQuery);
      setPendingDrivers(pendingDriversSnap.size);

      const recoverySnap = await getDocs(collection(firestore, 'recovery_requests'));
      const recoveryData: any[] = [];
      recoverySnap.forEach((docSnap) => recoveryData.push({ id: docSnap.id, ...docSnap.data() }));

      // Preserve the original totals while providing a per-service breakdown.
      setActiveTrips(recoveryData.filter((trip) => isActiveTripStatus(trip.status)).length);
      setCancelledTrips(recoveryData.filter((trip) => isCancelledTripStatus(trip.status)).length);

      const completedTripsSnap = await getDocs(collection(firestore, 'trip_history_user'));
      setCompletedTrips(completedTripsSnap.size);

      const breakdown = blankServiceBreakdown();
      recoveryData.forEach((trip) => {
        const service = getJobService(trip);
        if (isActiveTripStatus(trip.status)) breakdown[service].active++;
        if (isCancelledTripStatus(trip.status)) breakdown[service].cancelled++;
      });
      completedTripsSnap.forEach((tripSnap) => {
        const service = getJobService(tripSnap.data());
        breakdown[service].completed++;
      });
      setServiceBreakdown(breakdown);

      const payoutsSnap = await getDocs(collection(firestore, 'payout_requests'));
      const payoutData: any[] = [];
      payoutsSnap.forEach((docSnap) => payoutData.push({ id: docSnap.id, ...docSnap.data() }));

      const onlyPendingPayouts = payoutData.filter((payout) => {
        const status = getStatus(payout.status);
        return status === 'pending' || status === 'requested' || status === 'waiting';
      });

      setPendingPayouts(onlyPendingPayouts.length);

      const supportSnap = await getDocs(collection(firestore, 'support_messages'));
      const supportData: any[] = [];
      supportSnap.forEach((docSnap) => supportData.push({ id: docSnap.id, ...docSnap.data() }));

      const waitingSupport = supportData.filter((msg) => msg.isUser === true && msg.seen === false);
      setPendingSupportMessages(waitingSupport.length);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const jobsQuery = query(
        collection(firestore, 'recovery_requests'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );

      const jobsSnap = await getDocs(jobsQuery);
      const jobs: any[] = [];
      jobsSnap.forEach((docSnap) => jobs.push({ id: docSnap.id, ...docSnap.data() }));
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData().finally(() => {
      setTimeout(() => setRefreshing(false), 500);
    });
  };

  if (!ready) return null;

  return (
    <div style={styles.container}>
      <div style={styles.statusBar}>
        <div style={styles.dot} />
        <span style={styles.statusText}>API: Online</span>
      </div>

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Important pending actions and live trip status.</p>
        </div>

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
          onClick={() => {
            setTab('liveactivity');
            setActiveTab('liveactivity');
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

      {tab === 'overview' && (
        <>
          <h2 style={styles.sectionTitle}>📊 Action Overview</h2>

          <div style={styles.cardRow}>
            <Card
              label="👤 Pending Users"
              value={pendingUsers}
              sub="Need review"
              onPress={() => setActiveTab('users')}
            />

            <Card
              label="🚗 Pending Drivers"
              value={pendingDrivers}
              sub="Need approval"
              onPress={() => setActiveTab('drivers')}
            />

            <Card
              label="🛣️ Active Trips"
              value={activeTrips}
              sub="Live / in progress"
              onPress={() => setActiveTab('trips')}
            />

            <Card
              label="💬 Support Waiting"
              value={pendingSupportMessages}
              sub="Customer messages"
              onPress={() => setActiveTab('support')}
            />

            <Card
              label="💰 Pending Payouts"
              value={pendingPayouts}
              sub="Need action"
              onPress={() => setActiveTab('payouts')}
            />
          </div>

          <h2 style={styles.sectionTitle}>🚦 Trip Summary</h2>

          <div style={styles.summaryRow}>
            <SmallCard label="Active Trips" value={activeTrips} />
            <SmallCard label="Completed Trips" value={completedTrips} />
            <SmallCard label="Cancelled / Rejected" value={cancelledTrips} />
          </div>

          <h2 style={styles.sectionTitle}>Service Breakdown</h2>
          <div style={styles.serviceBreakdownRow}>
            <ServiceCard label="Car Recovery" values={serviceBreakdown.recovery} />
            <ServiceCard label="Pickup Delivery" values={serviceBreakdown.pickup} />
          </div>
        </>
      )}

      <div style={styles.jobsBlock}>
        <div style={styles.jobsHeaderRow}>
          <h3 style={styles.sectionTitle}>📄 Recent Jobs</h3>

          <button onClick={() => setActiveTab('trips')} style={styles.viewAllButton}>
            View all trips
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <p style={styles.noJobs}>No recent jobs found.</p>
        ) : (
          <div style={styles.jobsList}>
            {recentJobs.map((job) => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobTopRow}>
                  <span style={styles.jobRoute}>
                    {job.pickupAddress || toText(job.pickup) || 'Pickup not available'} →{' '}
                    {job.dropoffAddress || toText(job.dropoff) || 'Drop-off not available'}
                  </span>

                  <div style={styles.jobBadges}>
                    <span
                      style={{
                        ...styles.serviceBadge,
                        ...(getJobService(job) === 'pickup'
                          ? styles.pickupBadge
                          : styles.recoveryBadge),
                      }}
                    >
                      {serviceLabel(job)}
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
                </div>

                <div style={styles.jobMetaRow}>
                  {job.userPhone && <span style={styles.jobMetaItem}>User: {job.userPhone}</span>}
                  {job.driverPhone && (
                    <span style={styles.jobMetaItem}>Driver: {job.driverPhone}</span>
                  )}
                  {job.price && <span style={styles.jobMetaItem}>Price: AED {job.price}</span>}
                  {job.distanceKm && (
                    <span style={styles.jobMetaItem}>Distance: {job.distanceKm} km</span>
                  )}
                  {getJobService(job) === 'pickup' && (job.itemType || job.itemDetails) && (
                    <span style={styles.jobMetaItem}>
                      Item: {String(job.itemType || job.itemDetails)}
                    </span>
                  )}
                  {getJobService(job) === 'pickup' && job.loadingHelp === true && (
                    <span style={styles.jobMetaItem}>Loading / unloading help requested</span>
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
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 18px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)';
      }}
    >
      <p style={styles.cardLabel}>{label}</p>
      <p style={styles.cardValue}>{value}</p>
      <p style={styles.cardSub}>{sub}</p>
    </div>
  );
}

function ServiceCard({ label, values }: { label: string; values: ServiceTripStats }) {
  return (
    <div style={styles.serviceCard}>
      <p style={styles.serviceCardTitle}>{label}</p>
      <div style={styles.serviceCountsRow}>
        <div style={styles.serviceCount}>
          <span style={styles.serviceCountValue}>{values.active}</span>
          <span style={styles.serviceCountLabel}>Active</span>
        </div>
        <div style={styles.serviceCount}>
          <span style={styles.serviceCountValue}>{values.completed}</span>
          <span style={styles.serviceCountLabel}>Completed</span>
        </div>
        <div style={styles.serviceCount}>
          <span style={styles.serviceCountValue}>{values.cancelled}</span>
          <span style={styles.serviceCountLabel}>Cancelled</span>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.smallCard}>
      <p style={styles.smallCardLabel}>{label}</p>
      <p style={styles.smallCardValue}>{value}</p>
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
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  refreshButton: {
    backgroundColor: '#000',
    color: '#FFDC00',
    fontWeight: 'bold',
    padding: '10px 18px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabs: {
    display: 'flex',
    marginBottom: 22,
    gap: 16,
  },
  tab: {
    background: 'none',
    border: 'none',
    paddingBottom: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 20,
    marginBottom: 32,
    width: '100%',
  },
  card: {
    backgroundColor: '#FFDC00',
    borderRadius: 18,
    padding: 18,
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
    minHeight: 150,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    border: '1px solid rgba(0,0,0,0.08)',
    minWidth: 0,
  },
  cardLabel: {
    fontSize: 15,
    color: '#000',
    marginBottom: 8,
    fontWeight: 600,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    margin: 0,
  },
  cardSub: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 20,
    marginBottom: 32,
    width: '100%',
  },
  smallCard: {
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 4px 10px rgba(0,0,0,0.14)',
  },
  smallCardLabel: {
    fontSize: 14,
    color: '#FFDC00',
    fontWeight: 700,
    margin: 0,
  },
  smallCardValue: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 0,
  },
  serviceBreakdownRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  serviceCard: {
    flex: '1 1 280px',
    borderRadius: 16,
    border: '1px solid #FFDC00',
    padding: 16,
    backgroundColor: '#fff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
    minWidth: 0,
  },
  serviceCardTitle: {
    color: '#000',
    fontWeight: 700,
    fontSize: 17,
    marginTop: 0,
    marginBottom: 16,
  },
  serviceCountsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCount: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  serviceCountValue: {
    fontWeight: 700,
    fontSize: 23,
    color: '#000',
  },
  serviceCountLabel: {
    fontSize: 12,
    color: '#555',
  },
  jobsBlock: {
    marginTop: 24,
  },
  jobsHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewAllButton: {
    backgroundColor: '#000',
    color: '#FFDC00',
    border: 'none',
    borderRadius: 10,
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
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
    borderRadius: 14,
    padding: 16,
    border: '1px solid #eee',
  },
  jobTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  jobRoute: {
    fontSize: 15,
    color: '#000',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  jobBadges: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 0,
  },
  serviceBadge: {
    fontSize: 12,
    padding: '5px 10px',
    borderRadius: 999,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  recoveryBadge: {
    backgroundColor: '#000',
    color: '#FFDC00',
  },
  pickupBadge: {
    backgroundColor: '#FFDC00',
    color: '#000',
  },
  statusBadge: {
    fontSize: 12,
    color: '#fff',
    padding: '5px 12px',
    borderRadius: 999,
    fontWeight: 700,
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
    fontWeight: 500,
  },
};