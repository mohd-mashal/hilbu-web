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

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
  border: '1px solid #ccc',
};

const defaultCenter = { lat: 25.2048, lng: 55.2708 };

export default function MapComponent({
  location,
  destination,
  towTruck,
  showDrivers = true,
}: MapComponentProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [driverLocations, setDriverLocations] = useState<Coordinates[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const userCarIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    return {
      url: '/MapCar.png',
      scaledSize: new window.google.maps.Size(30, 35),
    };
  }, [isLoaded]);

  const towTruckIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    return {
      url: '/tow-truck.png',
      scaledSize: new window.google.maps.Size(30, 35),
    };
  }, [isLoaded]);

  const center = useMemo(() => {
    if (location) return { lat: location.latitude, lng: location.longitude };
    if (towTruck) return { lat: towTruck.latitude, lng: towTruck.longitude };
    return defaultCenter;
  }, [location, towTruck]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const bounds = new window.google.maps.LatLngBounds();
    if (location) bounds.extend({ lat: location.latitude, lng: location.longitude });
    if (destination) bounds.extend({ lat: destination.latitude, lng: destination.longitude });
    if (towTruck) bounds.extend({ lat: towTruck.latitude, lng: towTruck.longitude });
    driverLocations.forEach((d) => bounds.extend({ lat: d.latitude, lng: d.longitude }));
    if (!bounds.isEmpty()) map.fitBounds(bounds);
  }, [location, destination, towTruck, driverLocations]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (!showDrivers) return;
    const driverQuery = query(collection(firestore, 'drivers'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(driverQuery, (snapshot) => {
      const drivers: Coordinates[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
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

  useEffect(() => {
    if (location && destination && isLoaded) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: location.latitude, lng: location.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.error('Directions request failed due to ', status);
          }
        }
      );
    }
  }, [location, destination, isLoaded]);

  if (!isLoaded) {
    return <div style={{ textAlign: 'center', padding: 20 }}>Loading map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
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
