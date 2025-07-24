import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Updated path to match the new firebaseConfig.ts

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  recovery: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const data: User[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as User[];
      setUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const toggleRecovery = async (id: string) => {
    try {
      const userRef = doc(firestore, 'users', id);
      const currentUser = users.find((u) => u.id === id);
      if (!currentUser) return;

      await updateDoc(userRef, { recovery: !currentUser.recovery });
      alert('Recovery Toggled\nUser recovery request updated.');
    } catch (error) {
      console.error('Error toggling recovery:', error);
      alert('Error updating recovery status.');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const userRef = doc(firestore, 'users', id);
      const currentUser = users.find((u) => u.id === id);
      if (!currentUser) return;

      await updateDoc(userRef, {
        status: currentUser.status === 'active' ? 'suspended' : 'active',
      });
      alert('Status Updated\nUser status has been changed.');
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error updating user status.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👥 Manage Users</h1>
      <div style={styles.list}>
        {users.map((user) => (
          <div key={user.id} style={styles.card}>
            <p style={styles.label}>
              👤 Name: <span style={styles.value}>{user.name || 'N/A'}</span>
            </p>
            <p style={styles.label}>
              📧 Email: <span style={styles.value}>{user.email || 'N/A'}</span>
            </p>
            <p style={styles.label}>
              📱 Phone: <span style={styles.value}>{user.phone || 'N/A'}</span>
            </p>
            <p style={styles.label}>
              ⚙️ Status: <span style={styles.value}>{user.status || 'active'}</span>
            </p>
            <p style={styles.label}>
              🛠 Recovery: <span style={styles.value}>{user.recovery ? 'Yes' : 'No'}</span>
            </p>

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
