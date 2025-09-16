import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

type PromoType = 'percent' | 'flat';

type PromoCode = {
  id?: string;
  code: string; // stored uppercase
  active: boolean;
  type: PromoType;
  percentOff?: number; // 0-100
  amountOff?: number; // AED
  expiresAt?: Timestamp | null;
  maxRedemptions?: number;
  timesRedeemed?: number; // display-only
  perUserLimit?: number;
  minSubtotal?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const theme = {
  primary: '#FFDC00',
  black: '#000000',
  bg: '#f7f7f8',
  border: '#e6e6e6',
  red: '#B00020',
  green: '#0B8F00',
  text: '#1a1a1a',
  muted: '#6b6b6b',
};

const inputBase =
  'w-full h-11 px-3 rounded-lg border outline-none text-[14px] transition-all';
const pill =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold';

// ⬇️ helper to strip undefined (Firestore rejects undefined values)
const cleanObject = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export default function PromoCodes() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const qy = query(
      collection(firestore, 'promo_codes'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(qy, (snap) => {
      const rows: PromoCode[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return items;
    return items.filter((i) => i.code?.toUpperCase().includes(q));
  }, [items, search]);

  const startCreate = () => {
    setEditing({
      code: '',
      active: true,
      type: 'percent',
      percentOff: 10,
      amountOff: undefined,
      maxRedemptions: undefined,
      timesRedeemed: 0,
      perUserLimit: undefined,
      minSubtotal: undefined,
      expiresAt: undefined,
    });
    setShowForm(true);
  };

  const startEdit = (row: PromoCode) => {
    setEditing({ ...row });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  const toDateInput = (ts?: Timestamp | null) => {
    if (!ts) return '';
    const d = ts.toDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fromDateInput = (v: string) => {
    if (!v) return undefined; // keep undefined so we can strip it
    const d = new Date(v + 'T23:59:59');
    if (isNaN(d.getTime())) return undefined;
    return Timestamp.fromDate(d);
  };

  const up = (patch: Partial<PromoCode>) =>
    setEditing((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!editing) return;
    const e = editing;

    // normalize
    const code = (e.code || '').trim().toUpperCase();
    if (!code) {
      alert('Enter code');
      return;
    }

    // exclusive fields
    let percentOff: number | undefined = undefined;
    let amountOff: number | undefined = undefined;

    if (e.type === 'percent') {
      const p = Number(e.percentOff ?? 0);
      if (!(p > 0 && p <= 100)) {
        alert('Percent must be between 1 and 100');
        return;
      }
      percentOff = Math.round(p * 100) / 100;
    } else {
      const a = Number(e.amountOff ?? 0);
      if (!(a > 0)) {
        alert('Amount must be > 0');
        return;
      }
      amountOff = Math.round(a * 100) / 100;
    }

    const payload = cleanObject({
      code,
      active: !!e.active,
      type: e.type,
      percentOff,
      amountOff,
      expiresAt: e.expiresAt ?? undefined,
      maxRedemptions:
        e.maxRedemptions !== ('' as any) && e.maxRedemptions !== null && e.maxRedemptions !== undefined
          ? Number(e.maxRedemptions)
          : undefined,
      perUserLimit:
        e.perUserLimit !== ('' as any) && e.perUserLimit !== null && e.perUserLimit !== undefined
          ? Number(e.perUserLimit)
          : undefined,
      minSubtotal:
        e.minSubtotal !== ('' as any) && e.minSubtotal !== null && e.minSubtotal !== undefined
          ? Math.round(Number(e.minSubtotal) * 100) / 100
          : undefined,
      updatedAt: serverTimestamp(),
    });

    setSaving(true);
    try {
      if (e.id) {
        await updateDoc(doc(firestore, 'promo_codes', e.id), payload);
      } else {
        await addDoc(collection(firestore, 'promo_codes'), {
          ...payload,
          timesRedeemed: 0,
          createdAt: serverTimestamp(),
        });
      }
      closeForm();
    } catch (err: any) {
      console.error('Save promo error:', err);
      alert(err?.message || 'Failed to save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: PromoCode) => {
    if (!row.id) return;
    if (!confirm(`Delete code "${row.code}"?`)) return;
    try {
      await deleteDoc(doc(firestore, 'promo_codes', row.id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete code.');
    }
  };

  const toggleActive = async (row: PromoCode) => {
    if (!row.id) return;
    try {
      await updateDoc(doc(firestore, 'promo_codes', row.id), {
        active: !row.active,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to update status.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '28px 16px 80px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: theme.text,
                letterSpacing: 0.2,
              }}
            >
              Promo Codes
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                color: theme.muted,
                fontSize: 13,
              }}
            >
              Create and manage discount codes (AED). Uppercase codes are enforced automatically.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              placeholder="Search code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputBase}
              style={{
                width: 240,
                borderColor: theme.border,
                background: '#fff',
              }}
            />
            <button
              onClick={startCreate}
              style={{
                height: 44,
                padding: '0 14px',
                borderRadius: 12,
                border: `1.5px solid ${theme.black}`,
                background: theme.primary,
                color: theme.black,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              + New Code
            </button>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 110px 140px 160px 160px 140px 120px 120px',
              gap: 10,
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: theme.muted,
              background: '#fafafa',
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <div>Code</div>
            <div>Status</div>
            <div>Type</div>
            <div>Discount</div>
            <div>Expires</div>
            <div>Usage</div>
            <div>Per-User</div>
            <div>Min Subtotal</div>
          </div>

          {/* Rows */}
          <div>
            {loading ? (
              <div style={{ padding: 18, color: theme.muted }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 18, color: theme.muted }}>No promo codes found.</div>
            ) : (
              filtered.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '160px 110px 140px 160px 160px 140px 120px 120px',
                    gap: 10,
                    padding: '14px 14px',
                    borderBottom: `1px solid ${theme.border}`,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800, color: theme.text }}>{row.code}</div>

                  <div>
                    <span
                      className={pill}
                      style={{
                        background: row.active ? 'rgba(11,143,0,0.12)' : 'rgba(176,0,32,0.12)',
                        color: row.active ? theme.green : theme.red,
                        border: `1px solid ${row.active ? 'rgba(11,143,0,0.35)' : 'rgba(176,0,32,0.35)'}`,
                      }}
                    >
                      ● {row.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ color: theme.text, fontWeight: 600 }}>
                    {row.type === 'percent' ? 'Percent' : 'Flat'}
                  </div>

                  <div style={{ color: theme.text }}>
                    {row.type === 'percent'
                      ? `${Number(row.percentOff ?? 0).toFixed(2)}%`
                      : `AED ${Number(row.amountOff ?? 0).toFixed(2)}`}
                  </div>

                  <div style={{ color: theme.text }}>
                    {row.expiresAt
                      ? row.expiresAt.toDate().toLocaleDateString()
                      : '—'}
                  </div>

                  <div style={{ color: theme.text }}>
                    {Number(row.timesRedeemed ?? 0)} /{' '}
                    {row.maxRedemptions ?? '∞'}
                  </div>

                  <div style={{ color: theme.text }}>
                    {row.perUserLimit ?? '—'}
                  </div>

                  <div style={{ color: theme.text }}>
                    {row.minSubtotal !== undefined
                      ? `AED ${Number(row.minSubtotal).toFixed(2)}`
                      : '—'}
                  </div>

                  {/* Row actions */}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      gap: 8,
                      paddingTop: 8,
                    }}
                  >
                    <button
                      onClick={() => toggleActive(row)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${theme.black}`,
                        background: '#fff',
                        color: theme.black,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => startEdit(row)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${theme.black}`,
                        background: theme.primary,
                        color: theme.black,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(row)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${theme.red}`,
                        background: '#fff',
                        color: theme.red,
                        fontWeight: 800,
                        marginLeft: 'auto',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drawer / Modal Form */}
        {showForm && editing && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 50,
            }}
            onClick={closeForm}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(760px, 96vw)',
                background: '#fff',
                borderRadius: 18,
                border: `1px solid ${theme.border}`,
                boxShadow: '0 12px 30px rgba(0,0,0,0.16)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${theme.border}`,
                  background: '#fafafa',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>
                  {editing.id ? 'Edit Promo Code' : 'New Promo Code'}
                </div>
                <button
                  onClick={closeForm}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${theme.black}`,
                    background: '#fff',
                    color: theme.black,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                {/* Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Code</label>
                    <input
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff', textTransform: 'uppercase' }}
                      placeholder="E.g. WELCOME10"
                      value={editing.code}
                      onChange={(e) => up({ code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff' }}
                      value={editing.active ? '1' : '0'}
                      onChange={(e) => up({ active: e.target.value === '1' })}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff' }}
                      value={editing.type}
                      onChange={(e) => up({ type: e.target.value as PromoType })}
                    >
                      <option value="percent">Percent</option>
                      <option value="flat">Flat (AED)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {editing.type === 'percent' ? (
                    <div>
                      <label style={labelStyle}>Percent Off (0–100)</label>
                      <input
                        type="number"
                        className={inputBase}
                        style={{ borderColor: theme.border, background: '#fff' }}
                        value={editing.percentOff ?? ''}
                        onChange={(e) => up({ percentOff: Number(e.target.value) })}
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="10"
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={labelStyle}>Amount Off (AED)</label>
                      <input
                        type="number"
                        className={inputBase}
                        style={{ borderColor: theme.border, background: '#fff' }}
                        value={editing.amountOff ?? ''}
                        onChange={(e) => up({ amountOff: Number(e.target.value) })}
                        min={0}
                        step={0.01}
                        placeholder="25"
                      />
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Max Redemptions (optional)</label>
                    <input
                      type="number"
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff' }}
                      value={editing.maxRedemptions ?? ''}
                      onChange={(e) =>
                        up({
                          maxRedemptions:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      min={0}
                      placeholder="e.g. 100"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Per-User Limit (optional)</label>
                    <input
                      type="number"
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff' }}
                      value={editing.perUserLimit ?? ''}
                      onChange={(e) =>
                        up({
                          perUserLimit:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      min={1}
                      placeholder="e.g. 1"
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Min Subtotal (AED, optional)</label>
                    <input
                      type="number"
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff' }}
                      value={editing.minSubtotal ?? ''}
                      onChange={(e) =>
                        up({
                          minSubtotal:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      min={0}
                      step={0.01}
                      placeholder="e.g. 100"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Expires On (optional)</label>
                    <input
                      type="date"
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#fff' }}
                      value={toDateInput(editing.expiresAt)}
                      onChange={(e) => up({ expiresAt: fromDateInput(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Times Redeemed</label>
                    <input
                      disabled
                      className={inputBase}
                      style={{ borderColor: theme.border, background: '#f3f3f3', color: '#666' }}
                      value={editing.timesRedeemed ?? 0}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  <button
                    onClick={closeForm}
                    style={{
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 12,
                      border: `1.5px solid ${theme.black}`,
                      background: '#fff',
                      color: theme.black,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    style={{
                      height: 44,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: `1.5px solid ${theme.black}`,
                      background: theme.primary,
                      color: theme.black,
                      fontWeight: 800,
                      cursor: 'pointer',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'Saving…' : editing.id ? 'Save Changes' : 'Create Code'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#333',
  marginBottom: 6,
};
