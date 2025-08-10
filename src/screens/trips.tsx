import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

interface TripData {
  id: string;
  driver: string;
  rider: string;
  date: string;
  amount: number;
  pickup?: string;
  dropoff?: string;
}

export default function AdminTrips() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const tripsSnap = await getDocs(collection(firestore, 'trip_history_driver'));

        const tripsData: TripData[] = tripsSnap.docs.map((doc) => {
          const data = doc.data();
          const date =
            data.timestamp?.toDate
              ? data.timestamp.toDate().toLocaleDateString()
              : new Date(data.timestamp || Date.now()).toLocaleDateString();

          return {
            id: doc.id,
            driver: data.driverPhone || 'Unknown Driver',
            rider: data.userPhone || 'Unknown User',
            date,
            amount: parseFloat(data.amount) || 0,
            pickup: data.pickup || 'N/A',
            dropoff: data.dropoff || 'N/A',
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

      <div style={styles.list}>
        {trips.length === 0 ? (
          <p style={styles.noData}>No trips found.</p>
        ) : (
          trips.map((item) => {
            const commission = item.amount * 0.2;
            const earnings = item.amount - commission;

            return (
              <div key={item.id} style={styles.card}>
                <p style={styles.label}><strong>🚗 Driver:</strong> {item.driver}</p>
                <p style={styles.label}><strong>🙋 Rider:</strong> {item.rider}</p>
                <p style={styles.label}><strong>📍 Pickup:</strong> {item.pickup}</p>
                <p style={styles.label}><strong>📍 Drop-off:</strong> {item.dropoff}</p>
                <p style={styles.label}><strong>📅 Date:</strong> {item.date}</p>
                <p style={styles.label}><strong>💵 Amount:</strong> AED {item.amount.toFixed(2)}</p>
                <p style={styles.labelGreen}>
                  <strong>✅ Earnings After 20%:</strong>
                  <span style={styles.valueGreen}> AED {earnings.toFixed(2)}</span>
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
