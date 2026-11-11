// FILE: src/components/MapComponent.web.tsx
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  DirectionsRenderer,
} from '@react-google-maps/api';

import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

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
  border: '1px solid #FFDC00',
  overflow: 'hidden',
  position: 'relative',
};

const defaultCenter = {
  lat: 25.2048,
  lng: 55.2708,
};

// Read Google Maps key from Vite
function readGoogleKey(): string {
  return (
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) ||
    ''
  );
}

// Keep map marker images at a sensible size
function buildIcon(
  url: string,
  maxWidth: number,
  maxHeight: number
): Promise<google.maps.Icon> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const naturalWidth =
        img.naturalWidth || maxWidth;

      const naturalHeight =
        img.naturalHeight || maxHeight;

      const scale = Math.min(
        maxWidth / naturalWidth,
        maxHeight / naturalHeight,
        1
      );

      const width = Math.max(
        1,
        Math.round(naturalWidth * scale)
      );

      const height = Math.max(
        1,
        Math.round(naturalHeight * scale)
      );

      resolve({
        url,
        scaledSize:
          new window.google.maps.Size(
            width,
            height
          ),
        anchor:
          new window.google.maps.Point(
            width / 2,
            height
          ),
      } as google.maps.Icon);
    };

    img.onerror = () => {
      resolve({
        url,
        scaledSize:
          new window.google.maps.Size(
            maxWidth,
            maxHeight
          ),
        anchor:
          new window.google.maps.Point(
            maxWidth / 2,
            maxHeight
          ),
      } as google.maps.Icon);
    };

    img.src = url;
  });
}

const LIBRARIES: ('places')[] = ['places'];

