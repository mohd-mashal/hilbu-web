
interface MapComponentProps {
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function MapComponent({ location }: MapComponentProps) {
  const lat = location?.latitude ?? 25.2048;
  const lng = location?.longitude ?? 55.2708;

  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyDxx_m4xk5fov1UoK8MkOFN7BCjQRQOHE0&center=${lat},${lng}&zoom=14&maptype=roadmap`;

  return (
    <div style={styles.container}>
      <iframe
        title="Map"
        src={mapUrl}
        style={styles.map}
        allowFullScreen
        loading="lazy"
      />
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
    border: 0,
  },
};
