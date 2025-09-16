import './index.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Home,
  Users as UsersIcon,
  Truck,
  List,
  BarChart2,
  Bell,
  Activity,
  DollarSign,
  MessageCircle as MessageCircleIcon,
  LogOut,
  Menu,
  X,
  Lock,
  Mail,
  Percent as PercentIcon,
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
import PromoCodes from './screens/PromoCodes';

import Privacy from './privacy';
import Terms from './terms';

// Store URLs
const IOS_URL = 'https://apps.apple.com/us/app/hilbu/id6751604180?platform=iphone';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.hilbu.recovery';

// Load admin credentials from environment
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');
const adminPasswords = (import.meta.env.VITE_ADMIN_PASSWORDS || '').split(',');

const ADMINS = adminEmails.map((email: string, i: number) => ({
  email: email.trim(),
  password: adminPasswords[i]?.trim() || '',
}));

type ScreenKey =
  | 'dashboard'
  | 'users'
  | 'drivers'
  | 'trips'
  | 'reports'
  | 'notifications'
  | 'liveactivity'
  | 'payouts'
  | 'support'
  | 'promocodes';

/* ====== Badge with hidden QR-on-hover (desktop only) ====== */
function StoreBadgeWithQR({
  imgSrc,
  alt,
  href,
  label,
}: { imgSrc: string; alt: string; href: string; label: 'iPhone' | 'Android' }) {
  const [show, setShow] = useState(false);
  const [allowHover, setAllowHover] = useState(true);

  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia('(hover: hover)');
      setAllowHover(!!mq?.matches);
    } catch {
      setAllowHover(true);
    }
  }, []);

  // Bigger QR + strong error correction (H) + margin so cameras can lock on,
  // and keep the center logo small (~18% of QR width)
  const QR_SIZE = 300;
  const LOGO_SIZE = 54; // ~18% of 300
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?` +
    `size=${QR_SIZE}x${QR_SIZE}&margin=8&ecc=H&format=png&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(href)}`;

  return (
    <div
      style={styles.storeBadgeWrap}
      onMouseEnter={() => allowHover && setShow(true)}
      onMouseLeave={() => allowHover && setShow(false)}
    >
      <a href={href} target="_blank" rel="noopener noreferrer" title={alt} style={styles.storeBadgeLink}>
        <img src={imgSrc} alt={alt} style={styles.storeMiniIconActive} />
      </a>

      {allowHover && show && (
        <div style={styles.qrPopover}>
          <div style={styles.qrBox}>
            <div style={{ ...styles.qrCanvasWrap, width: QR_SIZE, height: QR_SIZE }}>
              <img src={qrUrl} alt={`${label} QR`} style={{ ...styles.qrImg, width: QR_SIZE, height: QR_SIZE }} />
              <div
                style={{
                  ...styles.qrLogoWrap,
                  width: LOGO_SIZE,
                  height: LOGO_SIZE,
                }}
              >
                <img src="/InvoiceLogo.png" alt="HILBU" style={{ ...styles.qrLogo, width: LOGO_SIZE - 6, height: LOGO_SIZE - 6 }} />
              </div>
            </div>
            <div style={styles.qrLabelSmall}>{label}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [active, setActive] = useState<ScreenKey>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const screens: Record<
    ScreenKey,
    { label: string; icon: any; component: () => React.ReactElement }
  > = {
    dashboard: { label: 'Dashboard', icon: Home, component: () => <Dashboard setActiveTab={setActive} /> },
    users: { label: 'Users', icon: UsersIcon, component: () => <Users /> },
    drivers: { label: 'Drivers', icon: Truck, component: () => <Drivers /> },
    trips: { label: 'Trips', icon: List, component: () => <Trips /> },
    reports: { label: 'Reports', icon: BarChart2, component: () => <Reports /> },
    notifications: { label: 'Notifications', icon: Bell, component: () => <Notifications /> },
    liveactivity: { label: 'Live Activity', icon: Activity, component: () => <LiveActivity /> },
    payouts: { label: 'Payouts', icon: DollarSign, component: () => <Payouts /> },
    support: { label: 'Support', icon: MessageCircleIcon, component: () => <SupportMessages /> },
    promocodes: { label: 'Promo Codes', icon: PercentIcon, component: () => <PromoCodes /> },
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
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const handleLogin = () => {
    const match = ADMINS.find(
      (admin: { email: string; password: string }) =>
        admin.email === email.trim() && admin.password === password
    );

    if (match) {
      localStorage.setItem('admin-auth', 'true');
      localStorage.setItem('admin-email', email.trim());
      if (rememberMe) {
        localStorage.setItem('admin-remember', 'true');
      } else {
        localStorage.removeItem('admin-remember');
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

  const LoginScreen = (
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

        {/* Store badges (click to open; QR appears on desktop hover only) */}
        <div style={styles.storeRow}>
          <StoreBadgeWithQR
            imgSrc="/appstore.png"
            alt="Download on the App Store"
            href={IOS_URL}
            label="iPhone"
          />
          <StoreBadgeWithQR
            imgSrc="/playstore.png"
            alt="Get it on Google Play"
            href={ANDROID_URL}
            label="Android"
          />
        </div>
      </div>
    </div>
  );

  const AdminLayout = (
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={authenticated ? AdminLayout : LoginScreen} />
      </Routes>
    </BrowserRouter>
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
    height: 70,
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
  storeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    position: 'relative',
  },
  storeMiniIconActive: {
    height: 36,
    opacity: 1,
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'transform 0.12s ease',
  },
  storeBadgeLink: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  storeBadgeWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  // popover positioned higher to fit the larger QR
  qrPopover: {
    position: 'absolute',
    top: -360,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
    pointerEvents: 'none',
  } as any,
  qrBox: {
    background: '#fff',
    border: '2px solid #FFDC00',
    borderRadius: 12,
    boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
    padding: 10,
    textAlign: 'center',
  },
  qrCanvasWrap: {
    position: 'relative',
    width: 300,
    height: 300,
  },
  qrImg: {
    width: 300,
    height: 300,
    display: 'block',
  },
  qrLogoWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: 12,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 3px #fff',
  },
  qrLogo: {
    objectFit: 'contain',
  },
  qrLabelSmall: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#000',
  },
};
