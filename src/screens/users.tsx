// FILE: src/screens/users.tsx  (replace entire file)
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

type UserStatus = 'active' | 'suspended' | string;

interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  recovery?: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  // Live users
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'users'),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as User[];
        setUsers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Clear names for buttons so it’s obvious
  const setStatus = async (id: string, to: 'active' | 'suspended') => {
    if (!window.confirm(`Set this user to ${to.toUpperCase()}?`)) return;
    try {
      await updateDoc(doc(firestore, 'users', id), { status: to });
      alert('User status updated.');
    } catch (e) {
      console.error('Status update failed:', e);
      alert('Failed to update status.');
    }
  };

  const setRecovery = async (id: string, to: boolean) => {
    if (!window.confirm(`${to ? 'Enable' : 'Disable'} recovery for this user?`)) return;
    try {
      await updateDoc(doc(firestore, 'users', id), { recovery: to });
      alert('User recovery updated.');
    } catch (e) {
      console.error('Recovery update failed:', e);
      alert('Failed to update recovery.');
    }
  };

  // Filter + search
  const filteredUsers = users.filter((u) => {
    const name = (u.name ?? '').toLowerCase();
    const email = (u.email ?? '').toLowerCase();
    const phone = (u.phone ?? '').toLowerCase();
    const sv = search.toLowerCase();
    const matchesSearch = name.includes(sv) || email.includes(sv) || phone.includes(sv);
    const status = (u.status as UserStatus) ?? 'active';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
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
          {filteredUsers.map((u) => {
            const status = (u.status as UserStatus) ?? 'active';
            const isActive = status === 'active';
            const hasRecovery = !!u.recovery;

            const statusBtnLabel = isActive ? 'Set Suspended' : 'Set Active';
            const recoveryBtnLabel = hasRecovery ? 'Disable Recovery' : 'Enable Recovery';

            return (
              <div key={u.id} style={styles.card}>
                <p style={styles.label}>
                  👤 Name: <span style={styles.value}>{u.name || 'N/A'}</span>
                </p>
                <p style={styles.label}>
                  📧 Email: <span style={styles.value}>{u.email || 'N/A'}</span>
                </p>
                <p style={styles.label}>
                  📱 Phone: <span style={styles.value}>{u.phone || 'N/A'}</span>
                </p>
                <p style={styles.label}>
                  ⚙️ Status: <span style={styles.value}>{status}</span>
                </p>
                <p style={styles.label}>
                  🛠 Recovery: <span style={styles.value}>{hasRecovery ? 'Yes' : 'No'}</span>
                </p>

                <div style={styles.buttons}>
                  <button
                    style={styles.button}
                    onClick={() => setStatus(u.id, isActive ? 'suspended' : 'active')}
                  >
                    {statusBtnLabel}
                  </button>
                  <button
                    style={styles.button}
                    onClick={() => setRecovery(u.id, !hasRecovery)}
                  >
                    {recoveryBtnLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  container: { padding: 24, backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 24, textAlign: 'center' },

  searchContainer: { display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center' },
  searchInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', width: 220 },
  filterSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' },

  list: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { backgroundColor: '#FFDC00', padding: 20, borderRadius: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },

  label: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  value: { fontWeight: 'normal' },

  buttons: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 },
  button: {
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '10px 14px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity .2s ease',
  },

  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff' },
  loadingText: { fontSize: 20, color: '#000' },
  noData: { textAlign: 'center', color: '#555', fontSize: 16 },
};
