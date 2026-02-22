// FILE: src/screens/drivers.tsx  (or AdminDrivers.tsx – replace entire file)
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebaseConfig';

interface DocumentSet {
  front: string | null;
  back: string | null;
}

type PlaceField =
  | string
  | {
      address?: string;
      coords?: { latitude?: number; longitude?: number } | any;
      [k: string]: any;
    };

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'inactive' | 'active';
  vehicle?: string;
  plateNumber?: string;
  licenseUrl?: string;
  emiratesIdUrl?: string;
  recovery?: boolean;
  expoPushToken?: string;
  licenseDocs?: DocumentSet;
  idCardDocs?: DocumentSet;
  adminNote?: string;
  averageRating?: number;
  ratingCount?: number;
}

interface Trip {
  id: string;
  userPhone?: string;
  pickup: PlaceField;
  dropoff: PlaceField;
  amount?: number;
  timestamp?: any;
}

/* ---------------------------------
   Helpers
---------------------------------- */

function describePlace(p: PlaceField): string {
  if (p == null) return 'Unknown';
  if (typeof p === 'string') return p;
  if (typeof p === 'object') {
    if (p.address && typeof p.address === 'string') return p.address;
    if ((p as any).name) return String((p as any).name);
    if ((p as any).formatted_address) return String((p as any).formatted_address);
    const lat = p.coords?.latitude ?? (p as any).lat ?? (p as any).latitude;
    const lng = p.coords?.longitude ?? (p as any).lng ?? (p as any).longitude;
    if (typeof lat === 'number' && typeof lng === 'number') return `(${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    try {
      const s = JSON.stringify(p);
      return s.length > 60 ? s.slice(0, 57) + '…' : s;
    } catch {
      return 'Unknown';
    }
  }
  return String(p);
}

function getMimeFromDataUrl(u: string): string | null {
  if (!u?.startsWith('data:')) return null;
  const after = u.slice(5);
  const semi = after.indexOf(';');
  if (semi === -1) return null;
  return after.slice(0, semi) || null;
}

function looksLikePdf(u: string): boolean {
  if (!u) return false;
  const mime = getMimeFromDataUrl(u);
  if (mime) return mime.toLowerCase().includes('application/pdf');
  const lower = u.toLowerCase();
  return lower.includes('.pdf') || lower.includes('application/pdf');
}

function looksLikeImage(u: string): boolean {
  if (!u) return false;
  const mime = getMimeFromDataUrl(u);
  if (mime) return mime.toLowerCase().startsWith('image/');
  const lower = u.toLowerCase();
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif')
  );
}

// ✅ Fix for "Open in new tab" blank page on base64/data URLs
function isDataUrl(u: string): boolean {
  return typeof u === 'string' && u.startsWith('data:');
}

function dataUrlToBlob(u: string): Blob | null {
  try {
    // data:<mime>;base64,<data>
    const mime = getMimeFromDataUrl(u) || 'application/octet-stream';
    const comma = u.indexOf(',');
    if (comma === -1) return null;
    const base64 = u.slice(comma + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

function openInNewTabSafe(url: string) {
  if (!url) return;

  // If it's base64/data URL → convert to Blob URL then open
  if (isDataUrl(url)) {
    const blob = dataUrlToBlob(url);
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    // optional cleanup
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  // normal https url
  window.open(url, '_blank', 'noopener,noreferrer');
}

function downloadSafe(url: string, filename: string) {
  if (!url) return;

  // If it's data URL → Blob URL then download
  if (isDataUrl(url)) {
    const blob = dataUrlToBlob(url);
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  // normal https url download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'file';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

type DocViewerItem = { url: string; label?: string; filename?: string };

interface DocViewerModalProps {
  item: DocViewerItem;
  onClose: () => void;
}

const DocViewerModal: React.FC<DocViewerModalProps> = ({ item, onClose }) => {
  const isPdf = looksLikePdf(item.url);
  const isImg = looksLikeImage(item.url);

  const filename =
    item.filename ||
    (isPdf ? 'document.pdf' : isImg ? 'image.jpg' : 'file');

  return (
    <div style={styles.viewerOverlay} onClick={onClose}>
      <div style={styles.viewerBox} onClick={(e) => e.stopPropagation()}>
        <div style={styles.viewerHeader}>
          <div style={{ fontWeight: 800, color: '#000' }}>
            {item.label || (isPdf ? 'PDF Document' : isImg ? 'Image' : 'Document')}
          </div>
          <button style={styles.viewerCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.viewerContent}>
          {isPdf ? (
            <iframe title="PDF Preview" src={item.url} style={styles.pdfFrame} />
          ) : isImg ? (
            <img src={item.url} alt="Document" style={styles.viewerImage} />
          ) : (
            <div style={styles.unknownDocBox}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Preview not available</div>
              <div style={{ color: '#444', fontSize: 13 }}>You can still download / open it.</div>
            </div>
          )}
        </div>

        <div style={styles.viewerActions}>
          <button
            type="button"
            style={styles.viewerActionBtn}
            onClick={() => openInNewTabSafe(item.url)}
          >
            Open in new tab
          </button>

          <button
            type="button"
            style={{ ...styles.viewerActionBtn, backgroundColor: '#FFDC00', color: '#000' }}
            onClick={() => downloadSafe(item.url, filename)}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

function DocThumb({
  url,
  label,
  onClick,
}: {
  url: string;
  label: string;
  onClick: () => void;
}) {
  const isImg = looksLikeImage(url);

  return (
    <div style={styles.thumbWrap}>
      {isImg ? (
        <img src={url} alt={label} style={styles.thumb} onClick={onClick} />
      ) : (
        <div style={styles.pdfThumb} onClick={onClick}>
          <div style={styles.pdfBadge}>PDF</div>
        </div>
      )}
      <span style={{ fontSize: 12 }}>{label}</span>
    </div>
  );
}

/* ---------------------------------
   Screen
---------------------------------- */

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [autoApprove, setAutoApprove] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState<DocViewerItem | null>(null);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(firestore, 'drivers'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Driver[] = snapshot.docs.map((docSnap) => {
          const raw: any = docSnap.data() || {};
          const safeStatus = (raw.status as Driver['status']) ?? ('inactive' as Driver['status']);
          return { id: docSnap.id, ...raw, status: safeStatus } as Driver;
        });

        setDrivers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching drivers:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const sendPushNotification = async (token: string, title: string, body: string) => {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: token, title, body }),
      });
    } catch (error) {
      console.error('Push notification error:', error);
    }
  };

  const fetchDriverTrips = async (driverPhone: string) => {
    try {
      setLoadingTrips(true);
      const tripsQuery = query(collection(firestore, 'trip_history_driver'), where('driverPhone', '==', driverPhone));
      const tripsSnap = await getDocs(tripsQuery);
      const trips: Trip[] = tripsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      })) as Trip[];
      setTripHistory(trips);
    } catch (err) {
      console.error('Error fetching driver trips:', err);
      setTripHistory([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  const setStatus = async (id: string, to: 'active' | 'inactive') => {
    if (!window.confirm(`Set driver status to ${to.toUpperCase()}?`)) return;
    try {
      const driverRef = doc(firestore, 'drivers', id);
      await updateDoc(driverRef, { status: to });
      alert(`Driver status changed to ${to}.`);
    } catch (error) {
      console.error('Error updating driver status:', error);
      alert('Error updating driver status.');
    }
  };

  const setRecovery = async (id: string, to: boolean) => {
    if (!window.confirm(`${to ? 'Enable' : 'Disable'} recovery jobs for this driver?`)) return;
    try {
      const driverRef = doc(firestore, 'drivers', id);
      await updateDoc(driverRef, { recovery: to });
      alert('Driver recovery availability updated.');
    } catch (error) {
      console.error('Error toggling recovery:', error);
      alert('Error updating recovery status.');
    }
  };

  const openProfile = (driver: Driver) => {
    try {
      setSelectedDriver(driver);
      fetchDriverTrips(driver.phone);
    } catch (e) {
      console.error('Open profile error:', e);
      setSelectedDriver(null);
    }
  };

  const closeProfile = () => {
    setSelectedDriver(null);
    setTripHistory([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'licenseUrl' | 'emiratesIdUrl') => {
    if (!selectedDriver) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `drivers/${selectedDriver.id}/${field}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(firestore, 'drivers', selectedDriver.id), { [field]: downloadURL });

      alert(`${field === 'licenseUrl' ? 'License' : 'Emirates ID'} uploaded successfully!`);
      setSelectedDriver((prev) => (prev ? { ...prev, [field]: downloadURL } : prev));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const name = (driver.name || '').toLowerCase();
    const phone = (driver.phone || '').toLowerCase();
    const searchTerm = search.toLowerCase();
    const matchesSearch = name.includes(searchTerm) || phone.includes(searchTerm);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && driver.status === 'active') ||
      (filterStatus === 'inactive' && driver.status === 'inactive');

    return matchesSearch && matchesStatus;
  });

  const pendingDrivers = drivers.filter((driver) => driver.status === 'pending_approval');

  const handleApproveAll = async () => {
    if (!window.confirm(`Approve ALL ${pendingDrivers.length} pending drivers?`)) return;
    try {
      for (const driver of pendingDrivers) {
        const driverRef = doc(firestore, 'drivers', driver.id);
        await updateDoc(driverRef, {
          status: 'active',
          verified: true,
          recovery: true,
          adminNote: '',
        });

        if (driver.expoPushToken) {
          await sendPushNotification(
            driver.expoPushToken,
            '✅ HILBU Approval',
            'Your driver profile has been approved. You can now accept recovery jobs.'
          );
        }
      }
      alert(`${pendingDrivers.length} drivers approved successfully!`);
    } catch (error) {
      console.error('Error approving all drivers:', error);
      alert('Error approving drivers.');
    }
  };

  const handleApprove = async (driverId: string) => {
    try {
      const driverRef = doc(firestore, 'drivers', driverId);
      await updateDoc(driverRef, {
        status: 'active',
        verified: true,
        recovery: true,
        adminNote: '',
      });

      const driver = drivers.find((d) => d.id === driverId);
      if (driver?.expoPushToken) {
        await sendPushNotification(
          driver.expoPushToken,
          '✅ HILBU Approval',
          'Your driver profile has been approved. You can now accept recovery jobs.'
        );
      }
      alert('Driver approved successfully!');
    } catch (error) {
      console.error('Error approving driver:', error);
      alert('Error approving driver.');
    }
  };

  const handleReject = async (driverId: string) => {
    const reason = prompt('Enter rejection reason (shown to driver):');
    if (!reason) return;

    try {
      const driverRef = doc(firestore, 'drivers', driverId);
      await updateDoc(driverRef, {
        status: 'rejected',
        verified: false,
        recovery: false,
        adminNote: reason,
      });

      const driver = drivers.find((d) => d.id === driverId);
      if (driver?.expoPushToken) {
        await sendPushNotification(driver.expoPushToken, '❌ HILBU Rejected', reason);
      }
      alert('Driver rejected successfully!');
    } catch (error) {
      console.error('Error rejecting driver:', error);
      alert('Error rejecting driver.');
    }
  };

  const openDoc = (url: string, label?: string) => {
    if (!url) return;
    setSelectedDoc({ url, label, filename: looksLikePdf(url) ? 'document.pdf' : 'image.jpg' });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>Loading drivers...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚚 Manage Drivers</h1>

      {selectedDoc && <DocViewerModal item={selectedDoc} onClose={() => setSelectedDoc(null)} />}

      {pendingDrivers.length > 0 && (
        <div style={styles.pendingSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={styles.pendingTitle}>📝 Pending Driver Approvals ({pendingDrivers.length})</h2>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={autoApprove} onChange={() => setAutoApprove(!autoApprove)} />
              Auto-Approve Mode
              {autoApprove && (
                <button onClick={handleApproveAll} style={styles.approveAllBtn}>
                  Approve All
                </button>
              )}
            </label>
          </div>

          <div style={styles.pendingList}>
            {pendingDrivers.map((driver) => (
              <div key={driver.id} style={styles.pendingCard}>
                <p>
                  <strong>Name:</strong> {driver.name}
                </p>
                <p>
                  <strong>Phone:</strong> {driver.phone}
                </p>
                {driver.vehicle && (
                  <p>
                    <strong>Vehicle:</strong> {driver.vehicle}
                  </p>
                )}
                {driver.plateNumber && (
                  <p>
                    <strong>Plate:</strong> {driver.plateNumber}
                  </p>
                )}

                {driver.licenseDocs && (
                  <div>
                    <p>
                      <strong>📄 License Docs:</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {driver.licenseDocs.front && (
                        <DocThumb
                          url={driver.licenseDocs.front}
                          label="Front"
                          onClick={() => openDoc(driver.licenseDocs!.front!, 'License - Front')}
                        />
                      )}
                      {driver.licenseDocs.back && (
                        <DocThumb
                          url={driver.licenseDocs.back}
                          label="Back"
                          onClick={() => openDoc(driver.licenseDocs!.back!, 'License - Back')}
                        />
                      )}
                    </div>
                  </div>
                )}

                {driver.idCardDocs && (
                  <div style={{ marginTop: 10 }}>
                    <p>
                      <strong>🆔 Emirates ID:</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {driver.idCardDocs.front && (
                        <DocThumb
                          url={driver.idCardDocs.front}
                          label="Front"
                          onClick={() => openDoc(driver.idCardDocs!.front!, 'Emirates ID - Front')}
                        />
                      )}
                      {driver.idCardDocs.back && (
                        <DocThumb
                          url={driver.idCardDocs.back}
                          label="Back"
                          onClick={() => openDoc(driver.idCardDocs!.back!, 'Emirates ID - Back')}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div style={styles.pendingButtons}>
                  <button style={styles.approveButton} onClick={() => handleApprove(driver.id)}>
                    ✅ Approve
                  </button>
                  <button style={styles.rejectButton} onClick={() => handleReject(driver.id)}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          style={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filteredDrivers.length === 0 ? (
        <p style={styles.noData}>No drivers found.</p>
      ) : (
        <div style={styles.list}>
          {filteredDrivers.map((driver) => {
            const isActive = driver.status === 'active';
            const hasRecovery = driver.recovery !== false;
            const statusBtnLabel = isActive ? 'Set Inactive' : 'Set Active';
            const recoveryBtnLabel = hasRecovery ? 'Disable Recovery Jobs' : 'Enable Recovery Jobs';

            return (
              <div key={driver.id} style={styles.card}>
                <p style={styles.label}>
                  👤 Name: <span style={styles.value}>{driver.name || 'N/A'}</span>
                </p>
                <p style={styles.label}>
                  📱 Phone: <span style={styles.value}>{driver.phone || 'N/A'}</span>
                </p>
                <p style={styles.label}>
                  ⚙️ Status: <span style={styles.value}>{driver.status || 'inactive'}</span>
                </p>
                <p style={styles.label}>
                  🛠 Recovery Jobs: <span style={styles.value}>{hasRecovery ? 'Enabled' : 'Disabled'}</span>
                </p>

                {typeof driver.averageRating === 'number' && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                    <span style={{ ...styles.label, marginRight: 8 }}>⭐ Rating:</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#000',
                          color: '#FFDC00',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontWeight: 'bold',
                          marginRight: 8,
                        }}
                      >
                        {Number(driver.averageRating).toFixed(1)}
                      </span>
                      <span style={{ fontSize: 14 }}>
                        ({driver.ratingCount || 0} {driver.ratingCount === 1 ? 'rating' : 'ratings'})
                      </span>
                    </div>
                  </div>
                )}

                {driver.adminNote && driver.status === 'rejected' && (
                  <p
                    style={{
                      backgroundColor: '#ffecec',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      margin: '8px 0',
                    }}
                  >
                    <strong>Admin Note:</strong> {driver.adminNote}
                  </p>
                )}

                <div style={styles.buttons}>
                  <button style={styles.button} onClick={() => setStatus(driver.id, isActive ? 'inactive' : 'active')}>
                    {statusBtnLabel}
                  </button>
                  <button style={styles.button} onClick={() => setRecovery(driver.id, !hasRecovery)}>
                    {recoveryBtnLabel}
                  </button>
                  <button style={styles.viewButton} onClick={() => openProfile(driver)}>
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDriver && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} role="dialog" aria-modal="true">
            <h2>{selectedDriver.name || 'Driver'}'s Profile</h2>

            <p>
              <strong>📧 Email:</strong> {selectedDriver.email || 'N/A'}
            </p>
            <p>
              <strong>📱 Phone:</strong> {selectedDriver.phone}
            </p>
            <p>
              <strong>🚚 Vehicle:</strong> {selectedDriver.vehicle || 'N/A'}
            </p>
            <p>
              <strong>🔢 Plate Number:</strong> {selectedDriver.plateNumber || 'N/A'}
            </p>

            <div style={{ marginTop: 12 }}>
              <p>
                <strong>📄 License (URL):</strong>{' '}
                {selectedDriver.licenseUrl ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <a href={selectedDriver.licenseUrl} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                    <button style={styles.smallBtn} onClick={() => openDoc(selectedDriver.licenseUrl!, 'License (URL)')}>
                      Preview
                    </button>
                  </span>
                ) : (
                  'Not uploaded'
                )}
              </p>
              <input type="file" onChange={(e) => handleFileUpload(e, 'licenseUrl')} disabled={uploading} />
            </div>

            <div style={{ marginTop: 12 }}>
              <p>
                <strong>🆔 Emirates ID (URL):</strong>{' '}
                {selectedDriver.emiratesIdUrl ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <a href={selectedDriver.emiratesIdUrl} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                    <button
                      style={styles.smallBtn}
                      onClick={() => openDoc(selectedDriver.emiratesIdUrl!, 'Emirates ID (URL)')}
                    >
                      Preview
                    </button>
                  </span>
                ) : (
                  'Not uploaded'
                )}
              </p>
              <input type="file" onChange={(e) => handleFileUpload(e, 'emiratesIdUrl')} disabled={uploading} />
            </div>

            {(selectedDriver.licenseDocs || selectedDriver.idCardDocs) && (
              <div style={{ marginTop: 20 }}>
                <h3>Uploaded Documents</h3>

                {selectedDriver.licenseDocs && (
                  <div style={{ marginTop: 10 }}>
                    <p>
                      <strong>📄 License Docs:</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {selectedDriver.licenseDocs.front && (
                        <DocThumb
                          url={selectedDriver.licenseDocs.front}
                          label="Front"
                          onClick={() => openDoc(selectedDriver.licenseDocs!.front!, 'License - Front')}
                        />
                      )}
                      {selectedDriver.licenseDocs.back && (
                        <DocThumb
                          url={selectedDriver.licenseDocs.back}
                          label="Back"
                          onClick={() => openDoc(selectedDriver.licenseDocs!.back!, 'License - Back')}
                        />
                      )}
                    </div>
                  </div>
                )}

                {selectedDriver.idCardDocs && (
                  <div style={{ marginTop: 10 }}>
                    <p>
                      <strong>🆔 Emirates ID:</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {selectedDriver.idCardDocs.front && (
                        <DocThumb
                          url={selectedDriver.idCardDocs.front}
                          label="Front"
                          onClick={() => openDoc(selectedDriver.idCardDocs!.front!, 'Emirates ID - Front')}
                        />
                      )}
                      {selectedDriver.idCardDocs.back && (
                        <DocThumb
                          url={selectedDriver.idCardDocs.back}
                          label="Back"
                          onClick={() => openDoc(selectedDriver.idCardDocs!.back!, 'Emirates ID - Back')}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <h3 style={{ marginTop: 20 }}>Recent Trips:</h3>
            {loadingTrips ? (
              <p>Loading trips...</p>
            ) : tripHistory.length === 0 ? (
              <p>No trips found.</p>
            ) : (
              <ul>
                {tripHistory.map((trip) => (
                  <li key={trip.id}>
                    {describePlace(trip.pickup)} → {describePlace(trip.dropoff)}{' '}
                    {typeof trip.amount === 'number' ? `(AED ${trip.amount})` : ''}
                  </li>
                ))}
              </ul>
            )}

            <button style={styles.closeButton} onClick={closeProfile}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------
   Styles
---------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },

  pendingSection: { backgroundColor: '#fff', padding: 20, marginBottom: 30, borderRadius: 12, border: '1px solid #eee' },
  pendingTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  pendingList: { display: 'flex', flexDirection: 'column', gap: 16 },
  pendingCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 10, border: '1px solid #ccc' },
  pendingButtons: { display: 'flex', gap: 10, marginTop: 10 },

  approveButton: { backgroundColor: '#28a745', color: '#fff', padding: '8px 14px', borderRadius: 6, fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  rejectButton: { backgroundColor: '#dc3545', color: '#fff', padding: '8px 14px', borderRadius: 6, fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  approveAllBtn: { marginLeft: 10, padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' },

  searchContainer: { display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center' },
  searchInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', width: 220 },
  filterSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' },
  noData: { textAlign: 'center', color: '#555', fontSize: 16 },

  list: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFDC00', padding: 20, borderRadius: 16, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  value: { fontWeight: 'normal' },

  buttons: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 },
  button: { backgroundColor: '#000', color: '#FFDC00', padding: '10px 14px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', border: 'none' },
  viewButton: { backgroundColor: '#007BFF', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', border: 'none' },

  smallBtn: { backgroundColor: '#000', color: '#FFDC00', padding: '6px 10px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: 12 },

  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff' },
  loadingText: { fontSize: 20, color: '#000' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: 480, maxHeight: '80vh', overflowY: 'auto' },
  closeButton: { marginTop: 20, backgroundColor: '#d9534f', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 'bold', border: 'none', cursor: 'pointer' },

  thumbWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  thumb: { width: 80, height: 50, borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', objectFit: 'cover' },

  pdfThumb: { width: 80, height: 50, borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pdfBadge: { backgroundColor: '#FFDC00', color: '#000', borderRadius: 8, padding: '4px 8px', fontWeight: 900, fontSize: 12 },

  viewerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 16 },
  viewerBox: { width: 'min(980px, 95vw)', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' },
  viewerHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #eee' },
  viewerCloseBtn: { border: 'none', background: '#000', color: '#FFDC00', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontWeight: 900 },
  viewerContent: { padding: 12, overflow: 'auto', backgroundColor: '#fafafa', flex: 1 },
  pdfFrame: { width: '100%', height: '72vh', border: '0', borderRadius: 10, backgroundColor: '#fff' },
  viewerImage: { width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 10, backgroundColor: '#fff', display: 'block', margin: '0 auto' },
  unknownDocBox: { width: '100%', height: '200px', borderRadius: 10, border: '1px dashed #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#fff' },

  viewerActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 12, borderTop: '1px solid #eee', backgroundColor: '#fff' },
  viewerActionBtn: {
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '10px 14px',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
};