export default function MapComponent({
  location,
  destination,
  towTruck,
  showDrivers = true,
}: MapComponentProps) {
  const mapRef =
    useRef<google.maps.Map | null>(null);

  const [directions, setDirections] =
    useState<
      google.maps.DirectionsResult | null
    >(null);

  const [
    driverLocations,
    setDriverLocations,
  ] = useState<Coordinates[]>([]);

  const [
    userCarIcon,
    setUserCarIcon,
  ] = useState<
    google.maps.Icon | undefined
  >(undefined);

  const [
    towTruckIcon,
    setTowTruckIcon,
  ] = useState<
    google.maps.Icon | undefined
  >(undefined);

  const apiKey = readGoogleKey();

  const {
    isLoaded,
    loadError,
  } = useJsApiLoader({
    id: 'hilbu-admin-map',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (apiKey) {
      console.log(
        'Maps key (tail): …' +
          apiKey.slice(-8)
      );
    }

    console.log(
      'Host:',
      window.location.origin
    );
  }, [apiKey]);

  // Prepare properly sized icons
  useEffect(() => {
    if (
      !isLoaded ||
      !window.google
    ) {
      return;
    }

    let mounted = true;

    (async () => {
      const userIcon =
        await buildIcon(
          '/MapCar.png',
          42,
          42
        );

      const truckIcon =
        await buildIcon(
          '/tow-truck.png',
          48,
          42
        );

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
    if (location) {
      return {
        lat: location.latitude,
        lng: location.longitude,
      };
    }

    if (towTruck) {
      return {
        lat: towTruck.latitude,
        lng: towTruck.longitude,
      };
    }

    return defaultCenter;
  }, [location, towTruck]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
    },
    []
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Live online drivers
  useEffect(() => {
    if (!showDrivers) {
      setDriverLocations([]);
      return;
    }

    const driverQuery = query(
      collection(
        firestore,
        'drivers'
      ),
      where(
        'isOnline',
        '==',
        true
      )
    );

    const unsubscribe =
      onSnapshot(
        driverQuery,
        (snapshot) => {
          const drivers:
            Coordinates[] = [];

          snapshot.forEach(
            (docSnap) => {
              const data: any =
                docSnap.data();

              const latitude =
                Number(
                  data?.location
                    ?.latitude
                );

              const longitude =
                Number(
                  data?.location
                    ?.longitude
                );

              if (
                Number.isFinite(
                  latitude
                ) &&
                Number.isFinite(
                  longitude
                )
              ) {
                drivers.push({
                  latitude,
                  longitude,
                });
              }
            }
          );

          setDriverLocations(
            drivers
          );
        }
      );

    return () =>
      unsubscribe();
  }, [showDrivers]);

  // Route between pickup and destination
  useEffect(() => {
    if (
      !location ||
      !destination ||
      !isLoaded
    ) {
      setDirections(null);
      return;
    }

    const svc =
      new google.maps.DirectionsService();

    svc.route(
      {
        origin: {
          lat: location.latitude,
          lng: location.longitude,
        },

        destination: {
          lat: destination.latitude,
          lng: destination.longitude,
        },

        travelMode:
          google.maps.TravelMode
            .DRIVING,
      },

      (result, status) => {
        if (
          status ===
            google.maps
              .DirectionsStatus.OK &&
          result
        ) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [
    location,
    destination,
    isLoaded,
  ]);

  // Automatically fit map without zooming too close
  useEffect(() => {
    if (
      !mapRef.current ||
      !window.google ||
      !isLoaded
    ) {
      return;
    }

    const map = mapRef.current;

    const isDriverOverview =
      showDrivers &&
      !location &&
      !destination &&
      !towTruck;

    const bounds =
      new window.google.maps.LatLngBounds();

    if (location) {
      bounds.extend({
        lat: location.latitude,
        lng: location.longitude,
      });
    }

    if (destination) {
      bounds.extend({
        lat: destination.latitude,
        lng: destination.longitude,
      });
    }

    if (towTruck) {
      bounds.extend({
        lat: towTruck.latitude,
        lng: towTruck.longitude,
      });
    }

    driverLocations.forEach(
      (driver) => {
        bounds.extend({
          lat: driver.latitude,
          lng: driver.longitude,
        });
      }
    );

    if (!bounds.isEmpty()) {
      map.fitBounds(
        bounds,
        isDriverOverview
          ? 90
          : 60
      );

      if (isDriverOverview) {
        google.maps.event.addListenerOnce(
          map,
          'idle',
          () => {
            const currentZoom =
              map.getZoom();

            if (
              currentZoom !== undefined &&
              currentZoom !== null &&
              currentZoom > 12
            ) {
              map.setZoom(12);
            }
          }
        );
      }
    } else {
      map.setCenter(
        defaultCenter
      );

      map.setZoom(11);
    }
  }, [
    isLoaded,
    location,
    destination,
    towTruck,
    driverLocations,
    showDrivers,
  ]);

  // Missing API key
  if (!apiKey) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'center',
          padding: 16,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              color: '#000',
            }}
          >
            Missing Google Maps key.
          </div>

          <div
            style={{
              color: '#000',
            }}
          >
            Set{' '}
            <code>
              VITE_GOOGLE_MAPS_API_KEY
            </code>{' '}
            on your host and redeploy.
          </div>
        </div>
      </div>
    );
  }

  // Google Maps loading error
  if (loadError) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'center',
          padding: 16,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              color: '#000',
            }}
          >
            Google Maps failed to load.
          </div>

          <div
            style={{
              color: '#000',
            }}
          >
            Check Web key referrers and API
            restrictions.
          </div>

          <div
            style={{
              color: '#000',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Error:{' '}
            {(loadError as any)
              ?.message ||
              String(loadError)}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 20,
        }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '100%',
        }}
        center={center}
        zoom={11}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          gestureHandling:
            'greedy',

          mapTypeControl:
            false,

          streetViewControl:
            false,

          fullscreenControl:
            false,

          zoomControl: true,

          minZoom: 8,

          maxZoom: 18,
        }}
      >
        {location && (
          <Marker
            position={{
              lat: location.latitude,
              lng: location.longitude,
            }}
            icon={userCarIcon}
          />
        )}

        {destination && (
          <Marker
            position={{
              lat: destination.latitude,
              lng: destination.longitude,
            }}
            label="Drop-off"
          />
        )}

        {towTruck && (
          <Marker
            position={{
              lat: towTruck.latitude,
              lng: towTruck.longitude,
            }}
            icon={towTruckIcon}
          />
        )}

        {showDrivers &&
          driverLocations.map(
            (
              driver,
              index
            ) => (
              <Marker
                key={`driver-${index}`}
                position={{
                  lat: driver.latitude,
                  lng: driver.longitude,
                }}
                icon={
                  towTruckIcon
                }
              />
            )
          )}

        {directions && (
          <DirectionsRenderer
            directions={
              directions
            }
          />
        )}
      </GoogleMap>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          backgroundColor:
            'rgba(255,255,255,0.96)',
          borderRadius: 12,
          padding: '8px 12px',
          boxShadow:
            '0 2px 8px rgba(0,0,0,0.15)',
          border:
            '1px solid rgba(0,0,0,0.08)',
          fontSize: 12,
          color: '#000',
          display: 'flex',
          flexDirection:
            'column',
          gap: 4,
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 2,
          }}
        >
          Legend
        </div>

        <div>
          🚗 User / Pickup
        </div>

        <div>
          🚚 Online Drivers / Tow Trucks
        </div>

        <div>
          📍 Drop-off
        </div>
      </div>
    </div>
  );
}