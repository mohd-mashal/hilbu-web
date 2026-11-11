import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import MapComponent from '../components/MapComponent.web';

interface LogEntry {
  id: string;
  time: string;
  driver: string;
  action: string;
  isOnline?: boolean;
  vehicleType?: 'recovery' | 'pickup';
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
  createdAt?: any;
  serviceType?: string;
  itemType?: string;
  itemDetails?: string;
  loadingHelp?: boolean;
}

// Existing records without a serviceType remain Recovery.
const getJobService = (job: JobEntry): 'recovery' | 'pickup' =>
  String(job?.serviceType || '').trim().toLowerCase() === 'pickup' ? 'pickup' : 'recovery';

const serviceLabel = (job: JobEntry) =>
  getJobService(job) === 'pickup' ? 'Pickup Delivery' : 'Car Recovery';

// Existing driver registrations without vehicleType remain Recovery.
const getDriverService = (driver: any): 'recovery' | 'pickup' =>
  driver?.vehicleType === 'pickup' || driver?.serviceType === 'pickup' ? 'pickup' : 'recovery';

const toText = (v: any) =>
  typeof v === 'string'
    ? v
    : v?.address ?? '';

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
        ? v.charAt(0).toUpperCase() +
            v.slice(1)
        : 'Unknown';
  }
};

const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase();

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

const getDateFromValue = (
  value?: any
): Date | null => {
  if (!value) return null;

  try {
    if (
      typeof value?.toDate ===
      'function'
    ) {
      const date = value.toDate();

      return isNaN(date.getTime())
        ? null
        : date;
    }

    const date = new Date(value);

    return isNaN(date.getTime())
      ? null
      : date;
  } catch {
    return null;
  }
};

const getJobDate = (
  job: JobEntry
): Date | null => {
  return (
    getDateFromValue(job.createdAt) ||
    getDateFromValue(job.timestamp)
  );
};

const getJobTimeValue = (
  job: JobEntry
) => {
  return getJobDate(job)?.getTime() || 0;
};

