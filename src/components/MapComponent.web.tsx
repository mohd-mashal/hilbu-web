import { useEffect, useState } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../firebaseConfig';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  location?: LatLng;
  userLocations?: LatLng[];
  driverLocations?: LatLng[];
}

export default function MapComponent({
  location,
  userLocations = [],
  driverLocations = [],
}: MapComponentProps) {
  const [mapUrl, setMapUrl] = useState('');

  const lat = location?.latitude ?? 25.2048;
  const lng = location?.longitude ?? 55.2708;

  const buildMapUrl = () => {
    const userMarkers = userLocations
      .map(
        (u) =>
          `&markers=icon:https://maps.google.com/mapfiles/ms/icons/blue-dot.png%7C${u.latitude},${u.longitude}`
      )
      .join('');

    const driverMarkers = driverLocations
      .map(
        (d) =>
          `&markers=icon:https://maps.google.com/mapfiles/kml/shapes/cabs.png%7C${d.latitude},${d.longitude}`
      )
      .join('');

    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=12&size=800x400&maptype=roadmap${userMarkers}${driverMarkers}&key=${GOOGLE_MAPS_API_KEY}&ts=${Date.now()}`;
  };

  useEffect(() => {
    setMapUrl(buildMapUrl());
    const interval = setInterval(() => setMapUrl(buildMapUrl()), 5000);
    return () => clearInterval(interval);
  }, [userLocations, driverLocations]);

  return (
    <div style={styles.container}>
      <img src={mapUrl} alt="Live Map" style={styles.map} loading="lazy" />
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '400px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #ccc',
  },
  map: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
};
