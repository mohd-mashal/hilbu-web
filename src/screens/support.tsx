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

  useEffect(() => {
    const q = query(collection(db, 'support_messages'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const unique = new Map<string, { phone: string; name?: string; role?: string; unread: number }>();

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!data.phone) continue;

        if (!unique.has(data.phone)) {
          let role = 'user';
          let name = '';
          const userDoc = await getDoc(doc(db, 'users', data.phone));
          if (userDoc.exists()) {
            name = userDoc.data().name;
          } else {
            const driverDoc = await getDoc(doc(db, 'drivers', data.phone));
            if (driverDoc.exists()) {
              name = driverDoc.data().name;
              role = 'driver';
            }
          }
          unique.set(data.phone, { phone: data.phone, name, role, unread: 0 });
        }

        if (!data.isUser && data.seen === false) {
          const current = unique.get(data.phone);
          if (current) current.unread += 1;
        }
      }

      const sortedUsers = Array.from(unique.values()).sort((a, b) => {
        if (a.unread && !b.unread) return -1;
        if (!a.unread && b.unread) return 1;
        return 0;
      });

      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
      if (!selectedPhone && sortedUsers.length > 0) {
        setSelectedPhone(sortedUsers[0].phone);
        setSelectedUserName(sortedUsers[0].name || sortedUsers[0].phone);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedPhone) return;
    const q = query(
      collection(db, 'support_messages'),
      where('phone', '==', selectedPhone),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [selectedPhone]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedPhone) return;

    const replyText = reply.trim();
    await addDoc(collection(db, 'support_messages'), {
      text: replyText,
      isUser: false,
      phone: selectedPhone,
      seen: false,
      timestamp: Timestamp.now(),
    });

    setReply('');
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = users.filter((u) =>
      (u.name || '').toLowerCase().includes(text.toLowerCase()) ||
      u.phone.includes(text)
    );
    setFilteredUsers(filtered);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Support Chat</h1>

      <div style={styles.controls}>
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={styles.search}
        />
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
              {user.name || user.phone} {user.role === 'driver' ? '(🚚 Driver)' : '(👤 User)'}
              {user.unread ? ` • ${user.unread} unread` : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.chatHeader}>
        Chat with: <strong>{selectedUserName}</strong>
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.bubble,
              alignSelf: msg.isUser ? 'flex-start' : 'flex-end',
              backgroundColor: msg.isUser ? '#FFDC00' : '#000',
              color: msg.isUser ? '#000' : '#fff',
            }}
          >
            <p style={{ margin: 0 }}>{msg.text}</p>
            <small style={styles.time}>
              {msg.timestamp?.toDate().toLocaleString()}
            </small>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div style={styles.replyBox}>
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a reply..."
          style={styles.input}
        />
        <button onClick={sendReply} style={styles.sendBtn}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 24,
    maxWidth: 1000,
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 48px)',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  controls: {
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  search: {
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    border: '1px solid #ccc',
    width: '50%',
  },
  select: {
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    border: '1px solid #ccc',
    flex: 1,
  },
  chatHeader: {
    fontSize: 14,
    marginBottom: 8,
  },
  chatBox: {
    flex: 1,
    background: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    border: '1px solid #FFDC00',
  },
  bubble: {
    padding: 12,
    borderRadius: 10,
    maxWidth: '70%',
  },
  time: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 6,
    display: 'block',
  },
  replyBox: {
    display: 'flex',
    marginTop: 16,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginRight: 8,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#FFDC00',
    color: '#000',
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
