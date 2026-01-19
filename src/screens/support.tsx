import React, { useEffect, useRef, useState } from 'react';
import { getFirebaseDB } from '../firebaseConfig';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, Timestamp, where, doc, getDoc
} from 'firebase/firestore';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: any;
  seen?: boolean;
};

export default function SupportMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<{ phone: string; name?: string; role?: string; unread?: number }[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<typeof users>([]);
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [reply, setReply] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const db = getFirebaseDB();

  // Users list
  useEffect(() => {
    const qy = query(collection(db, 'support_messages'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(qy, async (snapshot) => {
      const unique = new Map<string, { phone: string; name?: string; role?: string; unread: number }>();

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as any;
        if (!data.phone) continue;

        if (!unique.has(data.phone)) {
          let role = 'user';
          let name = '';
          const userDoc = await getDoc(doc(db, 'users', data.phone));
          if (userDoc.exists()) {
            name = (userDoc.data() as any).name;
          } else {
            const driverDoc = await getDoc(doc(db, 'drivers', data.phone));
            if (driverDoc.exists()) {
              name = (driverDoc.data() as any).name;
              role = 'driver';
            }
          }
          unique.set(data.phone, { phone: data.phone, name, role, unread: 0 });
        }

        if (data.isUser && data.seen === false) {
          const current = unique.get(data.phone);
          if (current) current.unread += 1;
        }
      }

      const sortedUsers = Array.from(unique.values()).sort((a, b) => b.unread - a.unread);
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);

      if (!selectedPhone && sortedUsers.length > 0) {
        setSelectedPhone(sortedUsers[0].phone);
        setSelectedUserName(sortedUsers[0].name || sortedUsers[0].phone);
      }
    });

    return () => unsubscribe();
  }, [db, selectedPhone]);

  // Messages for selected chat
  useEffect(() => {
    if (!selectedPhone) return;

    const qy = query(
      collection(db, 'support_messages'),
      where('phone', '==', selectedPhone),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(qy, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [db, selectedPhone]);

  // Send reply
  const sendReply = async () => {
    if (!reply.trim() || !selectedPhone) return;

    try {
      await addDoc(collection(db, 'support_messages'), {
        text: reply.trim(),
        isUser: false,
        phone: selectedPhone,
        seen: false,
        timestamp: Timestamp.now(),
      });
      setReply('');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message.');
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = users.filter((u) =>
      (u.name || '').toLowerCase().includes(text.toLowerCase()) || u.phone.includes(text)
    );
    setFilteredUsers(filtered);
  };

  return (
    <div style={styles.page}>
      {/* Header bar */}
      <div style={styles.headerBar}>
        <div style={styles.brandLeft}>
          <div style={styles.brandDot} />
          <h1 style={styles.title}>Support Chat</h1>
        </div>
        <div style={styles.brandRight}>
          <span style={styles.badge}>HILBU</span>
        </div>
      </div>

      {/* Controls card */}
      <div style={styles.controlsCard}>
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={styles.search}
        />
        <div style={styles.selectWrap}>
          <label style={styles.selectLabel}>Conversations</label>
          <select
            value={selectedPhone}
            onChange={(e) => {
              const phone = e.target.value;
              const user = users.find(u => u.phone === phone);
              setSelectedPhone(phone);
              setSelectedUserName(user?.name || phone);
            }}
            style={styles.select}
          >
            {filteredUsers.map((user) => (
              <option key={user.phone} value={user.phone}>
                {user.name || user.phone} {user.role === 'driver' ? '• Driver' : '• User'}
                {user.unread ? ` • ${user.unread} unread` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat header */}
      <div style={styles.chatHeader}>
        <div style={styles.chatAbout}>
          <div style={styles.avatar}>
            {(selectedUserName || 'U').toString().charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.chatName}>{selectedUserName || selectedPhone || '—'}</div>
            <div style={styles.chatSubtitle}>Live support • HILBU</div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={styles.chatCard}>
        <div style={styles.chatBox}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.bubble,
                alignSelf: msg.isUser ? 'flex-start' : 'flex-end',
                background: msg.isUser
                  ? 'linear-gradient(135deg, #FFDC00 0%, #FFE750 100%)'
                  : '#000000',
                color: msg.isUser ? '#000' : '#fff',
                border: msg.isUser ? '1px solid #000' : '1px solid #222',
                boxShadow: msg.isUser
                  ? '0 6px 14px rgba(255, 220, 0, 0.25)'
                  : '0 6px 14px rgba(0, 0, 0, 0.2)',
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              {msg.timestamp && (
                <small style={styles.time}>
                  {msg.timestamp.toDate().toLocaleString()}
                </small>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Reply bar */}
        <div style={styles.replyRow}>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply…"
            style={styles.replyInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (reply.trim()) {
                  sendReply();
                }
              }
            }}
          />
          <button
            onClick={sendReply}
            style={{
              ...styles.sendBtn,
              opacity: reply.trim() ? 1 : 0.6,
              cursor: reply.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const YELLOW = '#FFDC00';

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 24,
    maxWidth: 1100,
    margin: '0 auto',
    height: '100vh',
    boxSizing: 'border-box',
    background: '#FFFFFF',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  },

  // Header
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderRadius: 16,
    border: `1px solid ${YELLOW}`,
    background: '#fff',
    boxShadow: '0 8px 18px rgba(0,0,0,0.06)',
  },
  brandLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  brandDot: {
    width: 12, height: 12, borderRadius: 6,
    background: YELLOW, border: '1px solid #000',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: '#000' },
  brandRight: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: {
    background: '#000', color: YELLOW, padding: '6px 10px',
    borderRadius: 999, fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
    border: `1px solid ${YELLOW}`,
  },

  // Controls
  controlsCard: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    border: '1px solid #EFEFEF',
    background: '#FAFAFA',
  },
  search: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 12,
    border: `1.5px solid ${YELLOW}`,
    outline: 'none',
    fontSize: 14,
    boxShadow: '0 4px 10px rgba(255,220,0,0.15)',
  },
  selectWrap: { display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 320 },
  selectLabel: { fontSize: 12, fontWeight: 600, color: '#666' },
  select: {
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid #E5E5E5',
    background: '#fff',
    outline: 'none',
    fontSize: 14,
    minWidth: 300,
  },

  // Chat header
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 4px',
  },
  chatAbout: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    background: 'rgba(255,220,0,0.25)',
    border: `1px solid ${YELLOW}`,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    color: '#000',
  },
  chatName: { fontWeight: 700, color: '#000', fontSize: 15, lineHeight: 1.15 },
  chatSubtitle: { fontSize: 12, color: '#666' },

  // Chat card
  chatCard: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    border: `1.5px solid ${YELLOW}`,
    borderRadius: 20,
    background: '#fff',
    boxShadow: '0 14px 28px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    minHeight: 0,
  },
  chatBox: {
    flex: 1,
    padding: 16,
    background:
      'radial-gradient(1200px 400px at 10% -100px, rgba(255,220,0,0.12), transparent), #FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
  },
  bubble: {
    padding: '10px 12px',
    borderRadius: 14,
    maxWidth: '70%',
    lineHeight: 1.45,
    fontSize: 14,
  },
  time: {
    display: 'block',
    fontSize: 10,
    opacity: 0.7,
    marginTop: 6,
  },

  // Reply
  replyRow: {
    display: 'flex',
    gap: 10,
    padding: 12,
    borderTop: '1px solid #F0F0F0',
    background: '#fff',
  },
  replyInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 999,
    border: `1.5px solid ${YELLOW}`,
    outline: 'none',
    fontSize: 14,
    boxShadow: '0 6px 14px rgba(255,220,0,0.18)',
  },
  sendBtn: {
    padding: '12px 18px',
    borderRadius: 999,
    border: '1.5px solid #000',
    background: YELLOW,
    color: '#000',
    fontWeight: 800,
    letterSpacing: 0.2,
    transition: 'transform 120ms ease',
  },
};
