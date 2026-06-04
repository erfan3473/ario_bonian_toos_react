import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchWorkerHistory } from '../features/workers/workerSlice';

const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const historyPointIcon = L.divIcon({
  className: '',
  html: `<div style="background-color: #EF4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const getWorkerGpsStatus = (worker) => {
  const gpsOff = worker.gps_enabled === false;
  const locationOff = worker.location_enabled === false;
  const permissionDenied = worker.permission_granted === false;
  return {
    hasIssue: gpsOff || locationOff || permissionDenied,
    label: gpsOff ? 'GPS خاموش' : locationOff ? 'لوکیشن خاموش' : permissionDenied ? 'دسترسی رد شده' : null,
  };
};

const WorkerMap = ({ workers, selectedWorkerId, zoomTrigger, workerHistory, loadingHistory, projectGeofence, connected }) => {
  const dispatch = useDispatch();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const workerMarkersRef = useRef({});
  const geofenceLayerRef = useRef(null);
  const historyLineRef = useRef(null);
  const historyMarkerRef = useRef(null);

  const [timeRange, setTimeRange] = useState('24h');
  const [historyIndex, setHistoryIndex] = useState(0);

  // ۱. مقداردهی اولیه نقشه
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new L.Map(mapContainerRef.current, {
      key: "web.83d364e4d58e4b1e966567753524cdf8",
      maptype: "neshan",
      poi: false,
      traffic: false,
      center: [36.2974, 59.6062],
      zoom: 13,
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // دریافت تاریخچه
  useEffect(() => {
    if (selectedWorkerId) {
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, dispatch]);

  useEffect(() => {
    setHistoryIndex(0);
  }, [selectedWorkerId, timeRange, workerHistory]);

  // ۲. رسم Geofence
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geofenceLayerRef.current) map.removeLayer(geofenceLayerRef.current);

    if (projectGeofence && projectGeofence.length > 2) {
      geofenceLayerRef.current = L.polygon(projectGeofence, {
        color: '#3b82f6',
        weight: 2,
        dashArray: '10, 10',
        fillOpacity: 0.1
      }).bindPopup('محدوده پروژه').addTo(map);

      map.fitBounds(geofenceLayerRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [projectGeofence]);

  // ۳. رسم مارکر کارگران — بدون منطق زوم
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(workerMarkersRef.current).forEach(marker => map.removeLayer(marker));
    workerMarkersRef.current = {};

    workers.forEach((worker) => {
      if (!worker.latitude || !worker.longitude) return;

      const displayName = worker.full_name || 'کارگر ناشناس';
      const isOffline = worker.stale;
      const gpsStatus = getWorkerGpsStatus(worker);
      const positionColor = isOffline ? '#6B7280' : (worker.position_color_hex || '#3B82F6');
      const markerColor = gpsStatus.hasIssue ? '#F59E0B' : positionColor;
      const opacity = isOffline ? 0.6 : 1;

      const badge = gpsStatus.hasIssue
        ? `<span style="position:absolute;top:-16px;right:-6px;font-size:14px;" title="${gpsStatus.label}">⚠️</span>`
        : isOffline
          ? `<span style="position:absolute;top:-14px;right:-5px;font-size:12px;">💤</span>`
          : '';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            background: ${markerColor};
            width: ${isOffline ? '18px' : '22px'};
            height: ${isOffline ? '18px' : '22px'};
            border-radius: 50%; border: 2px solid white; opacity: ${opacity};
            box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative;
            animation: ${isOffline || gpsStatus.hasIssue ? 'none' : 'pulse 2s infinite'};
            display: flex; justify-content: center; align-items: center;
          ">${badge}</div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const gpsStatusHtml = gpsStatus.hasIssue
        ? `<div style="margin-top:6px;padding:4px 8px;background:#FEF3C7;border-radius:6px;font-size:11px;color:#92400E;font-weight:bold;">⚠️ ${gpsStatus.label}</div>`
        : '';

      const popupContent = `
        <div style="text-align:center; min-width:140px; font-family: Tahoma, sans-serif;">
          ${worker.profile_image
            ? `<img src="${worker.profile_image}" style="width:56px;height:56px;border-radius:50%;margin:0 auto 8px auto;object-fit:cover;border:3px solid ${markerColor};" />`
            : ''}
          <b style="font-size:14px;display:block;color:#1f2937;">${displayName}</b>
          <span style="font-size:12px;font-weight:bold;color:${markerColor};display:block;margin-top:4px;">${worker.position || 'نیروی ساده'}</span>
          ${worker.current_project_name
            ? `<div style="margin-top:8px;font-size:11px;color:#4b5563;">📍 ${worker.current_project_name}</div>`
            : ''}
          ${gpsStatusHtml}
        </div>
      `;

      const marker = L.marker([worker.latitude, worker.longitude], { icon })
        .bindPopup(L.popup().setContent(popupContent))
        .addTo(map);

      workerMarkersRef.current[worker.id] = marker;
    });
  }, [workers]);

  // ۳.۵ زوم — جداگانه، فقط با zoomTrigger
  useEffect(() => {
    if (!selectedWorkerId || !zoomTrigger) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    const timer = setTimeout(() => {
      const marker = workerMarkersRef.current[selectedWorkerId];
      if (marker) {
        map.setView(marker.getLatLng(), 16, { animate: true });
        marker.openPopup();
      } else {
        const worker = workers.find(w => w.id === selectedWorkerId);
        if (worker?.latitude && worker?.longitude) {
          map.setView([worker.latitude, worker.longitude], 16, { animate: true });
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [zoomTrigger]);

  // محاسبه تاریخچه
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
  const isHistoryMode = selectedWorkerId && currentMeta;

  // ۴. رسم مسیر تاریخچه
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (historyLineRef.current) map.removeLayer(historyLineRef.current);
    if (visiblePath.length > 1) {
      historyLineRef.current = L.polyline(visiblePath, {
        color: '#EF4444',
        weight: 4,
        opacity: 0.8
      }).addTo(map);
    }

    if (historyMarkerRef.current) map.removeLayer(historyMarkerRef.current);
    if (currentPoint) {
      const popupContent = `
        <div style="font-family: Tahoma, sans-serif; font-size:12px;">
          <div style="font-weight:bold; color:#DC2626;">📍 نقطه انتخابی</div>
          ${currentMeta ? `
            <div style="margin-top:4px;">زمان: <span style="font-family:monospace;">${formatHistoryTime(currentMeta.timestamp)}</span></div>
            <div style="margin-top:4px;">GPS: <span style="color:${currentMeta.gps_enabled ? '#16A34A' : '#DC2626'};font-weight:bold;">${currentMeta.gps_enabled ? 'روشن' : 'خاموش'}</span></div>
          ` : ''}
        </div>
      `;

      historyMarkerRef.current = L.marker(currentPoint, { icon: historyPointIcon })
        .bindPopup(L.popup().setContent(popupContent))
        .addTo(map);
    }
  }, [visiblePath, currentPoint, currentMeta]);

  return (
    <div className="flex flex-col h-full relative">
      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      `}</style>

      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex gap-2">
          {['1h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                timeRange === range ? 'bg-blue-600 text-white scale-105' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '1h' ? '۱ ساعت' : range === '24h' ? '۱ روز' : '۱ هفته'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-full z-0 isolate rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">

        <div className={`absolute top-4 left-14 z-[400] backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-xs border shadow-lg transition-colors duration-300 pointer-events-none
            ${isHistoryMode ? 'bg-blue-900/90 border-blue-400 text-blue-100' : connected ? 'bg-gray-900/80 border-gray-700 text-gray-200' : 'bg-red-900/90 border-red-500 text-red-100'}`}>
          {isHistoryMode ? (
            <><span className="text-lg">🕓</span><span className="font-mono font-bold text-sm pt-0.5">{formatHistoryTime(currentMeta.timestamp)}</span></>
          ) : (
            <><div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div><span className="font-mono font-bold tracking-wider">{connected ? 'LIVE STREAM' : 'DISCONNECTED'}</span></>
          )}
        </div>

        <div ref={mapContainerRef} style={{ height: '500px', width: '100%', zIndex: 0, backgroundColor: '#f3f4f6' }} />

        {loadingHistory && (
          <div className="absolute bottom-4 left-4 z-[400] bg-black/80 text-white py-2 px-4 rounded-full shadow-2xl text-xs flex items-center gap-2 backdrop-blur-sm border border-gray-600">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-bold">در حال بارگذاری مسیر...</span>
          </div>
        )}
      </div>

      <div className="mt-3 px-2">
        {historyPositions.length > 0 ? (
          <>
            <input
              type="range" min={0} max={maxIndex} value={clampedIndex}
              onChange={(e) => setHistoryIndex(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{ background: `linear-gradient(to left, #EF4444 0%, #EF4444 ${(clampedIndex / maxIndex) * 100}%, #374151 ${(clampedIndex / maxIndex) * 100}%, #374151 100%)` }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>🏁 شروع</span>
              <span className="font-bold text-white">{clampedIndex + 1} / {historyPositions.length}</span>
              <span>🏁 انتها</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500 text-center py-3 bg-gray-800/50 rounded-lg border border-gray-700">برای این بازه زمانی هیچ موقعیتی ثبت نشده.</div>
        )}
      </div>
    </div>
  );
};

export default WorkerMap;
