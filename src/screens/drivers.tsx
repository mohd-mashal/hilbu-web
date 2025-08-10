import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../firebaseConfig';

const storage = getStorage();

interface DocumentSet {
  front: string | null;
  back: string | null;
}

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
  userPhone: string;
  pickup: string;
  dropoff: string;
  amount: number;
  timestamp: string;
}

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        maxWidth: '90%',
        maxHeight: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <img 
          src={imageUrl} 
          alt="Enlarged document" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '80vh',
            objectFit: 'contain'
          }}
        />
        <a 
          href={imageUrl} 
          download 
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#FFDC00',
            color: '#000',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Download Image
        </a>
      </div>
    </div>
  );
};

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [autoApprove, setAutoApprove] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(firestore, 'drivers'),
      where('status', 'in', ['pending_approval', 'approved', 'rejected', 'active', 'inactive'])
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data: Driver[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Driver[];
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
        body: JSON.stringify({
          to: token,
          title,
          body,
        }),
      });
    } catch (error) {
      console.error('Push notification error:', error);
    }
  };

  const fetchDriverTrips = async (driverPhone: string) => {
    try {
      setLoadingTrips(true);
      const tripsQuery = query(
        collection(firestore, 'trip_history_driver'),
        where('driverPhone', '==', driverPhone)
      );
      const tripsSnap = await getDocs(tripsQuery);

      const trips: Trip[] = tripsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Trip[];

      setTripHistory(trips);
    } catch (err) {
      console.error('Error fetching driver trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const toggleStatus = async (id: string) => {
    if (!window.confirm('Are you sure you want to toggle this driver status?')) return;

    try {
      const driverRef = doc(firestore, 'drivers', id);
      const currentDriver = drivers.find((d) => d.id === id);
      if (!currentDriver) return;

      const newStatus = currentDriver.status === 'active' ? 'inactive' : 'active';
      await updateDoc(driverRef, { status: newStatus });
      alert(`Driver status changed to ${newStatus}.`);
    } catch (error) {
      console.error('Error toggling driver status:', error);
      alert('Error updating driver status.');
    }
  };

  const toggleRecovery = async (id: string) => {
    if (!window.confirm('Are you sure you want to toggle recovery availability for this driver?')) return;

    try {
      const driverRef = doc(firestore, 'drivers', id);
      const currentDriver = drivers.find((d) => d.id === id);
      if (!currentDriver) return;

      await updateDoc(driverRef, { recovery: !currentDriver.recovery });
      alert('Driver recovery availability updated.');
    } catch (error) {
      console.error('Error toggling recovery:', error);
      alert('Error updating recovery status.');
    }
  };

  const openProfile = (driver: Driver) => {
    setSelectedDriver(driver);
    fetchDriverTrips(driver.phone);
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

      await updateDoc(doc(firestore, 'drivers', selectedDriver.id), {
        [field]: downloadURL,
      });

      alert(`${field === 'licenseUrl' ? 'License' : 'Emirates ID'} uploaded successfully!`);
      setSelectedDriver((prev) => prev ? { ...prev, [field]: downloadURL } : prev);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const name = (driver.name || '').toLowerCase();
    const phone = (driver.phone || '').toLowerCase();
    const searchTerm = search.toLowerCase();
    const matchesSearch = name.includes(searchTerm) || phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && driver.status === 'active') || 
                         (filterStatus === 'inactive' && driver.status === 'inactive');
    return matchesSearch && matchesStatus;
  });

  const pendingDrivers = drivers.filter(driver => driver.status === 'pending_approval');

  const handleApproveAll = async () => {
    if (!window.confirm(`Are you sure you want to approve ALL ${pendingDrivers.length} pending drivers?`)) return;

    try {
      for (const driver of pendingDrivers) {
        const driverRef = doc(firestore, 'drivers', driver.id);
        await updateDoc(driverRef, { 
          status: 'approved',
          verified: true 
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
        status: 'approved',
        verified: true 
      });

      const driver = drivers.find(d => d.id === driverId);
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
        adminNote: reason 
      });

      const driver = drivers.find(d => d.id === driverId);
      if (driver?.expoPushToken) {
        await sendPushNotification(
          driver.expoPushToken,
          '❌ HILBU Rejected',
          reason
        );
      }
      alert('Driver rejected successfully!');
    } catch (error) {
      console.error('Error rejecting driver:', error);
      alert('Error rejecting driver.');
    }
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

      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {pendingDrivers.length > 0 && (
        <div style={styles.pendingSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={styles.pendingTitle}>📝 Pending Driver Approvals ({pendingDrivers.length})</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                checked={autoApprove}
                onChange={() => setAutoApprove(!autoApprove)}
              />
              Auto-Approve Mode
              {autoApprove && (
                <button 
                  onClick={handleApproveAll}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Approve All
                </button>
              )}
            </label>
          </div>
          <div style={styles.pendingList}>
            {pendingDrivers.map(driver => (
              <div key={driver.id} style={styles.pendingCard}>
                <p><strong>Name:</strong> {driver.name}</p>
                <p><strong>Phone:</strong> {driver.phone}</p>
                {driver.vehicle && <p><strong>Vehicle:</strong> {driver.vehicle}</p>}
                {driver.plateNumber && <p><strong>Plate:</strong> {driver.plateNumber}</p>}
                
                {driver.licenseDocs && (
                  <div>
                    <p><strong>📄 License Docs:</strong></p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {driver.licenseDocs.front && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={driver.licenseDocs.front}
                            alt="License Front"
                            style={{ 
                              width: 80, 
                              height: 50, 
                              borderRadius: 6, 
                              border: '1px solid #ccc',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedImage(driver.licenseDocs?.front || null)}
                          />
                          <span style={{ fontSize: 12 }}>Front</span>
                        </div>
                      )}
                      {driver.licenseDocs.back && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={driver.licenseDocs.back}
                            alt="License Back"
                            style={{ 
                              width: 80, 
                              height: 50, 
                              borderRadius: 6, 
                              border: '1px solid #ccc',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedImage(driver.licenseDocs?.back || null)}
                          />
                          <span style={{ fontSize: 12 }}>Back</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {driver.idCardDocs && (
                  <div style={{ marginTop: 10 }}>
                    <p><strong>🆔 Emirates ID:</strong></p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {driver.idCardDocs.front && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={driver.idCardDocs.front}
                            alt="ID Front"
                            style={{ 
                              width: 80, 
                              height: 50, 
                              borderRadius: 6, 
                              border: '1px solid #ccc',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedImage(driver.idCardDocs?.front || null)}
                          />
                          <span style={{ fontSize: 12 }}>Front</span>
                        </div>
                      )}
                      {driver.idCardDocs.back && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={driver.idCardDocs.back}
                            alt="ID Back"
                            style={{ 
                              width: 80, 
                              height: 50, 
                              borderRadius: 6, 
                              border: '1px solid #ccc',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedImage(driver.idCardDocs?.back || null)}
                          />
                          <span style={{ fontSize: 12 }}>Back</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={styles.pendingButtons}>
                  <button
                    style={styles.approveButton}
                    onClick={() => handleApprove(driver.id)}
                  >
                    ✅ Approve
                  </button>
                  <button
                    style={styles.rejectButton}
                    onClick={() => handleReject(driver.id)}
                  >
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
          {filteredDrivers.map((driver) => (
            <div key={driver.id} style={styles.card}>
              <p style={styles.label}>👤 Name: <span style={styles.value}>{driver.name || 'N/A'}</span></p>
              <p style={styles.label}>📱 Phone: <span style={styles.value}>{driver.phone || 'N/A'}</span></p>
              <p style={styles.label}>⚙️ Status: <span style={styles.value}>{driver.status || 'inactive'}</span></p>

              {driver.averageRating !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                  <span style={{ ...styles.label, marginRight: 8 }}>⭐ Rating:</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      backgroundColor: '#000', 
                      color: '#FFDC00', 
                      padding: '4px 8px', 
                      borderRadius: 12,
                      fontWeight: 'bold',
                      marginRight: 8
                    }}>
                      {driver.averageRating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 14 }}>
                      ({driver.ratingCount || 0} {driver.ratingCount === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                </div>
              )}

              {driver.adminNote && driver.status === 'rejected' && (
                <p style={{ 
                  backgroundColor: '#ffecec', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  margin: '8px 0'
                }}>
                  <strong>Admin Note:</strong> {driver.adminNote}
                </p>
              )}

              <div style={styles.buttons}>
                <button style={styles.button} onClick={() => toggleStatus(driver.id)}>Toggle Status</button>
                <button style={styles.button} onClick={() => toggleRecovery(driver.id)}>Toggle Recovery</button>
                <button style={styles.viewButton} onClick={() => openProfile(driver)}>View Profile</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDriver && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>{selectedDriver.name}'s Profile</h2>
            <p><strong>📧 Email:</strong> {selectedDriver.email || 'N/A'}</p>
            <p><strong>📱 Phone:</strong> {selectedDriver.phone}</p>
            <p><strong>🚚 Vehicle:</strong> {selectedDriver.vehicle || 'N/A'}</p>
            <p><strong>🔢 Plate Number:</strong> {selectedDriver.plateNumber || 'N/A'}</p>

            {selectedDriver.averageRating !== undefined && (
              <p>
                <strong>⭐ Average Rating:</strong> {selectedDriver.averageRating.toFixed(1)} 
                <span style={{ color: '#666', marginLeft: 8 }}>
                  ({selectedDriver.ratingCount || 0} {selectedDriver.ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              </p>
            )}

            <div>
              <p><strong>📄 License:</strong> {selectedDriver.licenseUrl ? <a href={selectedDriver.licenseUrl} target="_blank" rel="noopener noreferrer">View</a> : 'Not uploaded'}</p>
              <input type="file" onChange={(e) => handleFileUpload(e, 'licenseUrl')} disabled={uploading} />
            </div>

            <div>
              <p><strong>🆔 Emirates ID:</strong> {selectedDriver.emiratesIdUrl ? <a href={selectedDriver.emiratesIdUrl} target="_blank" rel="noopener noreferrer">View</a> : 'Not uploaded'}</p>
              <input type="file" onChange={(e) => handleFileUpload(e, 'emiratesIdUrl')} disabled={uploading} />
            </div>

            <h3>Recent Trips:</h3>
            {loadingTrips ? <p>Loading trips...</p> : tripHistory.length === 0 ? <p>No trips found.</p> : (
              <ul>{tripHistory.map((trip) => <li key={trip.id}>{trip.pickup} → {trip.dropoff} (AED {trip.amount})</li>)}</ul>
            )}

            <button style={styles.closeButton} onClick={closeProfile}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pendingSection: { backgroundColor: '#fff', padding: 20, marginBottom: 30, borderRadius: 12 },
  pendingTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  pendingList: { display: 'flex', flexDirection: 'column', gap: 16 },
  pendingCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 10, border: '1px solid #ccc' },
  pendingButtons: { display: 'flex', gap: 10, marginTop: 10 },
  approveButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 6,
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 6,
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
  },
  container: { padding: 24, backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },
  searchContainer: { display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center' },
  searchInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', width: 200 },
  filterSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' },
  list: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFDC00', padding: 20, borderRadius: 16, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  value: { fontWeight: 'normal' },
  buttons: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 },
  button: { backgroundColor: '#000', color: '#FFDC00', padding: '10px 14px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', border: 'none' },
  viewButton: { backgroundColor: '#007BFF', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', border: 'none' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff' },
  loadingText: { fontSize: 20, color: '#000' },
  noData: { textAlign: 'center', color: '#555', fontSize: 16 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: 450, maxHeight: '80vh', overflowY: 'auto' },
  closeButton: { marginTop: 20, backgroundColor: '#d9534f', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 'bold', border: 'none', cursor: 'pointer' },
};