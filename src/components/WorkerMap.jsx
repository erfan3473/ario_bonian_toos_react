import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchWorkerHistory } from '../features/workers/workerSlice';

const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const historyPointIcon = L.divIcon({
  className: '',
  html: `<div style="background-color:#EF4444;width:16px;height:16px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);border-radius:50%;"></div>`,
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

const createFeatureIcon = (svgString) => L.divIcon({
  className: 'custom-feature-icon',
  html: `
    <div style="
      background-color:white;width:28px;height:28px;border:2px solid #3B82F6;
      box-shadow:0 4px 6px rgba(0,0,0,0.3);border-radius:50%;
      display:flex;justify-content:center;align-items:center;
    ">
      ${svgString
      ? `<div style="width:16px;height:16px;display:flex;justify-content:center;align-items:center;">${svgString}</div>`
      : `<span style="font-size:14px;">📍</span>`}
    </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

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

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const workerMarkersRef = useRef({});
  const geofenceLayerRef = useRef(null);
  const historyLineRef = useRef(null);
  const historyMarkerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const routesAndFeaturesLayerRef = useRef(null);

  const [timeRange, setTimeRange] = useState('24h');
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isHistoryCleared, setIsHistoryCleared] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [isSatelliteEnabled, setIsSatelliteEnabled] = useState(false);

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
        minZoom: 10,
        maxZoom: 19,
        attribution: "نقشه ماهواره‌ای گوگل (آفلاین)",
        errorTileUrl: 'data:application/octet-stream;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });
      satelliteLayerRef.current = googleOfflineLayer;

      map.on('zoomend', () => setCurrentZoom(map.getZoom()));
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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !satelliteLayerRef.current) return;
    if (isSatelliteEnabled) map.addLayer(satelliteLayerRef.current);
    else map.removeLayer(satelliteLayerRef.current);
  }, [isSatelliteEnabled]);

  useEffect(() => {
    if (selectedWorkerId && !isHistoryCleared) {
      dispatch(fetchWorkerHistory({ workerId: selectedWorkerId, timeRange }));
    }
  }, [selectedWorkerId, timeRange, isHistoryCleared, dispatch]);

  useEffect(() => {
    setIsHistoryCleared(false);
    setHistoryIndex(0);
  }, [selectedWorkerId, zoomTrigger]);

  useEffect(() => setHistoryIndex(0), [workerHistory]);

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

      map.fitBounds(geofenceLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [projectGeofence]);

  useEffect(() => {
    const layerGroup = routesAndFeaturesLayerRef.current;
    if (!layerGroup) return;
    layerGroup.clearLayers();

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
  }, [routeTemplates, projectFeatures, selectedProjectId, projectGeofence]);

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
        ? `<div style="margin-top:6px;padding:4px 8px;background:#FEF3C7;font-size:11px;color:#92400E;font-weight:bold;">⚠️ ${gpsStatus.label}</div>`
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

      const marker = L.marker([worker.latitude, worker.longitude], { icon, zIndexOffset: 1000 })
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
        if (worker?.latitude && worker?.longitude) map.setView([worker.latitude, worker.longitude], 16, { animate: true });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [zoomTrigger, selectedWorkerId, workers]);

  const GAP_THRESHOLD_MS = 10 * 60 * 1000;
  const MAX_SPEED_KMH = 150;

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
      if (timeDiff <= GAP_THRESHOLD_MS) total += calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
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
        const prevPt = historyPoints[i - 1];
        const timeDiffMs = new Date(pt.timestamp).getTime() - new Date(prevPt.timestamp).getTime();
        const dist = calculateDistance(prevPt.latitude, prevPt.longitude, pt.latitude, pt.longitude);
        const speedKmh = timeDiffMs > 0 ? (dist / (timeDiffMs / 1000)) * 3.6 : 0;
        if (timeDiffMs > GAP_THRESHOLD_MS || speedKmh > MAX_SPEED_KMH) {
          if (currentSegment.length > 0) segments.push(currentSegment);
          currentSegment = [];
        }
      }
      currentSegment.push([pt.latitude, pt.longitude]);
    }
    if (currentSegment.length > 0) segments.push(currentSegment);
    return segments;
  }, [historyPoints, clampedIndex]);

  const currentPoint = historyPoints[clampedIndex]
    ? [historyPoints[clampedIndex].latitude, historyPoints[clampedIndex].longitude]
    : null;
  const currentMeta = historyPoints[clampedIndex] || null;
  const isHistoryMode = selectedWorkerId && !isHistoryCleared && (currentMeta || loadingHistory);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (historyLineRef.current) {
      map.removeLayer(historyLineRef.current);
      historyLineRef.current = null;
    }

    if (visiblePathSegments.length > 0) {
      historyLineRef.current = L.polyline(visiblePathSegments, { color: '#EF4444', weight: 4, opacity: 0.8 }).addTo(map);
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
          gapWarning = `<div style="margin-top:6px;padding:4px;background:#FEF2F2;border:1px solid #FCA5A5;color:#B91C1C;font-weight:bold;font-size:10px;text-align:center;">⚠️ پس از این نقطه، ارتباط ${gapMinutes} دقیقه قطع شده.</div>`;
        }
      }

      const popupContent = `
        <div style="font-family:Tahoma,sans-serif;font-size:12px;min-width:150px;">
          <div style="font-weight:bold;color:#DC2626;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:6px;text-align:center;">📍 وضعیت در این لحظه</div>
          <div style="margin-top:4px;">زمان: <span style="font-family:monospace;float:left;">${formatHistoryTime(currentMeta.timestamp)}</span></div>
          <div style="margin-top:4px;">سرعت: <span style="font-family:monospace;color:#2563EB;float:left;">${histSpeed} km/h</span></div>
          <div style="margin-top:4px;">طی شده: <span style="font-family:monospace;color:#059669;float:left;">${Math.round(currentDistanceMeters)} m</span></div>
          <div style="margin-top:4px;">قدم: <span style="font-family:monospace;color:#D97706;float:left;">${steps}</span></div>
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
        if (popup) popup.setContent(popupContent);
      }

      map.panTo(currentPoint, { animate: true, duration: 0.25 });
    } else if (historyMarkerRef.current) {
      map.removeLayer(historyMarkerRef.current);
      historyMarkerRef.current = null;
    }
  }, [visiblePathSegments, currentPoint, currentMeta, currentDistanceMeters, historyPoints, clampedIndex]);

  const handleResetFilter = () => {
    setTimeRange('24h');
    setHistoryIndex(0);
    setIsHistoryCleared(true);
    if (onCloseHistory) onCloseHistory();
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-gray-950">
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        .sharp-popup .leaflet-popup-content-wrapper { border-radius: 8px !important; }
        .sharp-popup .leaflet-popup-tip { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-feature-icon svg { width: 100%; height: 100%; }
      `}</style>

      <div className="relative w-full h-full z-0 isolate">
        {isHistoryMode && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[400] max-w-[95vw] sm:max-w-[90vw] bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl p-1.5 flex items-center gap-1 shadow-2xl">
            <div className="flex overflow-x-auto scrollbar-hide">
              {['1h', '24h', '7d', '1m', '1y'].map((range) => {
                const labels = { '1h': '۱س', '24h': '۱ر', '7d': '۱ه', '1m': '۱م', '1y': '۱س' };
                return (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setIsHistoryCleared(false);
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg whitespace-nowrap ${
                      timeRange === range && !isHistoryCleared
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {labels[range]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleResetFilter}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 shrink-0"
              title="بازگشت به نقشه زنده"
            >
              بستن
            </button>
          </div>
        )}

        <div
          className={`absolute top-2 sm:top-4 left-2 sm:left-4 z-[390] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs border shadow-lg pointer-events-none ${
            isHistoryMode
              ? 'bg-blue-900/90 border-blue-500 text-blue-100'
              : connected
                ? 'bg-gray-900/85 border-gray-700 text-gray-200'
                : 'bg-red-900/90 border-red-500 text-red-100'
          }`}
        >
          {isHistoryMode
            ? (loadingHistory ? 'در حال دریافت...' : formatHistoryTime(currentMeta?.timestamp))
            : (connected ? 'LIVE' : 'OFFLINE')}
        </div>

        <button
          onClick={() => setIsSatelliteEnabled(!isSatelliteEnabled)}
          className={`absolute bottom-24 sm:bottom-28 left-2 sm:left-4 z-[390] px-2.5 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold shadow-xl border ${
            isSatelliteEnabled ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 border-gray-300'
          }`}
        >
          {isSatelliteEnabled ? 'بستن ماهواره' : 'نقشه ماهواره'}
        </button>

        <div className="absolute bottom-24 sm:bottom-28 right-2 sm:right-4 z-[390] bg-white/90 text-gray-800 px-2 py-1 rounded text-[10px] sm:text-xs font-mono font-bold shadow-md border border-gray-300">
          Z: {currentZoom}
        </div>

        <div className="absolute bottom-36 sm:bottom-40 right-2 sm:right-4 z-[390] flex flex-col shadow-xl rounded-lg overflow-hidden border border-gray-300">
          <button onClick={() => mapInstanceRef.current?.zoomIn()} className="w-8 h-8 sm:w-9 sm:h-9 bg-white text-gray-800 border-b border-gray-200 font-bold text-xl hover:bg-gray-100">+</button>
          <button onClick={() => mapInstanceRef.current?.zoomOut()} className="w-8 h-8 sm:w-9 sm:h-9 bg-white text-gray-800 font-bold text-xl hover:bg-gray-100">−</button>
        </div>

        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: '#f3f4f6' }} />

        {loadingHistory && isHistoryMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] bg-black/80 text-white py-2 px-4 rounded-lg text-xs sm:text-sm flex items-center gap-2 backdrop-blur-sm border border-gray-600">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-bold">در حال بارگذاری مسیر...</span>
          </div>
        )}

        {isHistoryMode && historyPoints.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/95 backdrop-blur border-t border-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 pb-4 sm:pb-5">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center mb-2 text-[11px] sm:text-xs text-gray-300">
                <span>مسافت: <b className="text-green-400">{Math.round(totalDistanceMeters)} m</b></span>
                <span>قدم‌ها: <b className="text-amber-500">{Math.round(totalDistanceMeters / 0.75)}</b></span>
              </div>

              <input
                type="range"
                min={0}
                max={maxIndex}
                value={clampedIndex}
                onChange={(e) => setHistoryIndex(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 appearance-none cursor-pointer accent-red-500 rounded"
                style={{
                  background: maxIndex > 0
                    ? `linear-gradient(to left,#EF4444 0%,#EF4444 ${(clampedIndex / maxIndex) * 100}%,#374151 ${(clampedIndex / maxIndex) * 100}%,#374151 100%)`
                    : undefined,
                }}
              />

              <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-2 font-mono">
                <span>شروع</span>
                <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-600">
                  {clampedIndex + 1} / {historyPoints.length}
                </span>
                <span>انتها</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMap;
