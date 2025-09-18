// src/components/WorkerMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
// وارد کردن عکس‌ها با import
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// برای حل مشکل آیکون پیش‌فرض در Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl, // استفاده از متغیر وارد شده
  iconUrl: iconUrl,             // استفاده از متغیر وارد شده
  shadowUrl: shadowUrl,         // استفاده از متغیر وارد شده
});


const WorkerMap = ({ workers, selectedWorkerId }) => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!selectedWorkerId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        // آدرس API را مطابق با ساختار خود تنظیم کنید
        const { data } = await axios.get(`/api/workers/${selectedWorkerId}/history/?days=1`);
        const path = data.map(loc => [loc.latitude, loc.longitude]);
        setHistory(path);
      } catch (error) {
        console.error("Failed to fetch worker history", error);
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedWorkerId]);

  const center = [35.6892, 51.3890]; // مختصات پیش‌فرض (مثلاً تهران)

  return (
    <MapContainer center={center} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {workers.map(worker => (
        worker.latitude && worker.longitude && (
          <Marker key={worker.id} position={[worker.latitude, worker.longitude]}>
            <Popup>
              <b>{worker.name}</b><br/>
              {worker.position}
            </Popup>
          </Marker>
        )
      ))}

      {history.length > 0 && (
        <Polyline pathOptions={{ color: 'blue' }} positions={history} />
      )}
    </MapContainer>
  );
};

export default WorkerMap;