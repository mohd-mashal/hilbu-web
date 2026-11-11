import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDB } from '../firebaseConfig';

// Existing trip records without an explicit serviceType are Car Recovery.
// New Pickup Delivery records are saved as serviceType: 'pickup'.
type HilbuService = 'recovery' | 'pickup';

const getServiceType = (value: any): HilbuService =>
  String(value ?? '').trim().toLowerCase() === 'pickup' ? 'pickup' : 'recovery';

const serviceLabel = (serviceType: HilbuService) =>
  serviceType === 'pickup' ? 'Pickup Delivery' : 'Car Recovery';

interface TripData {
  id: string;
  driver: string;
  rider: string;
  date: string;
  sortTime: number;
  amount: number;
  pickup?: string;
  dropoff?: string;
  serviceType: HilbuService;
  itemType?: string;
  itemDetails?: string;
  loadingHelp?: boolean;
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
  if (s === 'canceled') return 'cancelled';
  if (s === 'cancel') return 'cancelled';

  // Do not incorrectly treat a missing status as completed
  return s || 'unknown';
};

const normalizePayment = (v: any) => {
  const s = String(v ?? '').trim().toLowerCase();

  // treat these as "paid"
  if (
    [
      'paid',
      'success',
      'succeeded',
      'completed',
      'captured',
      'done',
    ].includes(s)
  ) {
    return 'paid';
  }

  // treat empty as unknown
  if (!s) return 'unknown';

  return s;
};

const getTripDate = (data: any): Date | null => {
  try {
    let dt: Date | null = null;

    if (data?.timestamp?.toDate) {
      dt = data.timestamp.toDate();
    } else if (
      typeof data?.timestamp === 'string' ||
      typeof data?.timestamp === 'number'
    ) {
      dt = new Date(data.timestamp);
    } else if (data?.createdAt?.toDate) {
      dt = data.createdAt.toDate();
    } else if (
      typeof data?.createdAt === 'string' ||
      typeof data?.createdAt === 'number'
    ) {
      dt = new Date(data.createdAt);
    }

    if (!dt || isNaN(dt.getTime())) {
      return null;
    }

    return dt;
  } catch {
    return null;
  }
};

const prettyStatus = (status?: string) => {
  const s = String(status || '').toLowerCase();

  switch (s) {
    case 'pending':
      return 'Pending';

    case 'accepted':
      return 'Accepted';

    case 'on_the_way':
      return 'On the way';

    case 'arrived':
      return 'Arrived';

    case 'completed':
      return 'Completed';

    case 'cancelled':
      return 'Cancelled';

    case 'rejected':
      return 'Rejected';

    case 'unknown':
      return 'Unknown';

    default:
      return s
        ? s.charAt(0).toUpperCase() + s.slice(1)
        : 'Unknown';
  }
};

const prettyPayment = (status?: string) => {
  const s = String(status || '').toLowerCase();

  switch (s) {
    case 'paid':
      return 'Paid';

    case 'unknown':
      return 'Unknown';

    default:
      return s
        ? s.charAt(0).toUpperCase() + s.slice(1)
        : 'Unknown';
  }
};

