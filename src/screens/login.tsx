import React, { useState, useEffect } from 'react';

const ADMIN_PASSWORD = 'Hellokitty@7';

export default function AdminLogin() {
  const [password, setPassword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('admin-auth');
    if (saved === 'true') {
      window.location.href = '/Dashboard';
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin-auth', 'true');
      window.location.href = '/Dashboard';
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <div style={styles.loginContainer}>
      <h2 style={styles.title}>Admin Login</h2>
      <input
        type="password"
        placeholder="Enter Admin Password"
        style={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button style={styles.loginButton} onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    border: '1px solid #ccc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FFDC00',
    padding: 14,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    cursor: 'pointer',
    border: 'none',
  },
};