const formatJobTime = (
  job: JobEntry
) => {
  const d = getJobDate(job);

  if (!d) return '';

  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function LiveActivity() {
  const [logs, setLogs] =
    useState<LogEntry[]>([]);

  const [jobs, setJobs] =
    useState<JobEntry[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    // Drivers → activity logs
    const unsubDrivers = onSnapshot(
      collection(
        firestore,
        'drivers'
      ),
      (snapshot) => {
        if (!isMounted) return;

        const driverLogs:
          LogEntry[] =
          snapshot.docs.map(
            (docSnap, index) => {
              const data: any =
                docSnap.data();

              const isOnline =
                !!data?.isOnline;

              return {
                id:
                  docSnap.id ||
                  index.toString(),

                time:
                  new Date().toLocaleTimeString(
                    'en-GB',
                    {
                      hour:
                        '2-digit',
                      minute:
                        '2-digit',
                    }
                  ),

                driver:
                  data?.name ||
                  data?.driverPhone ||
                  data?.phone ||
                  'Driver',

                action: isOnline
                  ? 'Online & Available'
                  : 'Offline',

                isOnline,
                vehicleType: getDriverService(data),
              };
            }
          );

        // Online drivers first
        driverLogs.sort(
          (a, b) => {
            const av = a.isOnline
              ? 1
              : 0;

            const bv = b.isOnline
              ? 1
              : 0;

            return bv - av;
          }
        );

        setLogs(driverLogs);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Error loading driver activity:',
          error
        );

        setLoading(false);
      }
    );

    // Latest Recovery and Pickup jobs are stored in the existing collection.
    const jobsQuery = query(
      collection(
        firestore,
        'recovery_requests'
      ),
      orderBy(
        'createdAt',
        'desc'
      ),
      limit(5)
    );

    const unsubJobs = onSnapshot(
      jobsQuery,
      (snapshot) => {
        if (!isMounted) return;

        const jobList =
          snapshot.docs
            .map(
              (docSnap) =>
                ({
                  id: docSnap.id,
                  ...docSnap.data(),
                } as JobEntry)
            )
            .sort(
              (a, b) =>
                getJobTimeValue(b) -
                getJobTimeValue(a)
            );

        setJobs(jobList);
      },
      (error) => {
        console.error(
          'Error loading live Recovery / Pickup jobs:',
          error
        );
      }
    );

    return () => {
      isMounted = false;
      unsubDrivers();
      unsubJobs();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Live Activity
          </h1>

          <p style={styles.subtitle}>
            Live drivers and recent Recovery / Pickup
            activity.
          </p>
        </div>

        <div style={styles.liveBadge}>
          <span style={styles.liveDot} />
          LIVE
        </div>
      </div>

      <div style={styles.mapCard}>
        <div style={styles.mapHeader}>
          <div>
            <h2 style={styles.mapTitle}>
              Live Driver Map
            </h2>

            <p style={styles.mapSubtitle}>
              Online drivers currently
              available on the HILBU network.
            </p>
          </div>
        </div>

        <div style={styles.mapShell}>
          <MapComponent />
        </div>
      </div>

      <SectionJobs jobs={jobs} />

      <SectionLogs
        loading={loading}
        logs={logs}
      />
    </div>
  );
}

/* ---------------- Jobs ---------------- */

function SectionJobs({
  jobs,
}: {
  jobs: JobEntry[];
}) {
  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.subTitle}>
            Live Recovery &amp; Pickup Jobs
          </h2>

          <p style={styles.sectionDescription}>
            Latest Recovery and Pickup jobs appear first.
          </p>
        </div>

        <span style={styles.countBadge}>
          {jobs.length}
        </span>
      </div>

      {jobs.length === 0 ? (
        <p style={styles.emptyLogs}>
          No recent Recovery or Pickup jobs.
        </p>
      ) : (
        <div style={styles.jobsList}>
          {jobs.map(
            (job, index) => {
              const timeText =
                formatJobTime(job);

              const pickup =
                job.pickupAddress ||
                toText(job.pickup) ||
                'Pickup not available';

              const dropoff =
                job.dropoffAddress ||
                toText(job.dropoff) ||
                'Drop-off not available';

              return (
                <div
                  key={job.id}
                  style={styles.jobCard}
                >
                  <div
                    style={
                      styles.jobNumber
                    }
                  >
                    {index + 1}
                  </div>

                  <div
                    style={
                      styles.jobContent
                    }
                  >
                    <div
                      style={
                        styles.jobTopRow
                      }
                    >
                      <span
                        style={
                          styles.jobRoute
                        }
                      >
                        {getJobService(job) === 'pickup' ? '🛻' : '🚗'}{' '}
                        {pickup} →{' '}
                        {dropoff}
                      </span>

                      <div style={styles.jobBadges}>
                        <span
                          style={{
                            ...styles.serviceBadge,
                            ...(getJobService(job) === 'pickup'
                              ? styles.pickupServiceBadge
                              : styles.recoveryServiceBadge),
                          }}
                        >
                          {serviceLabel(job)}
                        </span>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              statusColor(
                                job.status
                              ),
                          }}
                        >
                          {prettyStatus(
                            job.status
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      style={
                        styles.jobMetaRow
                      }
                    >
                      {job.userPhone && (
                        <span
                          style={
                            styles.jobMetaItem
                          }
                        >
                          User:{' '}
                          {
                            job.userPhone
                          }
                        </span>
                      )}

                      {job.driverPhone && (
                        <span
                          style={
                            styles.jobMetaItem
                          }
                        >
                          Driver:{' '}
                          {
                            job.driverPhone
                          }
                        </span>
                      )}

                      {getJobService(job) === 'pickup' && (job.itemType || job.itemDetails) && (
                        <span style={styles.jobMetaItem}>
                          Item: {String(job.itemType || job.itemDetails)}
                        </span>
                      )}

                      {getJobService(job) === 'pickup' && job.loadingHelp === true && (
                        <span style={styles.jobMetaItem}>
                          Loading / unloading help requested
                        </span>
                      )}

                      {timeText && (
                        <span
                          style={
                            styles.jobTime
                          }
                        >
                          {timeText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Driver logs ---------------- */

function SectionLogs({
  loading,
  logs,
}: {
  loading: boolean;
  logs: LogEntry[];
}) {
  const onlineCount =
    logs.filter(
      (item) => item.isOnline
    ).length;

  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.subTitle}>
            Driver Activity
          </h2>

          <p style={styles.sectionDescription}>
            Current driver availability.
          </p>
        </div>

        <span style={styles.onlineBadge}>
          {onlineCount} Online
        </span>
      </div>

      {loading ? (
        <p style={styles.emptyLogs}>
          Loading real-time data...
        </p>
      ) : logs.length === 0 ? (
        <p style={styles.emptyLogs}>
          No recent driver activity.
        </p>
      ) : (
        <div style={styles.logsList}>
          {logs.map((item) => (
            <div
              key={item.id}
              style={styles.logCard}
            >
              <div
                style={
                  styles.driverInfo
                }
              >
                <div
                  style={{
                    ...styles.driverDot,
                    backgroundColor:
                      item.isOnline
                        ? '#2ECC71'
                        : '#E74C3C',
                  }}
                />

                <div>
                  <div
                    style={
                      styles.driverName
                    }
                  >
                    {item.driver}
                  </div>

                  <div
                    style={
                      styles.driverTime
                    }
                  >
                    Updated{' '}
                    {item.time}
                  </div>
                  <div style={styles.driverVehicleType}>
                    {item.vehicleType === 'pickup' ? 'Pickup Truck' : 'Recovery Truck'}
                  </div>
                </div>
              </div>

              <span
                style={{
                  ...styles.logStatusBadge,
                  backgroundColor:
                    item.isOnline
                      ? '#2ECC71'
                      : '#E74C3C',
                }}
              >
                {item.action}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Styles ---------------- */

const styles: Record<
  string,
  React.CSSProperties
> = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0,
    color: '#000',
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 0,
    fontSize: 14,
    color: '#666',
  },

  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '8px 13px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#2ECC71',
  },

  mapCard: {
    backgroundColor: '#fff',
    border: '1px solid #ededed',
    borderRadius: 18,
    padding: 16,
    boxShadow:
      '0 6px 18px rgba(0,0,0,0.06)',
    marginBottom: 24,
  },

  mapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  mapTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#000',
    margin: 0,
  },

  mapSubtitle: {
    marginTop: 4,
    marginBottom: 0,
    fontSize: 12,
    color: '#777',
  },

  mapShell: {
    width: '100%',
    height: '44vh',
    minHeight: 350,
    maxHeight: 520,
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid #FFDC00',
    position: 'relative',
    background: '#fff',
  },

  sectionCard: {
    backgroundColor: '#fff',
    border: '1px solid #ededed',
    borderRadius: 18,
    padding: 18,
    boxShadow:
      '0 6px 18px rgba(0,0,0,0.05)',
    marginBottom: 24,
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  subTitle: {
    fontSize: 19,
    fontWeight: 800,
    margin: 0,
    color: '#000',
  },

  sectionDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    marginBottom: 0,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFDC00',
    color: '#000',
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  onlineBadge: {
    padding: '7px 12px',
    borderRadius: 999,
    backgroundColor:
      'rgba(46,204,113,0.12)',
    color: '#168843',
    fontSize: 12,
    fontWeight: 800,
  },

  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  jobCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 14,
    border: '1px solid #eeeeee',
  },

  jobNumber: {
    width: 30,
    height: 30,
    minWidth: 30,
    borderRadius: 15,
    backgroundColor: '#000',
    color: '#FFDC00',
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  jobContent: {
    flex: 1,
    minWidth: 0,
  },

  jobTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 7,
  },

  jobRoute: {
    fontSize: 14,
    color: '#000',
    fontWeight: 600,
    lineHeight: 1.5,
    flex: 1,
  },

  jobBadges: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },

  serviceBadge: {
    fontSize: 11,
    fontWeight: 800,
    borderRadius: 999,
    padding: '5px 9px',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },

  pickupServiceBadge: {
    backgroundColor: '#FFDC00',
    color: '#000',
    borderColor: '#000',
  },

  recoveryServiceBadge: {
    backgroundColor: '#111',
    color: '#FFDC00',
  },

  statusBadge: {
    fontSize: 11,
    color: '#fff',
    padding: '5px 10px',
    borderRadius: 999,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  jobMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },

  jobMetaItem: {
    fontSize: 11,
    color: '#666',
  },

  jobTime: {
    fontSize: 11,
    color: '#888',
    marginLeft: 'auto',
  },

  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  logCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fafafa',
    border: '1px solid #eeeeee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  driverInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  driverDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },

  driverName: {
    color: '#000',
    fontSize: 14,
    fontWeight: 700,
  },

  driverVehicleType: {
    fontSize: 11,
    fontWeight: 700,
    color: '#555',
    marginTop: 3,
  },

  driverTime: {
    color: '#888',
    fontSize: 11,
    marginTop: 3,
  },

  logStatusBadge: {
    color: '#fff',
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  emptyLogs: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: '22px 0',
  },
};