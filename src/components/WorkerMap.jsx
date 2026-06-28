import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchWorkerHistory } from '../features/workers/workerSlice';

// --- توابع کمکی ---
const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  const date = d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} | ${time}`;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getWorkerGpsStatus = (worker) => {
  const gpsOff = worker.gps_enabled === false;
  const locationOff = worker.location_enabled === false;
  const permissionDenied = worker.permission_granted === false;
  return {
    hasIssue: gpsOff || locationOff || permissionDenied,
    label: gpsOff ? 'GPS خاموش' : locationOff ? 'لوکیشن خاموش' : permissionDenied ? 'دسترسی رد شده' : null,
  };
};

// --- آیکون‌ها ---
const historyPointIcon = L.divIcon({
  className: '',
  html: `<div style="background-color:#EF4444;width:16px;height:16px;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.6);border-radius:50%; transition: all 0.2s;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const createFeatureIcon = (svgString) => L.divIcon({
  className: 'custom-feature-icon',
  html: `
    <div style="
      background-color:white;width:28px;height:28px;border:2px solid #3B82F6;
      box-shadow:0 4px 6px rgba(0,0,0,0.3);border-radius:50%;
      display:flex;justify-content:center;align-items:center;
    ">
      ${svgString ? `<div style="width:16px;height:16px;display:flex;justify-content:center;align-items:center;">${svgString}</div>` : `<span style="font-size:14px;">📍</span>`}
    </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

// --- کامپوننت اصلی ---
const WorkerMap = ({
  workers,
  selectedWorkerId,
  zoomTrigger,
  workerHistory,
  loadingHistory,
  projectGeofence,
  connected,
  selectedProjectId,
  onCloseHistory,
}) => {
  const dispatch = useDispatch();
  const { routeTemplates, projectFeatures } = useSelector((state) => state.mapRoutes);

  // Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const workerMarkersRef = useRef({});
  const geofenceLayerRef = useRef(null);
  const historyLineRef = useRef(null);
  const historyMarkerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const routesAndFeaturesLayerRef = useRef(null);

  // States
  const [timeRange, setTimeRange] = useState('24h');
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isHistoryCleared, setIsHistoryCleared] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [isSatelliteEnabled, setIsSatelliteEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowingMarker, setIsFollowingMarker] = useState(true);

  // Constants
  const GAP_THRESHOLD_MS = 10 * 60 * 1000;
  const MAX_SPEED_KMH = 150;

  // 1. مقداردهی اولیه نقشه
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new L.Map(mapContainerRef.current, {
        key: "web.83d364e4d58e4b1e966567753524cdf8",
        maptype: "neshan",
        poi: false,
        traffic: false,
        center: [36.2974, 59.6062],
        zoom: 10,
        zoomControl: false,
      });

      const googleOfflineLayer = L.tileLayer(`/media/tiles/{z}/{x}/{y}.png`, {
        minZoom: 10, maxZoom: 19,
        attribution: "نقشه ماهواره‌ای گوگل",
        errorTileUrl: 'data:application/octet-stream;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });
      satelliteLayerRef.current = googleOfflineLayer;

      map.on('zoomend', () => setCurrentZoom(map.getZoom()));
      map.on('dragstart', () => setIsFollowingMarker(false));

      routesAndFeaturesLayerRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current && mapContainerRef.current === null) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. مدیریت لایه‌ها (ماهواره و جئوفنس)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !satelliteLayerRef.current) return;
    if (isSatelliteEnabled) map.addLayer(satelliteLayerRef.current);
    else map.removeLayer(satelliteLayerRef.current);
  }, [isSatelliteEnabled]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (geofenceLayerRef.current) map.removeLayer(geofenceLayerRef.current);

    if (projectGeofence && projectGeofence.length > 2) {
      geofenceLayerRef.current = L.polygon(projectGeofence, {
        color: '#3b82f6', weight: 2, dashArray: '10, 10', fillOpacity: 0.1
      }).bindPopup('محدوده پروژه').addTo(map);
      map.fitBounds(geofenceLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [projectGeofence]);

  // 3. درخواست دیتای تاریخچه
  useEffect(() => {
    if (selectedWorkerId && !isHistoryCleared) {
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, isHistoryCleared, dispatch]);

  useEffect(() => {
    setIsHistoryCleared(false);
    setHistoryIndex(0);
    setIsPlaying(false);
    setIsFollowingMarker(true);
  }, [selectedWorkerId, zoomTrigger]);

  useEffect(() => {
    setHistoryIndex(0);
    setIsPlaying(false);
  }, [workerHistory]);

  // 4. فیلتر کردن نقاط معتبر تاریخچه
  const historyPoints = useMemo(() => {
    if (!selectedWorkerId || isHistoryCleared || loadingHistory) return [];
    return (workerHistory || []).filter((loc) => (
      loc.latitude && loc.longitude && 
      loc.latitude !== 0 && loc.longitude !== 0 &&
      Math.abs(loc.latitude) > 1 && Math.abs(loc.longitude) > 1
    ));
  }, [workerHistory, selectedWorkerId, isHistoryCleared, loadingHistory]);

  const maxIndex = historyPoints.length > 0 ? historyPoints.length - 1 : 0;
  const clampedIndex = Math.min(historyIndex, maxIndex);

  // 5. پیش‌محاسبه‌ی مسافت‌ها و شکستگی‌های مسیر (جلوگیری از پرش)
  const { cumulativeDistances, allSegments } = useMemo(() => {
    if (historyPoints.length === 0) return { cumulativeDistances: [], allSegments: [] };
    
    const dists = [0];
    const segments = [];
    let currentSegment = [[historyPoints[0].latitude, historyPoints[0].longitude]];
    let total = 0;

    for (let i = 1; i < historyPoints.length; i++) {
      const p1 = historyPoints[i - 1];
      const p2 = historyPoints[i];
      const timeDiff = new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime();
      const dist = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const speedKmh = timeDiff > 0 ? (dist / (timeDiff / 1000)) * 3.6 : 0;

      if (timeDiff <= GAP_THRESHOLD_MS && speedKmh <= MAX_SPEED_KMH) {
        total += dist;
        currentSegment.push([p2.latitude, p2.longitude]);
      } else {
        segments.push(currentSegment);
        currentSegment = [[p2.latitude, p2.longitude]];
      }
      dists.push(total);
      
      if (i === historyPoints.length - 1) segments.push(currentSegment);
    }
    
    if (historyPoints.length === 1) segments.push(currentSegment);
    
    return { cumulativeDistances: dists, allSegments: segments };
  }, [historyPoints]);

  const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1] || 0;
  const currentDistanceMeters = cumulativeDistances[clampedIndex] || 0;

  // 6. ترسیم مسیر روی نقشه بدون پرش
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || historyPoints.length === 0) return;

    let pointsCount = 0;
    const visibleSegments = [];
    
    for (const seg of allSegments) {
      if (pointsCount + seg.length <= clampedIndex + 1) {
        visibleSegments.push(seg);
        pointsCount += seg.length;
      } else {
        const remaining = (clampedIndex + 1) - pointsCount;
        if (remaining > 0) visibleSegments.push(seg.slice(0, remaining));
        break;
      }
    }

    if (!historyLineRef.current) {
      historyLineRef.current = L.polyline(visibleSegments, { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(map);
    } else {
      historyLineRef.current.setLatLngs(visibleSegments);
    }
  }, [allSegments, clampedIndex, historyPoints.length]);

  // 7. آپدیت مارکر و پاپ‌آپ تاریخچه
  const currentPoint = historyPoints[clampedIndex] ? [historyPoints[clampedIndex].latitude, historyPoints[clampedIndex].longitude] : null;
  const currentMeta = historyPoints[clampedIndex] || null;
  const isHistoryMode = selectedWorkerId && !isHistoryCleared && (currentMeta || loadingHistory);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentPoint || !currentMeta) return;

    const histSpeed = Math.round((currentMeta.speed || 0) * 3.6);
    const steps = Math.round(currentDistanceMeters / 0.75);
    
    let gapWarning = '';
    const nextMeta = historyPoints[clampedIndex + 1];
    if (nextMeta) {
      const timeDiffMs = new Date(nextMeta.timestamp).getTime() - new Date(currentMeta.timestamp).getTime();
      if (timeDiffMs > GAP_THRESHOLD_MS) {
        const gapMinutes = Math.round(timeDiffMs / 60000);
        gapWarning = `<div style="margin-top:6px;padding:4px;background:#FEF2F2;border:1px solid #FCA5A5;color:#B91C1C;border-radius:4px;font-size:10px;text-align:center;">⚠️ ارتباط ${gapMinutes} دقیقه قطع شده</div>`;
      }
    }

    const popupContent = `
      <div style="font-family:Tahoma,sans-serif;font-size:12px;min-width:160px;direction:rtl;">
        <div style="font-weight:bold;color:#DC2626;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px;text-align:center;">وضعیت نقطه‌یاب</div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;"><span>زمان:</span> <b style="font-family:monospace; font-size:11px;">${formatHistoryTime(currentMeta.timestamp)}</b></div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;"><span>سرعت:</span> <b style="color:#2563EB;">${histSpeed} km/h</b></div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;"><span>مسافت:</span> <b style="color:#059669;">${Math.round(currentDistanceMeters)} m</b></div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;"><span>قدم:</span> <b style="color:#D97706;">${steps}</b></div>
        ${gapWarning}
      </div>
    `;

    if (!historyMarkerRef.current) {
      historyMarkerRef.current = L.marker(currentPoint, { icon: historyPointIcon, zIndexOffset: 2000 })
        .bindPopup(L.popup({ className: 'sharp-popup', autoPan: false }).setContent(popupContent))
        .addTo(map);
    } else {
      historyMarkerRef.current.setLatLng(currentPoint);
      const popup = historyMarkerRef.current.getPopup();
      if (popup && popup.isOpen()) popup.setContent(popupContent);
    }

    if (isFollowingMarker) {
      const currentMapZoom = map.getZoom();
      const mapBounds = map.getBounds();
      
      if (!mapBounds.contains(currentPoint)) {
        map.setView(currentPoint, currentMapZoom >= 14 ? currentMapZoom : 15, { animate: false });
      } else if (isPlaying) {
        map.panTo(currentPoint, { animate: true, duration: 0.25 });
      }
    }
  }, [currentPoint, currentMeta, currentDistanceMeters, isFollowingMarker, isPlaying]);

  // 8. سیستم Play/Pause
  useEffect(() => {
    let interval;
    if (isPlaying && clampedIndex < maxIndex) {
      interval = setInterval(() => {
        setHistoryIndex((prev) => {
          if (prev >= maxIndex) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, clampedIndex, maxIndex]);

  // 9. نمایش کارگران لایو (با پاپ‌آپ‌های پیشرفته و فیلتر)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isHistoryMode) {
      Object.values(workerMarkersRef.current).forEach(marker => map.removeLayer(marker));
      workerMarkersRef.current = {};
      return;
    }

    const currentWorkerIds = new Set((workers || []).map(w => w.id));

    Object.keys(workerMarkersRef.current).forEach(id => {
      if (!currentWorkerIds.has(Number(id))) {
        map.removeLayer(workerMarkersRef.current[id]);
        delete workerMarkersRef.current[id];
      }
    });

    (workers || []).forEach((worker) => {
      if (!worker.latitude || !worker.longitude) return;

      const displayName = worker.full_name || 'کارگر ناشناس';
      const isOffline = worker.stale;
      const gpsStatus = getWorkerGpsStatus(worker);
      const positionColor = isOffline ? '#6B7280' : (worker.position_color_hex || '#3B82F6');
      const markerColor = gpsStatus.hasIssue ? '#F59E0B' : positionColor;
      const opacity = isOffline ? 0.6 : 1;
      const speedKmh = Math.round((worker.speed || 0) * 3.6);

      const badge = gpsStatus.hasIssue
        ? `<span style="position:absolute;top:-14px;right:-6px;font-size:13px;" title="${gpsStatus.label}">⚠️</span>`
        : isOffline ? `<span style="position:absolute;top:-12px;right:-5px;font-size:11px;">💤</span>` : '';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            background:${markerColor};width:${isOffline ? '18px' : '22px'};height:${isOffline ? '18px' : '22px'};
            border:2px solid white;border-radius:50%;opacity:${opacity};
            box-shadow:0 4px 6px rgba(0,0,0,0.3);position:relative;
            animation:${isOffline || gpsStatus.hasIssue ? 'none' : 'pulse 2s infinite'};
            display:flex;justify-content:center;align-items:center;
          ">${badge}</div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const speedHtml = (!isOffline && speedKmh > 0)
        ? `<div style="margin-top:6px;font-size:12px;color:#2563EB;font-family:monospace;font-weight:bold;">💨 سرعت: ${speedKmh} km/h</div>`
        : '';

      const gpsStatusHtml = gpsStatus.hasIssue
        ? `<div style="margin-top:6px;padding:4px 8px;background:#FEF3C7;font-size:11px;color:#92400E;font-weight:bold;border-radius:4px;">⚠️ ${gpsStatus.label}</div>`
        : '';

      const popupContent = `
        <div style="text-align:center; min-width:140px; font-family:Tahoma,sans-serif;">
          ${worker.profile_image
            ? `<img src="${worker.profile_image}" style="width:56px;height:56px;border-radius:4px;margin:0 auto 8px auto;object-fit:cover;border:3px solid ${markerColor};" />`
            : ''}
          <b style="font-size:14px;display:block;color:#1f2937;">${displayName}</b>
          <span style="font-size:12px;font-weight:bold;color:${markerColor};display:block;margin-top:4px;">${worker.position || 'نیروی ساده'}</span>
          ${worker.current_project_name ? `<div style="margin-top:8px;font-size:11px;color:#4b5563;">📍 ${worker.current_project_name}</div>` : ''}
          ${speedHtml}
          ${gpsStatusHtml}
        </div>
      `;

      if (!workerMarkersRef.current[worker.id]) {
        workerMarkersRef.current[worker.id] = L.marker([worker.latitude, worker.longitude], { icon, zIndexOffset: 1000 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(map);
      } else {
        workerMarkersRef.current[worker.id].setLatLng([worker.latitude, worker.longitude]);
        workerMarkersRef.current[worker.id].setIcon(icon);
        const popup = workerMarkersRef.current[worker.id].getPopup();
        if (popup && popup.isOpen()) popup.setContent(popupContent);
      }
    });
  }, [workers, isHistoryMode]);

  // 10. نمایش مسیرها و عارضه‌ها با فیلتر پروژه
  useEffect(() => {
    const layerGroup = routesAndFeaturesLayerRef.current;
    if (!layerGroup) return;
    layerGroup.clearLayers();

    if (isHistoryMode) return;

    let filteredTemplates = [];
    let filteredFeatures = [];

    if (!selectedProjectId) {
      filteredTemplates = routeTemplates;
      filteredFeatures = projectFeatures;
    } else if (selectedProjectId === 'uncategorized') {
      filteredTemplates = routeTemplates.filter(rt => !rt.project);
      filteredFeatures = projectFeatures.filter(pf => !pf.project);
    } else {
      const targetId = String(selectedProjectId);
      filteredTemplates = routeTemplates.filter(rt => {
        const pId = (rt.project && typeof rt.project === 'object') ? rt.project.id : rt.project;
        return String(pId) === targetId;
      });
      filteredFeatures = projectFeatures.filter(pf => {
        const pId = (pf.project && typeof pf.project === 'object') ? pf.project.id : pf.project;
        return String(pId) === targetId;
      });
    }

    filteredTemplates.forEach((template) => {
      const popupContent = `
        <div style="font-family:Tahoma;font-size:13px;text-align:right;min-width:140px;">
          <strong style="color:#2563EB;font-size:13px;">${template.name}</strong>
          ${template.description ? `<div style="margin-top:4px;font-size:11px;color:#4B5563;">${template.description}</div>` : ''}
        </div>
      `;

      if (template.polygon_coordinates?.length > 0) {
        const correctedPolygon = template.polygon_coordinates.map(pt => [pt[1], pt[0]]);
        L.polygon(correctedPolygon, { color: '#8B5CF6', weight: 2, fillOpacity: 0.2 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      } else if (template.line_coordinates?.length > 0) {
        const correctedLine = template.line_coordinates.map(pt => [pt[1], pt[0]]);
        L.polyline(correctedLine, { color: '#10B981', weight: 3 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      } else if (template.multi_line_coordinates?.length > 0) {
        const correctedMultiLine = template.multi_line_coordinates.map(line => line.map(pt => [pt[1], pt[0]]));
        L.polyline(correctedMultiLine, { color: '#F59E0B', weight: 3 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      }
    });

    filteredFeatures.forEach((feature) => {
      if (feature.location_coordinates?.length === 2) {
        const svgIcon = feature.icon_detail?.icon_svg || null;
        const popupContent = `
          <div style="font-family:Tahoma;font-size:13px;text-align:right;min-width:140px;">
            <strong style="color:#EF4444;font-size:13px;">${feature.name}</strong>
            ${feature.icon_detail?.name ? `<div style="color:#059669;margin-top:2px;font-size:11px;">نوع: ${feature.icon_detail.name}</div>` : ''}
            ${feature.description ? `<div style="margin-top:4px;font-size:11px;color:#4B5563;">${feature.description}</div>` : ''}
          </div>
        `;
        L.marker(feature.location_coordinates, { icon: createFeatureIcon(svgIcon) })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      }
    });

    if (layerGroup.getLayers().length > 0 && (!projectGeofence || projectGeofence.length < 3)) {
      mapInstanceRef.current.fitBounds(layerGroup.getBounds(), { padding: [40, 40], maxZoom: 15 });
    }
  }, [routeTemplates, projectFeatures, selectedProjectId, projectGeofence, isHistoryMode]);

  const handleResetFilter = useCallback(() => {
    setTimeRange('24h');
    setHistoryIndex(0);
    setIsHistoryCleared(true);
    setIsPlaying(false);
    if (historyLineRef.current) mapInstanceRef.current?.removeLayer(historyLineRef.current);
    if (historyMarkerRef.current) mapInstanceRef.current?.removeLayer(historyMarkerRef.current);
    historyLineRef.current = null;
    historyMarkerRef.current = null;
    if (onCloseHistory) onCloseHistory();
  }, [onCloseHistory]);

  const bottomControlsPositionClass = isHistoryMode && historyPoints.length > 0 
    ? "bottom-[70px] sm:bottom-[75px]" 
    : "bottom-6 sm:bottom-8";

  return (
    <div className="flex flex-col h-full w-full relative bg-gray-950">
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        .sharp-popup .leaflet-popup-content-wrapper { border-radius: 12px !important; padding: 4px; }
        .sharp-popup .leaflet-popup-tip { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-feature-icon svg { width: 100%; height: 100%; }
      `}</style>

      <div className="relative w-full h-full z-0 isolate">
        
        {/* هدر تاریخچه */}
        {isHistoryMode && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[400] max-w-[95vw] sm:max-w-[90vw] bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-1.5 flex items-center gap-1 shadow-2xl">
            <div className="flex overflow-x-auto scrollbar-hide">
              {['1h', '24h', '7d', '1m', '1y'].map((range) => {
                const labels = { '1h': '۱س', '24h': '۱ر', '7d': '۱ه', '1m': '۱م', '1y': '۱س' };
                return (
                  <button
                    key={range}
                    onClick={() => { setTimeRange(range); setIsHistoryCleared(false); setIsPlaying(false); }}
                    className={`px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg whitespace-nowrap transition-colors ${
                      timeRange === range && !isHistoryCleared ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {labels[range]}
                  </button>
                );
              })}
            </div>
            <button onClick={handleResetFilter} className="px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg bg-red-500/90 text-white hover:bg-red-600 shrink-0 backdrop-blur-md">
              بستن
            </button>
          </div>
        )}

        {/* استاتوس بار لایو / آفلاین */}
        <div className={`absolute top-2 sm:top-4 left-2 sm:left-4 z-[390] px-3 py-2 rounded-xl text-xs font-bold border shadow-lg pointer-events-none backdrop-blur-md ${
            isHistoryMode ? 'bg-blue-900/80 border-blue-500/50 text-blue-100' : connected ? 'bg-gray-900/80 border-gray-700/50 text-gray-200' : 'bg-red-900/80 border-red-500/50 text-red-100'
          }`}>
          {isHistoryMode ? (loadingHistory ? 'در حال دریافت...' : 'حالت تاریخچه') : (connected ? 'LIVE' : 'OFFLINE')}
        </div>

        {/* دکمه‌های کنترل نقشه */}
        <div className={`absolute right-2 sm:right-4 z-[390] flex flex-col gap-2 transition-all duration-300 ${bottomControlsPositionClass}`}>
          {/* دکمه Follow Mode */}
          {isHistoryMode && (
            <button 
              onClick={() => {
                setIsFollowingMarker(!isFollowingMarker);
                if (!isFollowingMarker && currentPoint) mapInstanceRef.current?.panTo(currentPoint);
              }} 
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-xl border flex items-center justify-center text-base sm:text-lg backdrop-blur-md transition-all ${isFollowingMarker ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/90 border-gray-300 text-gray-600'}`}
              title="قفل روی نشانگر"
            >
              🎯
            </button>
          )}
          
          <div className="flex flex-col shadow-xl rounded-lg sm:rounded-xl overflow-hidden border border-gray-300/50 backdrop-blur-md">
            <button onClick={() => mapInstanceRef.current?.zoomIn()} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 text-gray-800 border-b border-gray-200 font-bold text-lg sm:text-xl hover:bg-gray-100">+</button>
            <button onClick={() => mapInstanceRef.current?.zoomOut()} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 text-gray-800 font-bold text-lg sm:text-xl hover:bg-gray-100">−</button>
          </div>
        </div>

        <button onClick={() => setIsSatelliteEnabled(!isSatelliteEnabled)} className={`absolute left-2 sm:left-4 z-[390] px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-xl border backdrop-blur-md transition-all duration-300 ${bottomControlsPositionClass} ${
            isSatelliteEnabled ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/90 text-gray-800 border-gray-300/50'
          }`}>
          {isSatelliteEnabled ? 'بستن ماهواره' : 'نقشه ماهواره'}
        </button>

        {/* کانتینر نقشه */}
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: '#e5e7eb' }} />

        {/* لودینگ تاریخچه */}
        {loadingHistory && isHistoryMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] bg-black/80 text-white py-3 px-5 rounded-2xl text-sm flex items-center gap-3 backdrop-blur-md border border-gray-600 shadow-2xl">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-bold">در حال پردازش مسیر...</span>
          </div>
        )}

        {/* پنل پخش پایین (فشرده شده) */}
        {isHistoryMode && historyPoints.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/90 backdrop-blur-lg border-t border-gray-700/50 px-2 pt-1.5 pb-1 sm:px-4 sm:pt-2 sm:pb-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-0.5 sm:gap-1">
              {/* ردیف اول: دکمه پلی و اطلاعات */}
              <div className="flex justify-between items-center text-[11px] sm:text-xs text-gray-300 leading-none">
                <span className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-white transition-colors ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <span>مسافت: <b className="text-emerald-400">{Math.round(totalDistanceMeters)} m</b></span>
                </span>
                <span>قدم‌ها: <b className="text-amber-400">{Math.round(totalDistanceMeters / 0.75)}</b></span>
              </div>

              {/* ردیف دوم: اسلایدر */}
              <div className="relative flex items-center w-full h-4 group cursor-pointer" dir="ltr">
                <input
                  type="range"
                  min={0}
                  max={maxIndex}
                  value={clampedIndex}
                  onChange={(e) => {
                    setHistoryIndex(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
                />
                
                <div className="absolute w-full h-1 bg-gray-700 rounded-full overflow-hidden pointer-events-none z-0">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-75"
                    style={{ width: `${maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 0}%` }}
                  />
                </div>
                
                <div 
                  className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)] pointer-events-none transform -translate-x-1/2 transition-all duration-75 z-10"
                  style={{ left: `${maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 0}%` }}
                />
              </div>

              {/* ردیف سوم: زمان‌ها */}
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 font-mono leading-none mt-0.5" dir="ltr">
                <span>{formatHistoryTime(historyPoints[0]?.timestamp).split(' | ')[1]}</span>
                <span className="font-bold text-white bg-gray-800/80 px-1.5 py-0.5 rounded-md border border-gray-600">
                  {clampedIndex + 1} / {historyPoints.length}
                </span>
                <span>{formatHistoryTime(historyPoints[maxIndex]?.timestamp).split(' | ')[1]}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMap;