export default function AdminTrips() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [serviceFilter, setServiceFilter] =
    useState<'all' | HilbuService>('all');

  const [statusFilter, setStatusFilter] =
    useState<string>('all');

  const [paymentFilter, setPaymentFilter] =
    useState<string>('all');

  const [driverFilter, setDriverFilter] =
    useState<string>('');

  useEffect(() => {
    const fetchTrips = async () => {
      const db = getFirebaseDB();

      try {
        const tripsSnap = await getDocs(
          collection(db, 'trip_history_driver')
        );

        const tripsData: TripData[] =
          tripsSnap.docs.map((docSnap) => {
            const data: any = docSnap.data();

            const dt = getTripDate(data);

            // amount: can be number or string like "AED 120.50"
            const amountNum =
              typeof data?.amount === 'number'
                ? data.amount
                : parseFloat(
                    String(data?.amount ?? '0').replace(
                      /[^\d.]/g,
                      ''
                    )
                  ) || 0;

            // pickup / dropoff: string or { address, coords }
            const pickupStr =
              typeof data?.pickup === 'string'
                ? data.pickup
                : data?.pickup?.address || 'N/A';

            const dropoffStr =
              typeof data?.dropoff === 'string'
                ? data.dropoff
                : data?.dropoff?.address || 'N/A';

            const status = normalizeStatus(
              data?.status
            );

            const paymentStatus =
              normalizePayment(
                data?.paymentStatus
              );

            // commission & earnings
            // Prefer values already stored in DB.
            // Otherwise apply HILBU 20% commission.
            const commissionFromDb =
              typeof data?.commission === 'number'
                ? data.commission
                : null;

            const earningsFromDb =
              typeof data?.earnings === 'number'
                ? data.earnings
                : null;

            const commission =
              commissionFromDb !== null
                ? commissionFromDb
                : amountNum * 0.2;

            const earnings =
              earningsFromDb !== null
                ? earningsFromDb
                : amountNum - commission;

            return {
              id: docSnap.id,

              driver:
                data?.driverPhone ||
                data?.driverId ||
                'Unknown Driver',

              rider:
                data?.userPhone ||
                data?.userId ||
                'Unknown User',

              date: dt
                ? dt.toLocaleString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Unknown',

              sortTime: dt
                ? dt.getTime()
                : 0,

              amount: amountNum,

              pickup: pickupStr,

              dropoff: dropoffStr,

              // Keep older Recovery history working without a serviceType field.
              serviceType: getServiceType(data?.serviceType),
              itemType: typeof data?.itemType === 'string' ? data.itemType : '',
              itemDetails: typeof data?.itemDetails === 'string' ? data.itemDetails : '',
              loadingHelp: data?.loadingHelp === true,

              status,

              paymentStatus,

              commission,

              earnings,
            };
          });

        // Always show newest trip first.
        // Records without a valid date go to the bottom.
        tripsData.sort(
          (a, b) =>
            b.sortTime - a.sortTime
        );

        setTrips(tripsData);
      } catch (error) {
        console.error(
          'Error fetching trips:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Apply filters
  const filteredTrips = trips.filter(
    (t) => {
      const st = (
        t.status || ''
      ).toLowerCase();

      const pay = (
        t.paymentStatus || ''
      ).toLowerCase();

      // service type filter — old records are treated as Recovery.
      if (serviceFilter !== 'all' && t.serviceType !== serviceFilter) {
        return false;
      }

      // status filter
      if (
        statusFilter !== 'all' &&
        st !== statusFilter
      ) {
        return false;
      }

      // payment filter
      if (
        paymentFilter === 'paid' &&
        pay !== 'paid'
      ) {
        return false;
      }

      if (
        paymentFilter === 'unpaid' &&
        pay === 'paid'
      ) {
        return false;
      }

      if (
        paymentFilter === 'unknown' &&
        pay !== 'unknown'
      ) {
        return false;
      }

      // driver filter
      if (
        driverFilter.trim() &&
        !t.driver
          .toLowerCase()
          .includes(
            driverFilter
              .trim()
              .toLowerCase()
          )
      ) {
        return false;
      }

      return true;
    }
  );

  if (loading) {
    return (
      <div
        style={
          styles.loadingContainer
        }
      >
        <h2
          style={styles.loadingText}
        >
          Loading trip history...
        </h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        🧾 Trip History
      </h1>

      {/* Filters row */}
      <div style={styles.filtersRow}>
        <div style={styles.filterBlock}>
          <label style={styles.filterLabel}>Service</label>
          <select
            value={serviceFilter}
            onChange={(e) =>
              setServiceFilter(e.target.value as 'all' | HilbuService)
            }
            style={styles.filterSelect}
          >
            <option value="all">All Services</option>
            <option value="recovery">Car Recovery</option>
            <option value="pickup">Pickup Delivery</option>
          </select>
        </div>

        <div
          style={styles.filterBlock}
        >
          <label
            style={styles.filterLabel}
          >
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            style={styles.filterSelect}
          >
            <option value="all">
              All
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="accepted">
              Accepted
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="cancelled">
              Cancelled
            </option>

            <option value="on_the_way">
              On the way
            </option>

            <option value="arrived">
              Arrived
            </option>

            <option value="unknown">
              Unknown
            </option>
          </select>
        </div>

        <div
          style={styles.filterBlock}
        >
          <label
            style={styles.filterLabel}
          >
            Payment
          </label>

          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(
                e.target.value
              )
            }
            style={styles.filterSelect}
          >
            <option value="all">
              All
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="unpaid">
              Unpaid
            </option>

            <option value="unknown">
              Unknown
            </option>
          </select>
        </div>

        <div
          style={styles.filterBlock}
        >
          <label
            style={styles.filterLabel}
          >
            Driver (phone / ID)
          </label>

          <input
            type="text"
            value={driverFilter}
            onChange={(e) =>
              setDriverFilter(
                e.target.value
              )
            }
            placeholder="e.g. +9715..."
            style={styles.filterInput}
          />
        </div>
      </div>

      <div style={styles.list}>
        {filteredTrips.length ===
        0 ? (
          <p style={styles.noData}>
            No trips found with current
            filters.
          </p>
        ) : (
          filteredTrips.map(
            (item) => {
              const statusLabel =
                prettyStatus(
                  item.status
                );

              const payLabel =
                prettyPayment(
                  item.paymentStatus
                );

              return (
                <div
                  key={item.id}
                  style={styles.card}
                >
                  <p style={styles.label}>
                    <strong>Service:</strong>{' '}
                    {serviceLabel(item.serviceType)}
                  </p>

                  {item.serviceType === 'pickup' && (
                    <>
                      {!!item.itemType && (
                        <p style={styles.label}>
                          <strong>Item:</strong>{' '}
                          {item.itemType}
                        </p>
                      )}
                      {!!item.itemDetails && (
                        <p style={styles.label}>
                          <strong>Item Details:</strong>{' '}
                          {item.itemDetails}
                        </p>
                      )}
                      <p style={styles.label}>
                        <strong>Loading / Unloading Help:</strong>{' '}
                        {item.loadingHelp ? 'Requested' : 'Not requested'}
                      </p>
                    </>
                  )}

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      🚗 Driver:
                    </strong>{' '}
                    {item.driver}
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      🙋 Rider:
                    </strong>{' '}
                    {item.rider}
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      📍 Pickup:
                    </strong>{' '}
                    {item.pickup}
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      📍 Drop-off:
                    </strong>{' '}
                    {item.dropoff}
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      📅 Date:
                    </strong>{' '}
                    {item.date}
                  </p>

                  <div
                    style={
                      styles.badgeRow
                    }
                  >
                    <span
                      style={
                        styles.statusBadge
                      }
                    >
                      Status:{' '}
                      {statusLabel}
                    </span>

                    <span
                      style={
                        styles.paymentBadge
                      }
                    >
                      Payment:{' '}
                      {payLabel}
                    </span>
                  </div>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      💵 Amount:
                    </strong>{' '}
                    AED{' '}
                    {item.amount.toFixed(
                      2
                    )}
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      🏦 HILBU 20%
                      Commission:
                    </strong>{' '}
                    AED{' '}
                    {item.commission.toFixed(
                      2
                    )}
                  </p>

                  <p
                    style={
                      styles.labelGreen
                    }
                  >
                    <strong>
                      ✅ Earnings After
                      20%:
                    </strong>

                    <span
                      style={
                        styles.valueGreen
                      }
                    >
                      {' '}
                      AED{' '}
                      {item.earnings.toFixed(
                        2
                      )}
                    </span>
                  </p>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
    fontFamily:
      'Arial, sans-serif',
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
    boxShadow:
      '0 2px 6px rgba(0,0,0,0.1)',
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