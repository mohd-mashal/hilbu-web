import React, { useState } from 'react';

const mockDrivers = [
  { id: '1', name: 'Driver A', phone: '0501234567', status: 'active' },
  { id: '2', name: 'Driver B', phone: '0559876543', status: 'inactive' },
];

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState(mockDrivers);

  const toggleStatus = (id: string) => {
    const updated = drivers.map(d =>
      d.id === id ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' } : d
    );
    setDrivers(updated);
    alert('Driver status has been changed.');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Manage Drivers</h1>

      <div style={styles.list}>
        {drivers.map((item) => (
          <div key={item.id} style={styles.card}>
            <p style={styles.label}>👤 Name: <span style={styles.value}>{item.name}</span></p>
            <p style={styles.label}>📱 Phone: <span style={styles.value}>{item.phone}</span></p>
            <p style={styles.label}>⚙️ Status: <span style={styles.value}>{item.status}</span></p>

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
