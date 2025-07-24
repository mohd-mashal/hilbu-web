import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Updated import path

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Real-time fetch from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'drivers'), (snapshot) => {
      const data: Driver[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Driver[];
      setDrivers(data);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string) => {
    try {
      const driverRef = doc(firestore, 'drivers', id);
      const currentDriver = drivers.find((d) => d.id === id);
      if (!currentDriver) return;

      const newStatus = currentDriver.status === 'active' ? 'inactive' : 'active';
      await updateDoc(driverRef, { status: newStatus });
      alert(`Driver status changed to ${newStatus}.`);
    } catch (error) {
      console.error('Error toggling driver status:', error);
      alert('Error updating driver status.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚚 Manage Drivers</h1>

      <div style={styles.list}>
        {drivers.map((item) => (
          <div key={item.id} style={styles.card}>
            <p style={styles.label}>👤 Name: <span style={styles.value}>{item.name || 'N/A'}</span></p>
            <p style={styles.label}>📱 Phone: <span style={styles.value}>{item.phone || 'N/A'}</span></p>
            <p style={styles.label}>⚙️ Status: <span style={styles.value}>{item.status || 'inactive'}</span></p>

            <button style={styles.button} onClick={() => toggleStatus(item.id)}>
              Toggle Status
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFDC00',
    padding: 20,
    borderRadius: 16,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  value: {
    fontWeight: 'normal',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '10px 14px',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
  },
};
