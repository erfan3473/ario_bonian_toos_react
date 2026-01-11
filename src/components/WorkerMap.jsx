// src/components/WorkerMap.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchWorkerHistory } from '../features/workers/workerSlice';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const WorkerMap = ({ workers, selectedWorkerId, workerHistory, loadingHistory, projectGeofence, connected }) => {
  const dispatch = useDispatch();
  const markerRefs = useRef({});
  const mapRef = useRef(null);

  const [timeRange, setTimeRange] = useState('24h');
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (selectedWorkerId) {
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, dispatch]);

  useEffect(() => {
    setHistoryIndex(0);
  }, [selectedWorkerId, timeRange, workerHistory]);

  useEffect(() => {
    if (selectedWorkerId && markerRefs.current[selectedWorkerId]) {
      markerRefs.current[selectedWorkerId].openPopup();
    }
  }, [selectedWorkerId]);

  useEffect(() => {
    if (projectGeofence && projectGeofence.length > 0 && mapRef.current) {
        try {
            const bounds = L.polygon(projectGeofence).getBounds();
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {
            console.warn('Cannot fit bounds', e);
        }
    }
  }, [projectGeofence]);

  const historyPoints = useMemo(
    () => (workerHistory || []).filter((loc) => loc.latitude && loc.longitude),
    [workerHistory]
  );

  const historyPositions = historyPoints.map((loc) => [loc.latitude, loc.longitude]);
  const maxIndex = historyPositions.length > 0 ? historyPositions.length - 1 : 0;
  const clampedIndex = Math.min(historyIndex, maxIndex);

  const visiblePath = historyPositions.slice(0, clampedIndex + 1);
  const currentPoint = historyPositions[clampedIndex] || null;
  const currentMeta = historyPoints[clampedIndex] || null;

  // ✅ تشخیص حالت تاریخچه: اگر کاربری انتخاب شده و دیتای نقطه فعلی موجود است
  const isHistoryMode = selectedWorkerId && currentMeta;

  return (
    <div className="flex flex-col h-full relative">
      
      {/* نوار کنترل بازه زمانی */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex gap-2">
          {['1h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white scale-105'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '1h' ? '۱ ساعت' : range === '24h' ? '۱ روز' : '۱ هفته'}
            </button>
          ))}
        </div>
        {/* ساعت از اینجا حذف شد و به داخل بج منتقل شد */}
      </div>

      {/* کانتینر نقشه */}
      <div className="relative w-full h-full z-0 isolate rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
        
        {/* ✅ بج هوشمند (تلفیق وضعیت اتصال و ساعت تاریخچه) */}
        <div 
            className={`absolute top-4 left-14 z-[400] backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-xs border shadow-lg transition-colors duration-300 pointer-events-none
            ${isHistoryMode 
                ? 'bg-blue-900/90 border-blue-400 text-blue-100' // استایل حالت تاریخچه (آبی)
                : connected 
                    ? 'bg-gray-900/80 border-gray-700 text-gray-200' // استایل آنلاین (خاکستری)
                    : 'bg-red-900/90 border-red-500 text-red-100' // استایل آفلاین (قرمز)
            }`}
        >
            {isHistoryMode ? (
                // 🕒 حالت تاریخچه: نمایش ساعت
                <>
                    <span className="text-lg">🕓</span>
                    <span className="font-mono font-bold text-sm pt-0.5">
                        {formatHistoryTime(currentMeta.timestamp)}
                    </span>
                </>
            ) : (
                // 📡 حالت زنده: نمایش وضعیت اتصال
                <>
                    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-mono font-bold tracking-wider">
                        {connected ? 'LIVE STREAM' : 'DISCONNECTED'}
                    </span>
                </>
            )}
        </div>

        <MapContainer
          center={[36.2974, 59.6062]} 
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {/* ✅ نمایش فنس پروژه */}
          {projectGeofence && projectGeofence.length > 2 && (
             <Polygon 
                positions={projectGeofence}
                pathOptions={{ 
                    color: '#3b82f6',
                    weight: 2,
                    dashArray: '10, 10',
                    fillOpacity: 0.1 
                }}
             >
                <Popup>محدوده پروژه</Popup>
             </Polygon>
          )}

          {/* مسیر تاریخچه - خط قرمز */}
          {visiblePath.length > 1 && (
            <Polyline
              pathOptions={{ color: '#EF4444', weight: 4, opacity: 0.8 }}
              positions={visiblePath}
            />
          )}

          {currentPoint && (
            <Marker position={currentPoint}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-red-600">📍 نقطه انتخابی</div>
                  {currentMeta && (
                    <>
                      <div className="mt-1">
                        زمان: <span className="font-mono">{formatHistoryTime(currentMeta.timestamp)}</span>
                      </div>
                      <div className="mt-1">
                        GPS:{' '}
                        <span className={currentMeta.gps_enabled ? 'text-green-600' : 'text-red-600 font-bold'}>
                          {currentMeta.gps_enabled ? 'روشن / کامل' : 'خاموش / محدود'}
                        </span>
                      </div>
                    </>
                  )}

                </div>
              </Popup>
            </Marker>
          )}

          {/* 🔹 مارکر کارگرها */}
          {workers.map((worker) => {
            if (!worker.latitude || !worker.longitude) return null;
            
            const positionColor = worker.position_color_hex || '#3B82F6';
            const displayName = worker.full_name || 'اسم ثبت نشده';

            const icon = L.divIcon({
              className: '',
              html: `
                <div style="
                  background: ${positionColor};
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 15px ${positionColor}60;
                  position: relative;
                  animation: ${worker.stale ? 'none' : 'pulse 2s infinite'};
                "></div>
                <style>
                  @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                  }
                </style>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            });

            return (
              <Marker
                key={worker.id}
                position={[worker.latitude, worker.longitude]}
                icon={icon}
                ref={(ref) => {
                  if (ref) markerRefs.current[worker.id] = ref;
                }}
              >
                <Popup>
                  <div className="text-center min-w-[140px]">
                    {worker.profile_image && (
                      <img 
                        src={worker.profile_image} 
                        alt={displayName} 
                        className="w-14 h-14 rounded-full mx-auto mb-2 object-cover shadow-md"
                        style={{ border: `3px solid ${positionColor}` }}
                      />
                    )}
                    <b className="text-sm block text-gray-800">{displayName}</b>
                    <span 
                      className="text-xs font-bold block mt-1"
                      style={{ color: positionColor }}
                    >
                      {worker.position || 'نیروی ساده'}
                    </span>
                    {worker.current_project_name && (
                      <div className="mt-2 text-[11px] text-gray-600">
                        📍 {worker.current_project_name}
                      </div>
                    )}
                    {worker.user_id && (
                      <div className="mt-1 text-[10px] text-gray-500 font-mono">
                        ID: {worker.user_id}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {loadingHistory && (
          <div className="absolute bottom-4 left-4 z-[400] bg-black/80 text-white py-2 px-4 rounded-full shadow-2xl text-xs flex items-center gap-2 backdrop-blur-sm border border-gray-600">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-bold">در حال بارگذاری مسیر...</span>
          </div>
        )}
      </div>

      {/* 🎚️ اسلایدر تایم‌لاین */}
      <div className="mt-3 px-2">
        {historyPositions.length > 0 ? (
          <>
            <input
              type="range"
              min={0}
              max={maxIndex}
              value={clampedIndex}
              onChange={(e) => setHistoryIndex(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{
                background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${(clampedIndex / maxIndex) * 100}%, #374151 ${(clampedIndex / maxIndex) * 100}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>🏁 شروع</span>
              <span className="font-bold text-white">
                {clampedIndex + 1} / {historyPositions.length}
              </span>
              <span>🏁 انتها</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500 text-center py-3 bg-gray-800/50 rounded-lg border border-gray-700">
            برای این بازه زمانی هیچ موقعیتی ثبت نشده.
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMap;