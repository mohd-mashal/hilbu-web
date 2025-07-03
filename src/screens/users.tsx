import React, { useState } from 'react';

const mockUsers = [
  { id: '1', name: 'Ali Hassan', email: 'ali@example.com', status: 'active', recovery: false },
  { id: '2', name: 'Sara Ahmed', email: 'sara@example.com', status: 'suspended', recovery: true },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(mockUsers);

  const toggleRecovery = (id: string) => {
    const updated = users.map(user =>
      user.id === id ? { ...user, recovery: !user.recovery } : user
    );
    setUsers(updated);
    alert('Recovery Toggled\nUser recovery request updated.');
  };

  const toggleStatus = (id: string) => {
    const updated = users.map(user =>
      user.id === id
        ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' }
        : user
    );
    setUsers(updated);
    alert('Status Updated\nUser status has been changed.');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👥 Manage Users</h1>
      <div style={styles.list}>
        {users.map(user => (
          <div key={user.id} style={styles.card}>
            <p style={styles.label}>👤 Name: <span style={styles.value}>{user.name}</span></p>
            <p style={styles.label}>📧 Email: <span style={styles.value}>{user.email}</span></p>
            <p style={styles.label}>⚙️ Status: <span style={styles.value}>{user.status}</span></p>
            <p style={styles.label}>🛠 Recovery: <span style={styles.value}>{user.recovery ? 'Yes' : 'No'}</span></p>

            <div style={styles.buttons}>
              <button style={styles.button} onClick={() => toggleStatus(user.id)}>
                Toggle Status
              </button>
              <button style={styles.button} onClick={() => toggleRecovery(user.id)}>
                Toggle Recovery
              </button>
            </div>
          </div>
        ))}
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
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  value: {
    fontWeight: 'normal',
  },
  buttons: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '10px 14px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
