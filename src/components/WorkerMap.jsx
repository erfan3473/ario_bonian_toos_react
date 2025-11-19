// src/components/WorkerMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import { fetchWorkerHistory } from '../features/workers/workerSlice';

// تنظیمات آیکون
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl, iconUrl, shadowUrl
});

const RecenterMap = ({ workers, selectedWorkerId }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find((w) => w.id === selectedWorkerId && w.latitude && w.longitude);
      if (worker) {
        map.setView([worker.latitude, worker.longitude], 16);
      }
    } else if (workers.length > 0) {
      const validWorkers = workers.filter((w) => w.latitude && w.longitude);
      if (validWorkers.length > 0) {
        const bounds = L.latLngBounds(validWorkers.map((w) => [w.latitude, w.longitude]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [workers, selectedWorkerId, map]);
  return null;
};

const WorkerMap = ({ workers, selectedWorkerId, workerHistory, loadingHistory }) => {
  const dispatch = useDispatch();
  const markerRefs = useRef({});
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    if (selectedWorkerId) {
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, dispatch]);

  useEffect(() => {
    if (selectedWorkerId && markerRefs.current[selectedWorkerId]) {
      markerRefs.current[selectedWorkerId].openPopup();
    }
  }, [selectedWorkerId, workers]);

  const historyPositions = (workerHistory || [])
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => [loc.latitude, loc.longitude]);

  return (
    // ✅ فیکس Z-Index: کلاس isolate و z-0 باعث می‌شود نقشه زیر هدر (z-40) بماند
    <div className="relative w-full h-full z-0 isolate">
      <MapContainer 
        center={[35.6892, 51.389]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }} // اطمینان مضاعف
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution="&copy; OpenStreetMap" 
        />
        
        {workers.map((worker) =>
            worker.latitude && worker.longitude && (
              <Marker 
                key={worker.id} 
                position={[worker.latitude, worker.longitude]} 
                ref={(ref) => { markerRefs.current[worker.id] = ref; }}
              >
                <Popup>
                  <div className="text-center min-w-[120px]">
                    {worker.profile_image && (
                      <img 
                        src={worker.profile_image} 
                        alt={worker.name} 
                        className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-white shadow-sm"
                      />
                    )}
                    <b className="text-sm block text-gray-800">{worker.name}</b>
                    <span className="text-xs text-gray-500 block">{worker.position}</span>
                  </div>
                </Popup>
              </Marker>
            )
        )}

        {historyPositions.length > 0 && (
          <Polyline pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }} positions={historyPositions} />
        )}

        <RecenterMap workers={workers} selectedWorkerId={selectedWorkerId} />
      </MapContainer>

      {/* کنترل‌های روی نقشه */}
      {selectedWorkerId && (
        <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur p-1.5 rounded-lg shadow-xl flex gap-1 border border-gray-200">
          {['1h', '24h', '7d'].map(range => (
             <button 
               key={range}
               onClick={() => setTimeRange(range)} 
               className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                 timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               {range.toUpperCase()}
             </button>
          ))}
        </div>
      )}

      {loadingHistory && (
        <div className="absolute bottom-3 left-3 z-[400] bg-black/70 text-white py-1 px-3 rounded-full shadow-lg text-xs flex items-center gap-2 backdrop-blur-sm">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          بارگذاری تاریخچه...
        </div>
      )}
    </div>
  );
};

export default WorkerMap;