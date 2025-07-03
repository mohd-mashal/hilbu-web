// App.tsx

import './index.css';
import React, { useState, useEffect } from 'react';
import {
  Home, Users as UsersIcon, Truck, List, BarChart2, Bell,
  Activity, DollarSign, MessageCircle as MessageCircleIcon,
  LogOut, Menu, X, Lock, Mail,
} from 'lucide-react';

import Dashboard from './screens/dashboard';
import Users from './screens/users';
import Drivers from './screens/drivers';
import Trips from './screens/trips';
import Reports from './screens/reports';
import Notifications from './screens/notifications';
import LiveActivity from './screens/liveactivity';
import Payouts from './screens/payouts';
import SupportMessages from './screens/support';

const ADMINS = [
  { email: 'admin@hilbu.com', password: 'Hellokitty@7' },
  { email: 'owner@hilbu.com', password: 'Secure123' },
];

type ScreenKey =
  | 'dashboard' | 'users' | 'drivers' | 'trips'
  | 'reports' | 'notifications' | 'liveactivity' | 'payouts' | 'support';

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [active, setActive] = useState<ScreenKey>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const screens: Record<ScreenKey, { label: string; icon: any; component: () => React.ReactElement }> = {
    dashboard: { label: 'Dashboard', icon: Home, component: () => <Dashboard setActiveTab={setActive} /> },
    users: { label: 'Users', icon: UsersIcon, component: () => <Users /> },
    drivers: { label: 'Drivers', icon: Truck, component: () => <Drivers /> },
    trips: { label: 'Trips', icon: List, component: () => <Trips /> },
    reports: { label: 'Reports', icon: BarChart2, component: () => <Reports /> },
    notifications: { label: 'Notifications', icon: Bell, component: () => <Notifications /> },
    liveactivity: { label: 'Live Activity', icon: Activity, component: () => <LiveActivity /> },
    payouts: { label: 'Payouts', icon: DollarSign, component: () => <Payouts /> },
    support: { label: 'Support', icon: MessageCircleIcon, component: () => <SupportMessages /> },
  };

  const ActiveScreen = screens[active].component;

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin-auth');
    const savedEmail = localStorage.getItem('admin-email');
    const savedRemember = localStorage.getItem('admin-remember');

    if (savedRemember === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    if (savedAuth === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    const match = ADMINS.find(
      (admin) => admin.email === email.trim() && admin.password === password
    );
    if (match) {
      localStorage.setItem('admin-auth', 'true');
      localStorage.setItem('admin-email', email.trim());
      if (rememberMe) {
        localStorage.setItem('admin-remember', 'true');
      } else {
        localStorage.removeItem('admin-remember');
        localStorage.removeItem('admin-email');
      }
      setAuthenticated(true);
    } else {
      alert('Invalid email or password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    localStorage.removeItem('admin-email');
    setAuthenticated(false);
    setEmail('');
    setPassword('');
    setRememberMe(false);
  };

  if (!authenticated) {
    return (
      <div style={styles.loginWrapper}>
        <div style={styles.bgOverlay} />
        <div style={styles.loginCard}>
          <img src="/icon.png" alt="logo" style={styles.loginLogo} />
          <p style={styles.tagline}>YOUR TRUSTED CAR RECOVERY SERVICE</p>
          <h2 style={styles.title}>Welcome to HILBU Admin</h2>
          <p style={styles.subtitle}>Sign in with your admin credentials</p>

          <div style={styles.passwordRow}>
            <Mail size={16} color="#999" style={{ marginRight: 8 }} />
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputNoIcon}
            />
          </div>

          <div style={styles.passwordRow}>
            <Lock size={16} color="#999" style={{ marginRight: 8 }} />
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.inputNoIcon}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <label style={styles.rememberRow}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              style={styles.checkbox}
            />
            <span style={styles.rememberText}>Remember me</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleLogin} style={styles.loginButton}>
              🔐 Login
            </button>
          </div>

          <p style={styles.footer}>Powered by HILBU Technologies</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.sidebar, ...(collapsed ? styles.sidebarCollapsed : {}) }}>
        <button onClick={() => setCollapsed(!collapsed)} style={styles.toggleButton}>
          {collapsed ? <Menu color="#FFDC00" size={24} /> : <X color="#FFDC00" size={24} />}
        </button>

        {!collapsed && (
          <>
            <img src="/icon.png" alt="logo" style={styles.logo} />
            {email && (
              <p style={styles.loggedInEmail}>
                <strong style={{ fontSize: 11, color: '#888', display: 'block' }}>Logged in:</strong>
                <span>{email}</span>
              </p>
            )}
          </>
        )}

        <div style={styles.menuScroll}>
          {Object.entries(screens).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setActive(key as ScreenKey)}
              style={{
                ...styles.navButton,
                ...(active === key ? styles.navButtonActive : {}),
              }}
            >
              <Icon color={active === key ? '#000' : '#fff'} size={20} />
              {!collapsed && (
                <span
                  style={{
                    ...styles.navText,
                    ...(active === key ? styles.navTextActive : {}),
                  }}
                >
                  {label}
                </span>
              )}
            </button>
          ))}

          <button onClick={handleLogout} style={{ ...styles.navButton, marginTop: 30 }}>
            <LogOut color="#FFDC00" size={20} />
            {!collapsed && (
              <span style={{ ...styles.navText, color: '#FFDC00', marginLeft: 8 }}>
                Logout
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <ActiveScreen />
      </div>
    </div>
  );
};

