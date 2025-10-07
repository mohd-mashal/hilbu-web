// FILE: src/components/MapComponent.web.tsx
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

interface Coordinates {
  latitude: number;
  longitude: number;
}
interface MapComponentProps {
  location?: Coordinates;
  destination?: Coordinates;
  towTruck?: Coordinates;
  showDrivers?: boolean;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
  border: '1px solid #FFDC00', // HILBU theme
  overflow: 'hidden',
};

const defaultCenter = { lat: 25.2048, lng: 55.2708 };

// Read the browser (web) key from env (Vite / Next / Vercel)
function readGoogleKey(): string {
  const vite =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const node =
    (typeof process !== 'undefined' && (process as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
    (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  return vite || node || '';
}

// Load a PNG at its natural pixel size (prevents stretching)
function buildIcon(url: string): Promise<google.maps.Icon> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 30;
      const h = img.naturalHeight || 30;
      resolve({
        url,
        scaledSize: new window.google.maps.Size(w, h),
        anchor: new window.google.maps.Point(w / 2, h),
      } as google.maps.Icon);
    };
    img.onerror = () => {
      resolve({
        url,
        scaledSize: new window.google.maps.Size(30, 35),
      } as google.maps.Icon);
    };
    img.src = url;
  });
}

// IMPORTANT: keep only libraries your package version supports.
// This avoids the “Type … not assignable to type 'Library'” error.
const LIBRARIES: ('places')[] = ['places'];

export default function MapComponent({
  location,
  destination,
  towTruck,
  showDrivers = true,
}: MapComponentProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [driverLocations, setDriverLocations] = useState<Coordinates[]>([]);
  const [userCarIcon, setUserCarIcon] = useState<google.maps.Icon | undefined>(undefined);
  const [towTruckIcon, setTowTruckIcon] = useState<google.maps.Icon | undefined>(undefined);

  const apiKey = readGoogleKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'hilbu-admin-map',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  // DEBUG: show which key & host your live build is using (safe tail only)
  useEffect(() => {
    if (apiKey) console.log('Maps key (tail): …' + apiKey.slice(-8));
    console.log('Host:', window.location.origin);
  }, [apiKey]);

  // Prepare marker icons (from /public)
  useEffect(() => {
    if (!isLoaded || !window.google) return;
    let mounted = true;
    (async () => {
      const userIcon = await buildIcon('/MapCar.png');
      const truckIcon = await buildIcon('/tow-truck.png');
      if (mounted) {
        setUserCarIcon(userIcon);
        setTowTruckIcon(truckIcon);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isLoaded]);

  const center = useMemo(() => {
    if (location) return { lat: location.latitude, lng: location.longitude };
    if (towTruck) return { lat: towTruck.latitude, lng: towTruck.longitude };
    return defaultCenter;
  }, [location, towTruck]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Live drivers (optional)
  useEffect(() => {
    if (!showDrivers) return;
    const driverQuery = query(collection(firestore, 'drivers'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(driverQuery, (snapshot) => {
      const drivers: Coordinates[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data.location?.latitude && data.location?.longitude) {
          drivers.push({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          });
        }
      });
      setDriverLocations(drivers);
    });
    return () => unsubscribe();
  }, [showDrivers]);

  // Compute route on client (Maps JS)
  useEffect(() => {
    if (!location || !destination || !isLoaded) return;
    const svc = new google.maps.DirectionsService();
    svc.route(
      {
        origin: { lat: location.latitude, lng: location.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [location, destination, isLoaded]);

  // Auto-fit whenever markers/routes change
  useEffect(() => {
    if (!mapRef.current || !window.google || !isLoaded) return;
    const bounds = new window.google.maps.LatLngBounds();
    if (location) bounds.extend({ lat: location.latitude, lng: location.longitude });
    if (destination) bounds.extend({ lat: destination.latitude, lng: destination.longitude });
    if (towTruck) bounds.extend({ lat: towTruck.latitude, lng: towTruck.longitude });
    driverLocations.forEach((d) => bounds.extend({ lat: d.latitude, lng: d.longitude }));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 60);
    } else {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(12);
    }
  }, [isLoaded, location, destination, towTruck, driverLocations]);

  // ——— Error & loading states ———
  if (!apiKey) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#000' }}>Missing Google Maps key.</div>
          <div style={{ color: '#000' }}>Set <code>VITE_GOOGLE_MAPS_API_KEY</code> on your host and redeploy.</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ ...containerStyle, display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
        <div>
          <div style={{ fontWeight: 700, color:'#000' }}>Google Maps failed to load.</div>
          <div style={{ color:'#000' }}>Check Web key referrers and API restrictions.</div>
          <div style={{ color:'#000', marginTop: 8, fontSize: 12 }}>
            Error: {(loadError as any)?.message || String(loadError)}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div style={{ textAlign: 'center', padding: 20 }}>Loading map…</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        gestureHandling: 'greedy',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      }}
    >
      {location && (
        <Marker position={{ lat: location.latitude, lng: location.longitude }} icon={userCarIcon} />
      )}
      {destination && (
        <Marker position={{ lat: destination.latitude, lng: destination.longitude }} label="Drop-off" />
      )}
      {towTruck && (
        <Marker position={{ lat: towTruck.latitude, lng: towTruck.longitude }} icon={towTruckIcon} />
      )}
      {showDrivers &&
        driverLocations.map((driver, index) => (
          <Marker
            key={`driver-${index}`}
            position={{ lat: driver.latitude, lng: driver.longitude }}
            icon={towTruckIcon}
          />
        ))}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
}
