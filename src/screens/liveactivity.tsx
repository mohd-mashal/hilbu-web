import React from 'react';
import MapComponent from '../components/MapComponent.web';

const LiveActivity = () => {
  const logs = [
    { id: '1', time: '10:00', driver: 'John', action: 'Started trip' },
    { id: '2', time: '10:15', driver: 'John', action: 'Picked up a car' },
    { id: '3', time: '10:30', driver: 'John', action: 'Dropped off a car' },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Driver & User Map</h2>

      <div style={styles.mapContainer}>
        <MapComponent />
      </div>

      <h2 style={styles.title}>Driver Activity Logs</h2>
      {logs.map((item) => (
        <div key={item.id} style={styles.logCard}>
          <p style={styles.logText}>
            🕒 {item.time} - {item.driver} - {item.action}
          </p>
        </div>
      ))}
    </div>
  );
};

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
  mapContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
    border: '1px solid #ccc',
  },
  logCard: {
    backgroundColor: '#FFDC00',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
  },
  logText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 500,
  },
};

export default LiveActivity;
