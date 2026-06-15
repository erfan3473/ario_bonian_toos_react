import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchWorkerHistory } from '../features/workers/workerSlice';

// ----------------------------------------------------------------------
// توابع کمکی
// ----------------------------------------------------------------------
const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// محاسبه فاصله بین دو مختصات جغرافیایی به متر (فرمول Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const historyPointIcon = L.divIcon({
  className: '',
  html: `<div style="background-color: #EF4444; width: 16px; height: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border-radius: 50%;"></div>`,
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

// ----------------------------------------------------------------------
// کامپوننت اصلی
// ----------------------------------------------------------------------
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
  // استیت جدید برای پاک کردن کامل مسیر و مسافت هنگام ریست
  const [isHistoryCleared, setIsHistoryCleared] = useState(false);

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

  useEffect(() => {
    if (selectedWorkerId && !isHistoryCleared) {
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, isHistoryCleared, dispatch]);

  // وقتی کارگر جدیدی انتخاب می‌شود یا روی آن فوکوس می‌شود، حالت ریست لغو شود
  useEffect(() => {
    setIsHistoryCleared(false);
    setHistoryIndex(0);
  }, [selectedWorkerId, zoomTrigger]);

  // وقتی دیتای جدید مسیر از سرور می‌رسد، ایندکس اسلایدر صفر شود
  useEffect(() => {
    setHistoryIndex(0);
  }, [workerHistory]);

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

  // ۳. رسم مارکر زنده کارگران
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
      
      const speedKmh = Math.round((worker.speed || 0) * 3.6);

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
            border: 2px solid white; 
            border-radius: 50%;
            opacity: ${opacity};
            box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative;
            animation: ${isOffline || gpsStatus.hasIssue ? 'none' : 'pulse 2s infinite'};
            display: flex; justify-content: center; align-items: center;
          ">${badge}</div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const gpsStatusHtml = gpsStatus.hasIssue
        ? `<div style="margin-top:6px;padding:4px 8px;background:#FEF3C7;border-radius:0px;font-size:11px;color:#92400E;font-weight:bold;">⚠️ ${gpsStatus.label}</div>`
        : '';
        
      const speedHtml = (!isOffline && speedKmh > 0) 
        ? `<div style="margin-top:6px;font-size:12px;color:#2563EB;font-family:monospace;font-weight:bold;">💨 سرعت: ${speedKmh} km/h</div>` 
        : '';

      const popupContent = `
        <div style="text-align:center; min-width:140px; font-family: Tahoma, sans-serif;">
          ${worker.profile_image
            ? `<img src="${worker.profile_image}" style="width:56px;height:56px;border-radius:0;margin:0 auto 8px auto;object-fit:cover;border:3px solid ${markerColor};" />`
            : ''}
          <b style="font-size:14px;display:block;color:#1f2937;">${displayName}</b>
          <span style="font-size:12px;font-weight:bold;color:${markerColor};display:block;margin-top:4px;">${worker.position || 'نیروی ساده'}</span>
          ${worker.current_project_name
            ? `<div style="margin-top:8px;font-size:11px;color:#4b5563;">📍 ${worker.current_project_name}</div>`
            : ''}
          ${speedHtml}
          ${gpsStatusHtml}
        </div>
      `;

      const marker = L.marker([worker.latitude, worker.longitude], { icon })
        .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
        .addTo(map);

      workerMarkersRef.current[worker.id] = marker;
    });
  }, [workers]);

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

  // ۴. محاسبات تاریخچه و فواصل
  const GAP_THRESHOLD_MS = 10 * 60 * 1000;

  // وقتی ریست زده شود یا دیتای جدید در حال لود باشد، مسیر کاملاً پاک می‌شود
  const historyPoints = useMemo(() => {
    if (!selectedWorkerId || isHistoryCleared || loadingHistory) return [];
    return (workerHistory || []).filter((loc) => loc.latitude && loc.longitude);
  }, [workerHistory, selectedWorkerId, isHistoryCleared, loadingHistory]);

  const maxIndex = historyPoints.length > 0 ? historyPoints.length - 1 : 0;
  const clampedIndex = Math.min(historyIndex, maxIndex);

  const cumulativeDistances = useMemo(() => {
    if (historyPoints.length === 0) return [];
    const dists = [0];
    let total = 0;
    
    for (let i = 1; i < historyPoints.length; i++) {
      const p1 = historyPoints[i - 1];
      const p2 = historyPoints[i];
      const timeDiff = new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime();
      
      if (timeDiff <= GAP_THRESHOLD_MS) {
        total += calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      }
      dists.push(total);
    }
    return dists;
  }, [historyPoints]);

  const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1] || 0;
  const currentDistanceMeters = cumulativeDistances[clampedIndex] || 0;

  const visiblePathSegments = useMemo(() => {
    if (historyPoints.length === 0) return [];
    const segments = [];
    let currentSegment = [];

    for (let i = 0; i <= clampedIndex; i++) {
      const pt = historyPoints[i];
      if (i > 0) {
        const prevPt = historyPoints[i-1];
        const timeDiff = new Date(pt.timestamp).getTime() - new Date(prevPt.timestamp).getTime();
        
        if (timeDiff > GAP_THRESHOLD_MS) {
          if (currentSegment.length > 0) segments.push(currentSegment);
          currentSegment = [];
        }
      }
      currentSegment.push([pt.latitude, pt.longitude]);
    }
    
    if (currentSegment.length > 0) segments.push(currentSegment);
    return segments;
  }, [historyPoints, clampedIndex]);

  const currentPoint = historyPoints[clampedIndex] ? [historyPoints[clampedIndex].latitude, historyPoints[clampedIndex].longitude] : null;
  const currentMeta = historyPoints[clampedIndex] || null;
  
  // بررسی وضعیت لودینگ یا نمایش مسیر
  const isHistoryMode = selectedWorkerId && !isHistoryCleared && (currentMeta || loadingHistory);

  // ۵. رسم مسیر تاریخچه و حرکت هوشمند پاپ‌آپ
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // پاک‌سازی کامل خط مسیر قبلی
    if (historyLineRef.current) {
      map.removeLayer(historyLineRef.current);
      historyLineRef.current = null;
    }
    
    // رسم مجدد خط
    if (visiblePathSegments.length > 0) {
      historyLineRef.current = L.polyline(visiblePathSegments, {
        color: '#EF4444',
        weight: 4,
        opacity: 0.8
      }).addTo(map);
    }

    if (currentPoint && currentMeta) {
      const histSpeed = Math.round((currentMeta.speed || 0) * 3.6);
      const steps = Math.round(currentDistanceMeters / 0.75);

      let gapWarning = '';
      const nextMeta = historyPoints[clampedIndex + 1];
      if (nextMeta) {
        const timeDiffMs = new Date(nextMeta.timestamp).getTime() - new Date(currentMeta.timestamp).getTime();
        if (timeDiffMs > GAP_THRESHOLD_MS) {
          const gapMinutes = Math.round(timeDiffMs / 60000);
          gapWarning = `<div style="margin-top:6px; padding:4px; background-color:#FEF2F2; border:1px solid #FCA5A5; border-radius:4px; color:#B91C1C; font-weight:bold; font-size:10px; text-align:center;">
            ⚠️ پس از این نقطه، ارتباط به مدت ${gapMinutes} دقیقه قطع شده است.
          </div>`;
        }
      }

      const popupContent = `
        <div style="font-family: Tahoma, sans-serif; font-size:12px; min-width: 140px;">
          <div style="font-weight:bold; color:#DC2626; border-bottom:1px solid #ccc; padding-bottom:4px; margin-bottom:4px; text-align:center;">📍 وضعیت در این لحظه</div>
          <div style="margin-top:4px;">زمان: <span style="font-family:monospace; float:left;">${formatHistoryTime(currentMeta.timestamp)}</span></div>
          <div style="margin-top:4px;">سرعت: <span style="font-family:monospace; color:#2563EB; float:left;">${histSpeed} km/h</span></div>
          <div style="margin-top:4px;">طی شده: <span style="font-family:monospace; color:#059669; float:left;">${Math.round(currentDistanceMeters)} m</span></div>
          <div style="margin-top:4px;">تعداد قدم: <span style="font-family:monospace; color:#D97706; float:left;">${steps}</span></div>
          ${gapWarning}
        </div>
      `;

      if (!historyMarkerRef.current) {
        historyMarkerRef.current = L.marker(currentPoint, { icon: historyPointIcon })
          .bindPopup(L.popup({ className: 'sharp-popup', autoPan: false }).setContent(popupContent))
          .addTo(map);
      } else {
        historyMarkerRef.current.setLatLng(currentPoint);
        const popup = historyMarkerRef.current.getPopup();
        if (popup) popup.setContent(popupContent);
      }
      
      map.panTo(currentPoint, { animate: true, duration: 0.25 });
      
    } else {
      if (historyMarkerRef.current) {
        map.removeLayer(historyMarkerRef.current);
        historyMarkerRef.current = null;
      }
    }
  }, [visiblePathSegments, currentPoint, currentMeta, currentDistanceMeters, historyPoints, clampedIndex]);

  // ۶. تابع بازنشانی فیلتر بهبود یافته
  const handleResetFilter = () => {
    setTimeRange('24h');
    setHistoryIndex(0);
    setIsHistoryCleared(true); // این استیت باعث محو شدن فوری تمام المان‌های تاریخچه روی نقشه می‌شود


  };

  return (
    <div className="flex flex-col h-full w-full relative bg-gray-900">
      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .sharp-popup .leaflet-popup-content-wrapper { border-radius: 4px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .sharp-popup .leaflet-popup-tip { display: none; }
      `}</style>

      <div className="relative w-full h-full z-0 isolate">

        {/* کنترلرهای فیلتر */}
        <div className="absolute top-4 right-4 z-[400] flex shadow-2xl border border-gray-700">
          {['1h', '24h', '7d', '1m', '1y'].map((range) => {
            const labels = { '1h': '۱ ساعت', '24h': '۱ روز', '7d': '۱ هفته', '1m': '۱ ماه', '1y': '۱ سال' };
            return (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setIsHistoryCleared(false); // خروج از حالت ریست
                }}
                className={`px-4 py-2 text-xs font-bold transition-all border-l border-gray-700 ${
                  timeRange === range && !isHistoryCleared ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {labels[range]}
              </button>
            );
          })}
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 text-xs font-bold transition-all bg-red-600 text-white hover:bg-red-700"
            title="بازگشت به نقشه زنده و بستن مسیر"
          >
            ریست فیلتر
          </button>
        </div>

        {/* وضعیت بالا سمت چپ */}
        <div className={`absolute top-4 left-14 z-[400] backdrop-blur px-3 py-2 flex items-center gap-2 text-xs shadow-lg transition-colors duration-300 pointer-events-none
            ${isHistoryMode ? 'bg-blue-900/90 border border-blue-400 text-blue-100' : connected ? 'bg-gray-900/80 border border-gray-700 text-gray-200' : 'bg-red-900/90 border border-red-500 text-red-100'}`}>
          {isHistoryMode ? (
            <><span className="text-lg">🕓</span><span className="font-mono font-bold text-sm pt-0.5">{loadingHistory ? 'در حال دریافت...' : formatHistoryTime(currentMeta?.timestamp)}</span></>
          ) : (
            <><div className={`w-2.5 h-2.5 rounded-none ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div><span className="font-mono font-bold tracking-wider">{connected ? 'LIVE STREAM' : 'DISCONNECTED'}</span></>
          )}
        </div>

        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: '#f3f4f6' }} />

        {loadingHistory && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[400] bg-black/80 text-white py-3 px-6 shadow-2xl text-sm flex items-center gap-3 backdrop-blur-sm border border-gray-600">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-none animate-spin" />
            <span className="font-bold">در حال بارگذاری مسیر...</span>
          </div>
        )}

        {/* اسلایدر تاریخچه */}
        {historyPoints.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3">
            <div className="max-w-4xl mx-auto w-full">
              
              <div className="flex justify-between items-center mb-2 px-1">
                 <div className="text-xs text-gray-300">
                    کل مسافت در این بازه: <span className="font-mono font-bold text-green-400">{Math.round(totalDistanceMeters)} متر</span>
                 </div>
                 <div className="text-xs text-gray-300">
                    تعداد کل قدم‌ها: <span className="font-mono font-bold text-amber-500">{Math.round(totalDistanceMeters / 0.75)}</span>
                 </div>
              </div>

              <input
                type="range" min={0} max={maxIndex} value={clampedIndex}
                onChange={(e) => setHistoryIndex(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 appearance-none cursor-pointer accent-red-500"
                style={{ background: `linear-gradient(to left, #EF4444 0%, #EF4444 ${(clampedIndex / maxIndex) * 100}%, #374151 ${(clampedIndex / maxIndex) * 100}%, #374151 100%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                <span>🏁 شروع</span>
                <span className="font-bold text-white bg-gray-800 px-2 py-1 border border-gray-600">{clampedIndex + 1} / {historyPoints.length}</span>
                <span>انتها 🏁</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMap;