export default App;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    backgroundColor: '#f8f8f8',
    overflow: 'hidden',
    fontFamily: 'Poppins, sans-serif',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#000',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarCollapsed: {
    width: 60,
    alignItems: 'center',
  },
  toggleButton: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 70,
    objectFit: 'contain',
    marginBottom: 4,
    alignSelf: 'center',
  },
  loggedInEmail: {
    color: '#FFDC00',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    wordBreak: 'break-word',
  },
  menuScroll: {
    flex: 1,
    overflowY: 'scroll',
    paddingRight: 4,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  } as any,
  navButton: {
    background: 'none',
    border: 'none',
    padding: '12px 10px',
    marginBottom: 10,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  },
  navButtonActive: { backgroundColor: '#FFDC00' },
  navText: { color: '#fff', fontWeight: 'bold' },
  navTextActive: { color: '#000' },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    overflowY: 'auto',
  },
  loginWrapper: {
    width: '100vw',
    height: '100vh',
    backgroundImage: 'url("/bg.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Poppins, sans-serif',
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.75)',
    zIndex: 1,
  },
  loginCard: {
    width: 370,
    padding: 28,
    borderRadius: 16,
    backgroundColor: '#fdfdfd',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    border: '2px solid #FFDC00',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  },
  loginLogo: {
    width: 240,
    height: 100,
    objectFit: 'contain',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: '#FFDC00',
    marginBottom: 20,
    fontWeight: 600,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 20,
  },
  inputNoIcon: {
    border: 'none',
    outline: 'none',
    fontSize: 12,
    flex: 1,
    fontFamily: 'Poppins, sans-serif',
  },
  passwordRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #ccc',
    borderRadius: 12,
    padding: '8px 12px',
    marginBottom: 14,
  },
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    fontSize: 14,
    color: '#000',
  },
  checkbox: {
    width: 16,
    height: 16,
    border: '1.5px solid #000',
    borderRadius: 4,
    cursor: 'pointer',
  },
  rememberText: { fontSize: 12, color: '#000' },
  loginButton: {
  width: '100%',
  backgroundColor: '#FFDC00',
  borderRadius: 13,
  fontWeight: 'bold',
  fontSize: 15,
  color: '#000',
  border: 'none',
  cursor: 'pointer',
  padding: '14px 0',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},
  footer: {
    fontSize: 12,
    color: '#888',
    marginTop: 30,
  },
};
