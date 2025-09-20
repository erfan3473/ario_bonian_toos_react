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
  const [workerHistory, setWorkerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const markerRefs = useRef({});

  const fetchHistory = async (workerId) => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/workers/${workerId}/history/`);
      
      console.log('Full API response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        setWorkerHistory(response.data);
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data;
        
        if (data.results && Array.isArray(data.results)) {
          setWorkerHistory(data.results);
        } else if (data.data && Array.isArray(data.data)) {
          setWorkerHistory(data.data);
        } else if (data.history && Array.isArray(data.history)) {
          setWorkerHistory(data.history);
        } else {
          setWorkerHistory([data]);
        }
      } else {
        setWorkerHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch worker history:', error);
      setWorkerHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!selectedWorkerId) {
      setWorkerHistory([]);
      return;
    }

    fetchHistory(selectedWorkerId);
  }, [selectedWorkerId]);

  // وقتی worker انتخاب شد، popup مارکر هم باز بشه
  useEffect(() => {
    if (selectedWorkerId && markerRefs.current[selectedWorkerId]) {
      markerRefs.current[selectedWorkerId].openPopup();
    }
  }, [selectedWorkerId]);

  // تبدیل تاریخچه به فرمت مورد نیاز برای Polyline
  const historyPositions = workerHistory
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => [loc.latitude, loc.longitude]);

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
                <br />
                {worker.latitude.toFixed(4)}, {worker.longitude.toFixed(4)}
              </Popup>
            </Marker>
          )
      )}

      {historyPositions.length > 0 && (
        <Polyline 
          pathOptions={{ color: 'blue', weight: 3 }} 
          positions={historyPositions} 
        />
      )}

      {loadingHistory && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'white',
          padding: '5px 10px',
          borderRadius: '4px'
        }}>
          Loading history...
        </div>
      )}

      <RecenterMap workers={workers} selectedWorkerId={selectedWorkerId} />
    </MapContainer>
  );
};

export default WorkerMap;