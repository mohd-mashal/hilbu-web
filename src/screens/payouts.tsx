// FILE: src/screens/payouts.tsx

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApp } from 'firebase/app';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { getFirebaseDB } from '../firebaseConfig';

import {
  collection,
  onSnapshot,
  doc,
  query,
  orderBy,
  getDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

interface Payout {
  id: string;
  driverId?: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  amount?: number | string; // NET to driver (80%)
  status?: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  bankRef?: string;
  paidAt?: string;
  paidBy?: string;
  reason?: string;
  receiptUrl?: string;
}

const COMMISSION = 0.2;
const PAYOUT_RATE = 1 - COMMISSION;

const FUNCTIONS_REGION =
  (import.meta as any)?.env?.VITE_FIREBASE_FUNCTIONS_REGION ||
  'asia-south1';

const normalizeE164 = (
  phone?: string | null
) => {
  if (!phone) return '';

  let clean = String(phone).replace(
    /\D/g,
    ''
  );

  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }

  if (
    !clean.startsWith('971') &&
    clean.length > 0 &&
    clean[0] === '0'
  ) {
    clean = clean.slice(1);
  }

  return clean.length
    ? `+${clean}`
    : '';
};

const noPlus = (
  phone?: string | null
) =>
  String(phone || '')
    .replace(/\s/g, '')
    .replace(/^\+/, '');

const isExpoToken = (
  token: unknown
) =>
  typeof token === 'string' &&
  (token.startsWith(
    'ExponentPushToken['
  ) ||
    token.startsWith(
      'ExpoPushToken['
    ));

const normalizeStatus = (
  value: unknown
): 'pending' | 'approved' | 'rejected' => {
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

const timestampToIso = (
  value: any
): string => {
  if (!value) return '';

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
      return '';
    }

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString();
  } catch {
    return '';
  }
};

