// FILE: src/screens/reports.tsx
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

import { getFirebaseDB } from '../firebaseConfig';

type Status =
  | 'pending'
  | 'approved'
  | 'rejected';

interface RawPayout {
  id: string;
  driverId?: string;
  driver?: string;
  amount?: number | string;
  bankName?: string;
  bank?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  status?: Status | string;
  timestamp?: any;
}

interface PayoutRow {
  id: string;
  driverId: string;
  driverLabel: string;
  dateISO: string;
  bankLine: string;
  accountName: string;
  iban: string;
  status: Status;
  net: number;
  gross: number;
  commission: number;
  monthKey: string;
}

const COMMISSION = 0.2;
const PAYOUT_RATE =
  1 - COMMISSION;

const normalizeStatus = (
  value: unknown
): Status => {
  const status = String(
    value || ''
  )
    .trim()
    .toLowerCase();

  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return 'pending';
};

const parseTimestamp = (
  value: any
): Date | null => {
  if (!value) {
    return null;
  }

  try {
    let date: Date;

    if (
      typeof value?.toDate ===
      'function'
    ) {
      date = value.toDate();
    } else if (
      value instanceof Date
    ) {
      date = value;
    } else if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      date = new Date(value);
    } else {
      return null;
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

const csvEscape = (
  value: unknown
) => {
  const text = String(
    value ?? ''
  );

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
};

export default function ReportsScreen() {
  const [rows, setRows] =
    useState<PayoutRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState<'all' | string>(
    'all'
  );

  // Approved payouts are the financial default
  const [
    onlyApproved,
    setOnlyApproved,
  ] = useState(true);

  // Live payout reports from Firestore
  useEffect(() => {
    const db = getFirebaseDB();

    const qy = query(
      collection(
        db,
        'payout_requests'
      ),
      orderBy(
        'timestamp',
        'desc'
      )
    );

    const unsubscribe =
      onSnapshot(
        qy,
        (snap) => {
          const mapped:
            PayoutRow[] =
            snap.docs.map(
              (docSnap) => {
                const d =
                  (docSnap.data() ||
                    {}) as RawPayout;

                const driverId = (
                  d.driverId ||
                  d.driver ||
                  '—'
                ).toString();

                const driverLabel =
                  driverId;

                const date =
                  parseTimestamp(
                    d.timestamp
                  );

                const dateISO =
                  date
                    ? date
                        .toISOString()
                        .split('T')[0]
                    : 'Unknown';

                const monthKey =
                  date
                    ? dateISO.slice(
                        0,
                        7
                      )
                    : 'unknown';

                const bankName = (
                  d.bankName ||
                  d.bank ||
                  'N/A'
                ).toString();

                const accountNumber =
                  (
                    d.accountNumber ||
                    'N/A'
                  ).toString();

                const accountName =
                  (
                    d.accountName ||
                    'N/A'
                  ).toString();

                const iban = (
                  d.iban || 'N/A'
                ).toString();

                const status =
                  normalizeStatus(
                    d.status
                  );

                // payout_requests.amount is NET to driver (80%)
                const net =
                  Number(
                    d.amount ?? 0
                  ) || 0;

                const gross =
                  net /
                  PAYOUT_RATE;

                const commission =
                  gross *
                  COMMISSION;

                return {
                  id: docSnap.id,

                  driverId,

                  driverLabel,

                  dateISO,

                  bankLine:
                    `${bankName} - ${accountNumber}`,

                  accountName,

                  iban,

                  status,

                  net: +net.toFixed(
                    2
                  ),

                  gross:
                    +gross.toFixed(
                      2
                    ),

                  commission:
                    +commission.toFixed(
                      2
                    ),

                  monthKey,
                };
              }
            );

          setRows(mapped);
          setLoading(false);
        },
        (error) => {
          console.error(
            'Error fetching payouts:',
            error
          );

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // Build month options dynamically
  const monthOptions =
    useMemo(() => {
      const set =
        new Set<string>();

      rows.forEach((r) => {
        if (
          r.monthKey &&
          r.monthKey !==
            'unknown'
        ) {
          set.add(
            r.monthKey
          );
        }
      });

      return [
        'all',
        ...Array.from(
          set
        ).sort().reverse(),
      ];
    }, [rows]);

  // Apply filters
  const filtered =
    useMemo(() => {
      return rows.filter(
        (r) => {
          const matchMonth =
            selectedMonth ===
              'all' ||
            r.monthKey ===
              selectedMonth;

          const matchStatus =
            !onlyApproved ||
            r.status ===
              'approved';

          return (
            matchMonth &&
            matchStatus
          );
        }
      );
    }, [
      rows,
      selectedMonth,
      onlyApproved,
    ]);

  // Totals
  const totals =
    useMemo(() => {
      const netSum =
        filtered.reduce(
          (sum, row) =>
            sum + row.net,
          0
        );

      const grossEq =
        netSum /
        PAYOUT_RATE;

      const commission =
        grossEq *
        COMMISSION;

      return {
        netSum:
          +netSum.toFixed(2),

        grossEq:
          +grossEq.toFixed(
            2
          ),

        commission:
          +commission.toFixed(
            2
          ),
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

    const rowsCSV =
      filtered.map(
        (r) => [
          r.id,
          r.driverLabel,
          r.dateISO,
          r.accountName,
          r.bankLine,
          r.iban,
          r.status,
          r.gross.toFixed(
            2
          ),
          r.commission.toFixed(
            2
          ),
          r.net.toFixed(2),
        ]
      );

    const csvContent = [
      headers,
      ...rowsCSV,
    ]
      .map((row) =>
        row
          .map(csvEscape)
          .join(',')
      )
      .join('\r\n');

    const blob =
      new Blob(
        [
          '\uFEFF' +
            csvContent,
        ],
        {
          type:
            'text/csv;charset=utf-8;',
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        'a'
      );

    a.href = url;

    a.download =
      `hilbu_admin_report_${
        selectedMonth ===
        'all'
          ? 'all'
          : selectedMonth
      }.csv`;

    document.body.appendChild(
      a
    );

    a.click();

    document.body.removeChild(
      a
    );

    URL.revokeObjectURL(
      url
    );
  };

  if (loading) {
    return (
      <div
        style={
          styles.loadingContainer
        }
      >
        <h2
          style={
            styles.loadingText
          }
        >
          Loading reports...
        </h2>
      </div>
    );
  }

  return (
    <div
      style={styles.container}
    >
      <h2
        style={styles.title}
      >
        📊 HILBU Admin Report
      </h2>

      <div
        style={
          styles.filtersRow
        }
      >
        <div
          style={
            styles.filterGroup
          }
        >
          <label
            style={
              styles.filterLabel
            }
          >
            🗓 Filter by Month:
          </label>

          <select
            style={
              styles.select
            }
            value={
              selectedMonth
            }
            onChange={(e) =>
              setSelectedMonth(
                e.target.value
              )
            }
          >
            {monthOptions.map(
              (m) => (
                <option
                  key={m}
                  value={m}
                >
                  {m === 'all'
                    ? 'All'
                    : m}
                </option>
              )
            )}
          </select>
        </div>

        <div
          style={
            styles.filterGroup
          }
        >
          <label
            style={
              styles.filterLabel
            }
          >
            <input
              type="checkbox"
              checked={
                onlyApproved
              }
              onChange={() =>
                setOnlyApproved(
                  (v) => !v
                )
              }
              style={{
                marginRight: 6,
              }}
            />
            ✅ Approved only
          </label>
        </div>

        <button
          style={styles.button}
          onClick={
            exportToCSV
          }
        >
          ⬇️ Export CSV
        </button>
      </div>

      <div
        style={
          styles.totalsBox
        }
      >
        <p
          style={
            styles.totalsText
          }
        >
          🧾 Gross Equivalent:
          {' '}AED{' '}
          {totals.grossEq.toFixed(
            2
          )}
        </p>

        <p
          style={
            styles.totalsText
          }
        >
          💼 HILBU Commission
          (20%): AED{' '}
          {totals.commission.toFixed(
            2
          )}
        </p>

        <p
          style={
            styles.totalsText
          }
        >
          💰 Total Net to
          Drivers: AED{' '}
          {totals.netSum.toFixed(
            2
          )}
        </p>
      </div>

      <div
        style={styles.section}
      >
        {filtered.length ===
        0 ? (
          <p
            style={
              styles.noData
            }
          >
            No payouts found.
          </p>
        ) : (
          filtered.map(
            (r) => (
              <div
                key={r.id}
                style={
                  styles.card
                }
              >
                <div
                  style={
                    styles.rowWrap
                  }
                >
                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      Driver:
                    </strong>{' '}
                    {
                      r.driverLabel
                    }
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      Date:
                    </strong>{' '}
                    {r.dateISO}
                  </p>

                  <p
                    style={
                      styles.label
                    }
                  >
                    <strong>
                      Status:
                    </strong>{' '}

                    <span
                      style={{
                        color:
                          r.status ===
                          'approved'
                            ? 'green'
                            : r.status ===
                              'rejected'
                            ? '#cc0000'
                            : '#cc9900',

                        fontWeight:
                          700,
                      }}
                    >
                      {r.status ===
                      'approved'
                        ? '✅ Approved'
                        : r.status ===
                          'rejected'
                        ? '❌ Rejected'
                        : '🕓 Pending'}
                    </span>
                  </p>
                </div>

                <p
                  style={
                    styles.label
                  }
                >
                  <strong>
                    Account Name:
                  </strong>{' '}
                  {r.accountName}
                </p>

                <p
                  style={
                    styles.label
                  }
                >
                  <strong>
                    Bank:
                  </strong>{' '}
                  {r.bankLine}
                </p>

                <p
                  style={
                    styles.label
                  }
                >
                  <strong>
                    IBAN:
                  </strong>{' '}
                  {r.iban}
                </p>

                <div
                  style={
                    styles.breakdown
                  }
                >
                  <div
                    style={
                      styles.breakItem
                    }
                  >
                    <p
                      style={
                        styles.breakTitle
                      }
                    >
                      Gross
                    </p>

                    <p
                      style={
                        styles.breakValue
                      }
                    >
                      AED{' '}
                      {r.gross.toFixed(
                        2
                      )}
                    </p>
                  </div>

                  <div
                    style={
                      styles.breakItem
                    }
                  >
                    <p
                      style={
                        styles.breakTitle
                      }
                    >
                      Commission (20%)
                    </p>

                    <p
                      style={
                        styles.breakValue
                      }
                    >
                      AED{' '}
                      {r.commission.toFixed(
                        2
                      )}
                    </p>
                  </div>

                  <div
                    style={
                      styles.breakItem
                    }
                  >
                    <p
                      style={
                        styles.breakTitle
                      }
                    >
                      Net to Driver (80%)
                    </p>

                    <p
                      style={
                        styles.breakValue
                      }
                    >
                      AED{' '}
                      {r.net.toFixed(
                        2
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
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
    backgroundColor:
      '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    border:
      '1px solid #ddd',
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
    backgroundColor:
      '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border:
      '1px solid #ddd',
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
    backgroundColor:
      '#FFDC00',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    boxShadow:
      '0 4px 6px rgba(0,0,0,0.05)',
  },

  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
  },

  rowWrap: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },

  breakdown: {
    marginTop: 12,
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(120px, 1fr))',
    gap: 10,
  },

  breakItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    border:
      '1px solid #000',
  },

  breakTitle: {
    margin: 0,
    fontWeight: 700,
    color: '#000',
  },

  breakValue: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#000',
  },

  loadingContainer: {
    display: 'flex',
    justifyContent:
      'center',
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