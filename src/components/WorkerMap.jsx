import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchWorkerHistory } from '../features/workers/workerSlice'; // ایمپورت از slice

// ... تنظیمات آیکون Leaflet ...
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl, iconUrl, shadowUrl
});

// Helper component to recenter map
const RecenterMap = ({ workers, selectedWorkerId }) => {
    // این کامپوننت بدون تغییر باقی می‌ماند
  const map = useMap();
  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find((w) => w.id === selectedWorkerId && w.latitude && w.longitude);
      if (worker) {
        map.setView([worker.latitude, worker.longitude], 15);
      }
    } else if (workers.length > 0) {
      const bounds = L.latLngBounds(
        workers.filter((w) => w.latitude && w.longitude).map((w) => [w.latitude, w.longitude])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [workers, selectedWorkerId, map]);
  return null;
};

// کامپوننت اصلی نقشه
const WorkerMap = ({ workers, selectedWorkerId, workerHistory, loadingHistory }) => {
  const dispatch = useDispatch();
  const markerRefs = useRef({});
  const [timeRange, setTimeRange] = useState('24h'); // '1h', '24h', '7d'

  useEffect(() => {
    if (selectedWorkerId) {
      // وقتی کارگر یا بازه زمانی تغییر کرد، تاریخچه را از Redux واکشی کن
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, dispatch]);

  // وقتی کارگر انتخاب شد، popup مارکر هم باز بشه
  useEffect(() => {
    if (selectedWorkerId && markerRefs.current[selectedWorkerId]) {
      markerRefs.current[selectedWorkerId].openPopup();
    }
  }, [selectedWorkerId, workers]); // وابستگی به workers اضافه شد تا بعد از رندر مجدد هم کار کند

  const historyPositions = (workerHistory || [])
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => [loc.latitude, loc.longitude]);

  return (
    <div className="relative">
      <MapContainer center={[35.6892, 51.389]} zoom={13} style={{ height: '500px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {workers.map((worker) =>
            worker.latitude && worker.longitude && (
              <Marker key={worker.id} position={[worker.latitude, worker.longitude]} ref={(ref) => { markerRefs.current[worker.id] = ref; }}>
                <Popup>
                  <b>{worker.name}</b><br />
                  {worker.position}<br />
                  {worker.latitude.toFixed(4)}, {worker.longitude.toFixed(4)}
                </Popup>
              </Marker>
            )
        )}
        {historyPositions.length > 0 && (
          <Polyline pathOptions={{ color: 'blue', weight: 3 }} positions={historyPositions} />
        )}
        <RecenterMap workers={workers} selectedWorkerId={selectedWorkerId} />
      </MapContainer>

      {/* دکمه‌های فیلتر زمانی */}
      {selectedWorkerId && (
        <div className="absolute top-3 right-3 z-[1000] bg-white p-1 rounded shadow-lg flex gap-1">
          <button onClick={() => setTimeRange('1h')} className={`px-3 py-1 text-xs rounded ${timeRange === '1h' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1H</button>
          <button onClick={() => setTimeRange('24h')} className={`px-3 py-1 text-xs rounded ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>24H</button>
          <button onClick={() => setTimeRange('7d')} className={`px-3 py-1 text-xs rounded ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>7D</button>
        </div>
      )}

      {loadingHistory && (
        <div className="absolute top-3 left-3 z-[1000] bg-white py-1 px-3 rounded shadow-md text-sm">
          Loading history...
        </div>
      )}
    </div>
  );
};

export default WorkerMap;