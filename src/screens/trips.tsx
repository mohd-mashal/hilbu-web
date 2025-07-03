import React, { useState } from 'react';

const mockTrips = [
  { id: '1', driver: 'Driver A', rider: 'User X', date: '2024-05-01', amount: 75 },
  { id: '2', driver: 'Driver B', rider: 'User Y', date: '2024-05-02', amount: 90 },
  { id: '3', driver: 'Driver A', rider: 'User Z', date: '2024-05-03', amount: 110 },
];

export default function AdminTrips() {
  const [trips] = useState(mockTrips);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧾 Trip History</h1>

      <div style={styles.list}>
        {trips.map((item) => {
          const commission = item.amount * 0.2;
          const earnings = item.amount - commission;

          return (
            <div key={item.id} style={styles.card}>
              <p style={styles.label}><strong>🚗 Driver:</strong> {item.driver}</p>
              <p style={styles.label}><strong>🙋 Rider:</strong> {item.rider}</p>
              <p style={styles.label}><strong>📅 Date:</strong> {item.date}</p>
              <p style={styles.label}><strong>💵 Amount:</strong> AED {item.amount.toFixed(2)}</p>
              <p style={styles.labelGreen}>
                <strong>✅ Earnings After 20%:</strong>{' '}
                <span style={styles.valueGreen}>AED {earnings.toFixed(2)}</span>
              </p>
            </div>
          );
        })}
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
};
