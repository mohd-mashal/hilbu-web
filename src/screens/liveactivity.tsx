import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
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

interface JobEntry {
  id: string;
  pickup?: any;
  dropoff?: any;
  pickupAddress?: string;
  dropoffAddress?: string;
  status?: string;
  driverPhone?: string;
  userPhone?: string;
  timestamp?: string;
}

const defaultCenter = { lat: 25.2048, lng: 55.2708 };
const toText = (v: any) => (typeof v === 'string' ? v : v?.address ?? '');

export default function LiveActivity() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [userLocations, setUserLocations] = useState<UserData[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(true);

  const apiKey =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
    (typeof process !== 'undefined' && (process as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
    '';

  const { isLoaded } = useJsApiLoader({
    id: 'hilbu-admin-live-map',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const userIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    return { url: '/MapCar.png', scaledSize: new window.google.maps.Size(28, 32) };
  }, [isLoaded]);

  const driverIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    return { url: '/tow-truck.png', scaledSize: new window.google.maps.Size(28, 32) };
  }, [isLoaded]);

  const fitAll = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    userLocations.forEach((u) => u.location && bounds.extend({ lat: u.location.latitude, lng: u.location.longitude }));
    driverLocations.forEach((d) => d.location && bounds.extend({ lat: d.location.latitude, lng: d.location.longitude }));
    if (bounds.isEmpty()) {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(11);
    } else {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [userLocations, driverLocations]);

  useEffect(() => {
    // users
    const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const users = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as UserData))
        .filter((u) => u.location);
      setUserLocations(users);
    });

    // drivers
    const unsubDrivers = onSnapshot(collection(firestore, 'drivers'), (snapshot) => {
      const drivers = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as DriverData))
        .filter((d) => d.location);
      setDriverLocations(drivers);

      const driverLogs = drivers.map((driver, index) => ({
        id: driver.id || index.toString(),
        time: new Date().toLocaleTimeString(),
        driver: driver.name || 'Driver',
        action: driver.isOnline ? 'Online & Available' : 'Offline',
      }));
      setLogs(driverLogs);
      setLoading(false);
    });

    // recent jobs
    const jobsQuery = query(
      collection(firestore, 'recovery_requests'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as JobEntry));
      setJobs(jobList);
    });

    return () => {
      unsubUsers();
      unsubDrivers();
      unsubJobs();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) fitAll();
  }, [isLoaded, userLocations, driverLocations, fitAll]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Driver & User Map</h2>

      <div style={styles.mapShell}>
        {!isLoaded ? (
          <div style={styles.loading}>Loading map…</div>
        ) : (
          <GoogleMap
            mapContainerStyle={styles.mapContainer as any}
            center={defaultCenter}
            zoom={12}
            options={{
              gestureHandling: 'greedy',
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
            onLoad={(map) => {
              mapRef.current = map;
              fitAll();
            }}
            onUnmount={() => { mapRef.current = null; }}
          >
            {userLocations.map(
              (u) =>
                u.location && (
                  <Marker
                    key={`u-${u.id}`}
                    position={{ lat: u.location.latitude, lng: u.location.longitude }}
                    icon={userIcon}
                  />
                )
            )}
            {driverLocations.map(
              (d) =>
                d.location && (
                  <Marker
                    key={`d-${d.id}`}
                    position={{ lat: d.location.latitude, lng: d.location.longitude }}
                    icon={driverIcon}
                  />
                )
            )}
          </GoogleMap>
        )}
      </div>

      <h2 style={styles.title}>Live Recovery Jobs</h2>
      {jobs.length === 0 ? (
        <p style={styles.emptyLogs}>No recent recovery jobs.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} style={styles.jobCard}>
            <p style={styles.jobText}>
              🚗 {job.pickupAddress || toText(job.pickup)} → {job.dropoffAddress || toText(job.dropoff)} | {job.status || '—'}{' '}
              {job.driverPhone ? `by ${job.driverPhone}` : '(unassigned)'}
            </p>
          </div>
        ))
      )}

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
  mapContainer: {
    width: '100%',
    height: '100%',
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
  jobCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  jobText: {
    color: '#000',
    fontSize: 15,
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
