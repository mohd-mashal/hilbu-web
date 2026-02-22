import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import MapComponent from '../components/MapComponent.web';

interface LogEntry {
  id: string;
  time: string;
  driver: string;
  action: string;
  isOnline?: boolean;
}

interface JobEntry {
  id: string;
  pickup?: any;
  dropoff?: any;
  pickupAddress?: string;
  dropoffAddress?: string;
  status?: string;
  driverPhone?: string;
  userPhone?: string;
  timestamp?: any;
}

const toText = (v: any) => (typeof v === 'string' ? v : v?.address ?? '');

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
    case 'rejected':
      return 'Rejected';
    default:
      return v
        ? v.charAt(0).toUpperCase() + v.slice(1)
        : 'Unknown';
  }
};

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

const formatJobTime = (ts?: any) => {
  if (!ts) return '';
  let d: Date;
  try {
    if (ts.toDate) {
      d = ts.toDate();
    } else {
      d = new Date(ts);
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export default function LiveActivity() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Drivers → activity logs
    const unsubDrivers = onSnapshot(collection(firestore, 'drivers'), (snapshot) => {
      if (!isMounted) return;

      const driverLogs: LogEntry[] = snapshot.docs.map((doc, index) => {
        const data: any = doc.data();
        const isOnline = !!data?.isOnline;
        return {
          id: doc.id || index.toString(),
          time: new Date().toLocaleTimeString(),
          driver: data?.name || data?.driverPhone || 'Driver',
          action: isOnline ? 'Online & Available' : 'Offline',
          isOnline,
        };
      });

      // Online first
      driverLogs.sort((a, b) => {
        const av = a.isOnline ? 1 : 0;
        const bv = b.isOnline ? 1 : 0;
        return bv - av;
      });

      setLogs(driverLogs);
      setLoading(false);
    });

    // Last 5 recovery jobs
    const jobsQuery = query(
      collection(firestore, 'recovery_requests'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      if (!isMounted) return;
      const jobList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as JobEntry));
      setJobs(jobList);
    });

    return () => {
      isMounted = false;
      unsubDrivers();
      unsubJobs();
    };
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Activity &amp; Map</h2>

      {/* Map uses the same stable MapComponent as dashboard */}
      <div style={styles.mapShell}>
        <MapComponent />
      </div>

      <SectionJobs jobs={jobs} />
      <SectionLogs loading={loading} logs={logs} />
    </div>
  );
}

/* -------- Sections -------- */

function SectionJobs({ jobs }: { jobs: JobEntry[] }) {
  return (
    <div style={styles.jobsBlock}>
      <h2 style={styles.subTitle}>Live Recovery Jobs</h2>
      {jobs.length === 0 ? (
        <p style={styles.emptyLogs}>No recent recovery jobs.</p>
      ) : (
        <div style={styles.jobsList}>
          {jobs.map((job) => {
            const timeText = formatJobTime(job.timestamp);
            return (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobTopRow}>
                  <span style={styles.jobRoute}>
                    🚗 {job.pickupAddress || toText(job.pickup)} →{' '}
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
                  {timeText && <span style={styles.jobMetaItem}>{timeText}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLogs({ loading, logs }: { loading: boolean; logs: LogEntry[] }) {
  return (
    <div style={styles.logsBlock}>
      <h2 style={styles.subTitle}>Driver Activity Logs</h2>
      {loading ? (
        <p style={styles.emptyLogs}>Loading real-time data...</p>
      ) : logs.length === 0 ? (
        <p style={styles.emptyLogs}>No recent activity logs.</p>
      ) : (
        logs.map((item) => (
          <div key={item.id} style={styles.logCard}>
            <p style={styles.logText}>
              <span style={styles.logIcon}>🕒</span>
              <span>{item.time} - {item.driver} - </span>
              <span
                style={{
                  ...styles.logStatusBadge,
                  backgroundColor: item.isOnline ? '#2ECC71' : '#E74C3C', // only badge colored
                }}
              >
                {item.action}
              </span>
            </p>
          </div>
        ))
      )}
    </div>
  );
}

/* --------------------------- Styles --------------------------- */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  mapShell: {
    width: '100%',
    height: '60vh',
    minHeight: 420,
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
    border: '1px solid #ccc',
    position: 'relative',
    background: '#fff',
  },

  // jobs
  jobsBlock: {
    marginTop: 8,
    marginBottom: 24,
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

  // logs
  logsBlock: {
    marginTop: 16,
  },
  logCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#f7f7f7', // neutral background
    border: '1px solid #eee',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
  },
  logText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logIcon: {
    fontSize: 18,
  },
  logStatusBadge: {
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
  },

  emptyLogs: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
  },
};