export default function AdminPayouts() {
  const [
    requests,
    setRequests,
  ] = useState<Payout[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(
    null
  );

  const db = getFirebaseDB();

  // Find driver's current Expo token
  const getDriverPushToken =
    async (
      driverIdRaw: string
    ): Promise<string | null> => {
      try {
        const driverId = String(
          driverIdRaw || ''
        ).trim();

        if (!driverId) {
          return null;
        }

        const e164 =
          normalizeE164(driverId);

        const keys = Array.from(
          new Set(
            [
              driverId,
              e164,
              noPlus(driverId),
              noPlus(e164),
            ].filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
          )
        );

        const collectionsToCheck = [
          'drivers',
          'drivers_by_phone',
        ];

        for (const collectionName of
          collectionsToCheck) {
          for (const key of keys) {
            try {
              const snapshot =
                await getDoc(
                  doc(
                    db,
                    collectionName,
                    key
                  )
                );

              if (
                !snapshot.exists()
              ) {
                continue;
              }

              const data: any =
                snapshot.data();

              const candidates = [
                data?.expoPushToken,
                data?.pushToken,
                data?.notificationToken,
                data?.expo_token,
                data?.token,
                data?.fcmToken,
              ];

              for (const token of
                candidates) {
                if (
                  isExpoToken(token)
                ) {
                  return token;
                }
              }
            } catch (error) {
              console.warn(
                `Unable to check ${collectionName}/${key}:`,
                error
              );
            }
          }
        }

        return null;
      } catch (error) {
        console.error(
          'getDriverPushToken error:',
          error
        );

        return null;
      }
    };

  // Send payout push through the working Firebase Cloud Function
  const sendPayoutPush =
    async (
      driverId: string,
      title: string,
      body: string,
      payoutRequestId: string
    ) => {
      try {
        const token =
          await getDriverPushToken(
            driverId
          );

        if (!token) {
          console.warn(
            'No valid Expo push token found for driver:',
            driverId
          );

          return false;
        }

        const app = getApp();

        const functions =
          getFunctions(
            app,
            FUNCTIONS_REGION
          );

        const sendExpoPush =
          httpsCallable(
            functions,
            'sendExpoPush'
          );

        await sendExpoPush({
          tokens: [token],

          title,

          body,

          data: {
            type: 'payout',
            payoutRequestId,
            driverId,
          },

          channelId: 'default',

          priority: 'high',
        });

        return true;
      } catch (error) {
        console.error(
          'sendPayoutPush error:',
          error
        );

        return false;
      }
    };

  // Live payout requests
  useEffect(() => {
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

        (snapshot) => {
          const data: Payout[] =
            snapshot.docs.map(
              (docSnap) => {
                const raw: any =
                  docSnap.data();

                const timestamp =
                  timestampToIso(
                    raw.timestamp
                  );

                const paidAt =
                  timestampToIso(
                    raw.paidAt
                  );

                return {
                  id: docSnap.id,

                  ...raw,

                  status:
                    normalizeStatus(
                      raw.status
                    ),

                  timestamp,

                  paidAt,
                } as Payout;
              }
            );

          setRequests(data);
          setLoading(false);
        },

        (error) => {
          console.error(
            'Error fetching payout requests:',
            error
          );

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, [db]);

  const approve = async (
    id: string
  ) => {
    if (processingId) {
      return;
    }

    try {
      const refDoc = doc(
        db,
        'payout_requests',
        id
      );

      const initialSnap =
        await getDoc(refDoc);

      if (!initialSnap.exists()) {
        throw new Error(
          'Missing request'
        );
      }

      const initialReq: any =
        initialSnap.data();

      const currentStatus =
        normalizeStatus(
          initialReq.status
        );

      if (
        currentStatus ===
        'approved'
      ) {
        alert(
          'This payout is already approved.'
        );
        return;
      }

      if (
        currentStatus ===
        'rejected'
      ) {
        alert(
          'This payout has already been rejected.'
        );
        return;
      }

      const bankRefInput =
        window.prompt(
          'Enter bank transfer reference (SWIFT / Ref No.). If you don’t have it now, type: PENDING',
          initialReq.bankRef ||
            'PENDING'
        );

      // Cancel means stop approval
      if (bankRefInput === null) {
        return;
      }

      const bankRefFinal =
        bankRefInput.trim() ||
        'PENDING';

      const paidByInput =
        window.prompt(
          'Enter your name or initials (required):',
          initialReq.paidBy || ''
        );

      // Cancel means stop approval
      if (paidByInput === null) {
        return;
      }

      const paidByFinal =
        paidByInput.trim();

      if (!paidByFinal) {
        alert(
          'Please enter your name or initials.'
        );
        return;
      }

      setProcessingId(id);

      let approvedDriverId = '';
      let approvedAmount = 0;

      await runTransaction(
        db,
        async (transaction) => {
          const latestSnap =
            await transaction.get(
              refDoc
            );

          if (
            !latestSnap.exists()
          ) {
            throw new Error(
              'Missing request'
            );
          }

          const req: any =
            latestSnap.data();

          const latestStatus =
            normalizeStatus(
              req.status
            );

          if (
            latestStatus !==
            'pending'
          ) {
            throw new Error(
              'This payout has already been processed.'
            );
          }

          approvedDriverId =
            String(
              req.driverId || ''
            );

          approvedAmount =
            Number(
              req.amount || 0
            ) || 0;

          const transferRef =
            doc(
              collection(
                db,
                'transfers'
              )
            );

          const notificationRef =
            doc(
              collection(
                db,
                'notifications'
              )
            );

          const message =
            `✅ Your payout of AED ${approvedAmount.toFixed(
              2
            )} has been approved.` +
            (bankRefFinal
              ? ` Ref: ${bankRefFinal}`
              : '');

          // All important Firestore writes happen together
          transaction.update(
            refDoc,
            {
              status:
                'approved',

              paidAt:
                serverTimestamp(),

              bankRef:
                bankRefFinal,

              paidBy:
                paidByFinal,
            }
          );

          transaction.set(
            transferRef,
            {
              payoutRequestId:
                id,

              driverId:
                approvedDriverId,

              amount:
                approvedAmount,

              status:
                'approved',

              approvedAt:
                serverTimestamp(),

              bankRef:
                bankRefFinal,

              approvedBy:
                paidByFinal,
            }
          );

          transaction.set(
            notificationRef,
            {
              type:
                'payout_approved',

              title:
                'Payout Approved',

              message,

              audience:
                approvedDriverId ||
                'driver',

              payoutRequestId:
                id,

              createdAt:
                serverTimestamp(),
            }
          );
        }
      );

      const message =
        `✅ Your payout of AED ${approvedAmount.toFixed(
          2
        )} has been approved.` +
        (bankRefFinal
          ? ` Ref: ${bankRefFinal}`
          : '');

      // Push happens after the database transaction succeeds
      await sendPayoutPush(
        approvedDriverId,
        'Payout Approved',
        message,
        id
      );

      alert(
        '✅ Payout Approved'
      );
    } catch (error) {
      console.error(
        'Error approving payout:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : '';

      if (
        message.includes(
          'already been processed'
        )
      ) {
        alert(
          'This payout has already been processed.'
        );
      } else {
        alert(
          '❌ Failed to approve payout. Try again.'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (
    id: string,
    defaultReason =
      'Not eligible'
  ) => {
    if (processingId) {
      return;
    }

    try {
      const reasonInput =
        window.prompt(
          'Reason for rejection:',
          defaultReason
        );

      // Cancel means stop rejection
      if (reasonInput === null) {
        return;
      }

      const reasonFinal =
        reasonInput.trim() ||
        defaultReason;

      setProcessingId(id);

      const refDoc = doc(
        db,
        'payout_requests',
        id
      );

      let rejectedDriverId = '';

      await runTransaction(
        db,
        async (transaction) => {
          const latestSnap =
            await transaction.get(
              refDoc
            );

          if (
            !latestSnap.exists()
          ) {
            throw new Error(
              'Missing request'
            );
          }

          const req: any =
            latestSnap.data();

          const latestStatus =
            normalizeStatus(
              req.status
            );

          if (
            latestStatus !==
            'pending'
          ) {
            throw new Error(
              'This payout has already been processed.'
            );
          }

          rejectedDriverId =
            String(
              req.driverId || ''
            );

          const notificationRef =
            doc(
              collection(
                db,
                'notifications'
              )
            );

          const message =
            `❌ Your payout request was rejected. Reason: ${reasonFinal}`;

          transaction.update(
            refDoc,
            {
              status:
                'rejected',

              reason:
                reasonFinal,

              rejectedAt:
                serverTimestamp(),
            }
          );

          transaction.set(
            notificationRef,
            {
              type:
                'payout_rejected',

              title:
                'Payout Rejected',

              message,

              audience:
                rejectedDriverId ||
                'driver',

              payoutRequestId:
                id,

              createdAt:
                serverTimestamp(),
            }
          );
        }
      );

      const message =
        `❌ Your payout request was rejected. Reason: ${reasonFinal}`;

      await sendPayoutPush(
        rejectedDriverId,
        'Payout Rejected',
        message,
        id
      );

      alert(
        '⚠️ Payout Rejected'
      );
    } catch (error) {
      console.error(
        'Error rejecting payout:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : '';

      if (
        message.includes(
          'already been processed'
        )
      ) {
        alert(
          'This payout has already been processed.'
        );
      } else {
        alert(
          '❌ Failed to reject payout. Try again.'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const totals = useMemo(() => {
    // All payout requests
    const requestedNet =
      requests.reduce(
        (sum, request) =>
          sum +
          (Number(
            request.amount
          ) || 0),
        0
      );

    const requestedGross =
      requestedNet /
      PAYOUT_RATE;

    const potentialCommission =
      requestedGross *
      COMMISSION;

    // Approved payouts only
    const approvedRequests =
      requests.filter(
        (request) =>
          request.status ===
          'approved'
      );

    const approvedNet =
      approvedRequests.reduce(
        (sum, request) =>
          sum +
          (Number(
            request.amount
          ) || 0),
        0
      );

    const approvedGross =
      approvedNet /
      PAYOUT_RATE;

    const approvedCommission =
      approvedGross *
      COMMISSION;

    return {
      requestedNet:
        +requestedNet.toFixed(
          2
        ),

      requestedGross:
        +requestedGross.toFixed(
          2
        ),

      potentialCommission:
        +potentialCommission.toFixed(
          2
        ),

      approvedNet:
        +approvedNet.toFixed(
          2
        ),

      approvedGross:
        +approvedGross.toFixed(
          2
        ),

      approvedCommission:
        +approvedCommission.toFixed(
          2
        ),
    };
  }, [requests]);

  const formatDate = (
    val?: string
  ) => {
    if (!val) {
      return '—';
    }

    try {
      const date =
        new Date(val);

      if (
        isNaN(
          date.getTime()
        )
      ) {
        return '—';
      }

      return date.toLocaleString(
        'en-GB',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    } catch {
      return '—';
    }
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
          Loading payout
          requests...
        </h2>
      </div>
    );
  }

  if (
    requests.length === 0
  ) {
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
          No payout requests
          found.
        </h2>
      </div>
    );
  }

  return (
    <div
      style={styles.container}
    >
      <h1
        style={styles.title}
      >
        💸 Payout Requests
      </h1>

      <div
        style={
          styles.messageBox
        }
      >
        <p
          style={
            styles.warning
          }
        >
          ⚠️ Minimum payout
          request must be AED
          100 (net to driver).
        </p>
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
          📊 Total Requested
          (Net to Drivers): AED{' '}
          {totals.requestedNet.toFixed(
            2
          )}
        </p>

        <p
          style={
            styles.totalsText
          }
        >
          🧾 Requested Gross
          Equivalent: AED{' '}
          {totals.requestedGross.toFixed(
            2
          )}
        </p>

        <p
          style={
            styles.totalsText
          }
        >
          💼 Potential HILBU
          Commission (20%): AED{' '}
          {totals.potentialCommission.toFixed(
            2
          )}
        </p>

        <div
          style={
            styles.totalsDivider
          }
        />

        <p
          style={
            styles.totalsText
          }
        >
          ✅ Approved Net to
          Drivers: AED{' '}
          {totals.approvedNet.toFixed(
            2
          )}
        </p>

        <p
          style={
            styles.totalsText
          }
        >
          💼 HILBU Commission
          on Approved Payouts
          (20%): AED{' '}
          {totals.approvedCommission.toFixed(
            2
          )}
        </p>

        <p
          style={
            styles.totalsText
          }
        >
          🧾 Approved Gross
          Equivalent: AED{' '}
          {totals.approvedGross.toFixed(
            2
          )}
        </p>
      </div>

      <div
        style={styles.list}
      >
        {requests.map(
          (item) => {
            const net =
              Number(
                item.amount
              ) || 0;

            const gross =
              net /
              PAYOUT_RATE;

            const commission =
              gross *
              COMMISSION;

            const whenRequested =
              formatDate(
                item.timestamp
              );

            const whenPaid =
              formatDate(
                item.paidAt
              );

            const isProcessing =
              processingId ===
              item.id;

            return (
              <div
                key={item.id}
                style={
                  styles.card
                }
              >
                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    📅 Requested:
                  </strong>{' '}
                  {whenRequested}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    👤 Driver:
                  </strong>{' '}
                  {item.driverId ||
                    '—'}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    👤 Account
                    Name:
                  </strong>{' '}
                  {item.accountName ||
                    'N/A'}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    🏦 Bank:
                  </strong>{' '}
                  {item.bankName ||
                    'N/A'}{' '}
                  -{' '}
                  {item.accountNumber ||
                    'N/A'}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    IBAN:
                  </strong>{' '}
                  {item.iban ||
                    'N/A'}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    💰 Requested
                    (Net to
                    Driver):
                  </strong>{' '}
                  AED{' '}
                  {net.toFixed(2)}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    🧾 Gross
                    Equivalent:
                  </strong>{' '}
                  AED{' '}
                  {gross.toFixed(
                    2
                  )}
                </p>

                <p
                  style={
                    styles.row
                  }
                >
                  <strong>
                    💼 HILBU
                    Commission
                    (20%):
                  </strong>{' '}
                  AED{' '}
                  {commission.toFixed(
                    2
                  )}
                </p>

                {item.status ===
                  'approved' && (
                  <>
                    <p
                      style={
                        styles.row
                      }
                    >
                      <strong>
                        ✅ Paid on:
                      </strong>{' '}
                      {whenPaid}
                    </p>

                    <p
                      style={
                        styles.row
                      }
                    >
                      <strong>
                        Ref:
                      </strong>{' '}
                      {item.bankRef ||
                        '—'}
                    </p>

                    <p
                      style={
                        styles.row
                      }
                    >
                      <strong>
                        Processed
                        by:
                      </strong>{' '}
                      {item.paidBy ||
                        '—'}
                    </p>
                  </>
                )}

                {item.status ===
                  'rejected' &&
                  item.reason && (
                    <p
                      style={{
                        ...styles.row,
                        color:
                          '#cc0000',
                      }}
                    >
                      <strong>
                        Reason:
                      </strong>{' '}
                      {
                        item.reason
                      }
                    </p>
                  )}

                <p
                  style={{
                    ...styles.status,

                    color:
                      item.status ===
                      'approved'
                        ? 'green'
                        : item.status ===
                          'rejected'
                        ? '#cc0000'
                        : '#cc9900',
                  }}
                >
                  {item.status ===
                  'approved'
                    ? '✅ Approved'
                    : item.status ===
                      'rejected'
                    ? '❌ Rejected'
                    : '🕓 Pending Approval'}
                </p>

                {item.status !==
                  'approved' &&
                  item.status !==
                    'rejected' && (
                    <div
                      style={{
                        display:
                          'flex',
                        gap: 10,
                      }}
                    >
                      <button
                        style={{
                          ...styles.button,

                          opacity:
                            isProcessing
                              ? 0.6
                              : 1,

                          cursor:
                            isProcessing
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          approve(
                            item.id
                          )
                        }
                      >
                        {isProcessing
                          ? 'Processing...'
                          : 'Approve Payout'}
                      </button>

                      <button
                        style={{
                          ...styles.button,

                          backgroundColor:
                            '#cc0000',

                          color:
                            '#fff',

                          opacity:
                            isProcessing
                              ? 0.6
                              : 1,

                          cursor:
                            isProcessing
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          reject(
                            item.id
                          )
                        }
                      >
                        {isProcessing
                          ? 'Processing...'
                          : 'Reject'}
                      </button>
                    </div>
                  )}
              </div>
            );
          }
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
    marginBottom: 16,
    textAlign: 'center',
  },

  messageBox: {
    backgroundColor:
      '#fff4f4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    border:
      '1px solid #cc0000',
  },

  warning: {
    color: '#cc0000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  totalsBox: {
    backgroundColor:
      '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border:
      '1px solid #ddd',
  },

  totalsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },

  totalsDivider: {
    height: 1,
    backgroundColor:
      '#d7d7d7',
    margin:
      '12px 0',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBottom: 100,
  },

  card: {
    backgroundColor:
      '#FFDC00',
    padding: 20,
    borderRadius: 16,
    boxShadow:
      '0 4px 8px rgba(0,0,0,0.08)',
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
    justifyContent:
      'center',
    alignItems: 'center',
    height: '100vh',
  },

  loadingText: {
    fontSize: 20,
    color: '#000',
  },
};