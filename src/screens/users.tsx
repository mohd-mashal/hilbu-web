import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  // Fetch users in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'users'),
      (snapshot) => {
        const data: User[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as User[];
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleRecovery = async (id: string) => {
    if (!window.confirm('Are you sure you want to toggle recovery for this user?')) return;

    try {
      const userRef = doc(firestore, 'users', id);
      const currentUser = users.find((u) => u.id === id);
      if (!currentUser) return;

      await updateDoc(userRef, { recovery: !currentUser.recovery });
      alert('User recovery status updated successfully.');
    } catch (error) {
      console.error('Error toggling recovery:', error);
      alert('Failed to update recovery status.');
    }
  };

  const toggleStatus = async (id: string) => {
    if (!window.confirm('Are you sure you want to toggle this user status?')) return;

    try {
      const userRef = doc(firestore, 'users', id);
      const currentUser = users.find((u) => u.id === id);
      if (!currentUser) return;

      await updateDoc(userRef, {
        status: currentUser.status === 'active' ? 'suspended' : 'active',
      });
      alert('User status updated successfully.');
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update user status.');
    }
  };

  // Filtered users list with safe checks
  const filteredUsers = users.filter((user) => {
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();
    const searchValue = search.toLowerCase();

    const matchesSearch = name.includes(searchValue) || email.includes(searchValue) || phone.includes(searchValue);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>Loading users...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👥 Manage Users</h1>

      {/* Search & Filter Controls */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'suspended')}
          style={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p style={styles.noData}>No users found.</p>
      ) : (
        <div style={styles.list}>
          {filteredUsers.map((user) => (
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
                <button
                  style={{ ...styles.button, ...styles.statusButton }}
                  onClick={() => toggleStatus(user.id)}
                >
                  Toggle Status
                </button>
                <button
                  style={{ ...styles.button, ...styles.recoveryButton }}
                  onClick={() => toggleRecovery(user.id)}
                >
                  Toggle Recovery
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  searchContainer: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #ccc',
    width: 220,
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #ccc',
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
    transition: 'all 0.2s ease',
  },
  statusButton: {
    backgroundColor: '#000',
  },
  recoveryButton: {
    backgroundColor: '#333',
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
