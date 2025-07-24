import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent.web';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

interface UserData {
  id: string;
  name: string;
  phone?: string;
  location?: LocationData;
}

interface DriverData {
  id: string;
  name: string;
  phone?: string;
  location?: LocationData;
  isOnline?: boolean;
}

interface LogEntry {
  id: string;
  time: string;
  driver: string;
  action: string;
}

export default function LiveActivity() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userLocations, setUserLocations] = useState<UserData[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to users' real-time locations
    const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const users = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => (u as UserData).location) as UserData[];
      setUserLocations(users);
    });

    // Listen to drivers' real-time locations
    const unsubDrivers = onSnapshot(collection(firestore, 'drivers'), (snapshot) => {
      const drivers = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => (d as DriverData).location) as DriverData[];
      setDriverLocations(drivers);

      // Create live logs
      const driverLogs = drivers.map((driver, index) => ({
        id: driver.id || index.toString(),
        time: new Date().toLocaleTimeString(),
        driver: driver.name || 'Driver',
        action: driver.isOnline ? 'Online & Available' : 'Offline',
      }));
      setLogs(driverLogs);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubDrivers();
    };
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Driver & User Map</h2>

      <div style={styles.mapContainer}>
        <MapComponent
          userLocations={userLocations.map((u) => u.location!).filter(Boolean)}
          driverLocations={driverLocations.map((d) => d.location!).filter(Boolean)}
        />
      </div>

      <h2 style={styles.title}>Driver Activity Logs</h2>
      {loading ? (
        <p style={styles.emptyLogs}>Loading real-time data...</p>
      ) : logs.length === 0 ? (
        <p style={styles.emptyLogs}>No recent activity logs.</p>
      ) : (
        logs.map((item) => (
          <div key={item.id} style={styles.logCard}>
            <p style={styles.logText}>
              🕒 {item.time} - {item.driver} - {item.action}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

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
  emptyLogs: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
  },
};
