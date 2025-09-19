// ===== FILE: src/components/WorkerMap.jsx =====
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// helper component to recenter map
const RecenterMap = ({ workers, selectedWorkerId }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find(
        (w) => w.id === selectedWorkerId && w.latitude && w.longitude
      );
      if (worker) {
        map.setView([worker.latitude, worker.longitude], 15);
      }
    } else if (workers.length > 0) {
      const bounds = L.latLngBounds(
        workers
          .filter((w) => w.latitude && w.longitude)
          .map((w) => [w.latitude, w.longitude])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [workers, selectedWorkerId, map]);

  return null;
};

const WorkerMap = ({ workers, selectedWorkerId }) => {
  const [history, setHistory] = useState([]);
  const markerRefs = useRef({}); // برای نگه‌داشتن ref هر مارکر

  useEffect(() => {
    if (!selectedWorkerId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(
          `/api/workers/${selectedWorkerId}/history/?days=1`
        );
        const path = data.map((loc) => [loc.latitude, loc.longitude]);
        setHistory(path);
      } catch (error) {
        console.error('Failed to fetch worker history', error);
        setHistory([]);
      }
    };

    fetchHistory();
  }, [selectedWorkerId]);

  // وقتی worker انتخاب شد، popup مارکر هم باز بشه
  useEffect(() => {
    if (selectedWorkerId && markerRefs.current[selectedWorkerId]) {
      markerRefs.current[selectedWorkerId].openPopup();
    }
  }, [selectedWorkerId]);

  return (
    <MapContainer
      center={[35.6892, 51.389]}
      zoom={13}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {workers.map(
        (worker) =>
          worker.latitude &&
          worker.longitude && (
            <Marker
              key={worker.id}
              position={[worker.latitude, worker.longitude]}
              ref={(ref) => {
                markerRefs.current[worker.id] = ref;
              }}
            >
              <Popup>
                <b>{worker.name}</b>
                <br />
                {worker.position}
              </Popup>
            </Marker>
          )
      )}

      {history.length > 0 && (
        <Polyline pathOptions={{ color: 'blue' }} positions={history} />
      )}

      <RecenterMap workers={workers} selectedWorkerId={selectedWorkerId} />
    </MapContainer>
  );
};

export default WorkerMap;
