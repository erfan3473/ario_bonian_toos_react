import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchWorkerHistory } from '../features/workers/workerSlice';

const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  const date = d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} | ${time}`;
};

const formatClockOnly = (isoTs) => {
  if (!isoTs) return '—';
  return new Date(isoTs).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDurationFa = (seconds) => {
  if (!seconds || seconds < 1) return '';
  if (seconds < 60) return `${Math.round(seconds)} ثانیه`;
  const totalMins = Math.round(seconds / 60);
  if (totalMins < 60) return `${totalMins} دقیقه`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs} ساعت و ${mins} دقیقه` : `${hrs} ساعت`;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getWorkerGpsStatus = (worker) => {
  const gpsOff = worker.gps_enabled === false;
  const locationOff = worker.location_enabled === false;
  const permissionDenied = worker.permission_granted === false;
  return {
    hasIssue: gpsOff || locationOff || permissionDenied,
    label: gpsOff
      ? 'GPS خاموش'
      : locationOff
      ? 'لوکیشن خاموش'
      : permissionDenied
      ? 'دسترسی رد شده'
      : null,
  };
};

const isValidCoordPair = (lat, lng) =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat !== 0 &&
  lng !== 0 &&
  Math.abs(lat) > 1 &&
  Math.abs(lng) > 1;

const resolveEventMeta = (item, hasCoords) => {
  const code = item.status_code;
  const gpsOff = item.gps_enabled === false;
  const locOff = item.location_enabled === false;
  const permDenied = item.permission_granted === false;

  if (code === 'SILENT_GAP') {
    return {
      code: 'SILENT_GAP',
      label: 'توقف ارسال داده (خاموشی گوشی / قطعی شبکه)',
      shortLabel: 'بدون داده',
      color: '#64748B',
      bgClass: 'bg-slate-800/90 border-slate-500/60 text-slate-200',
      icon: '🔌',
      isIssue: true,
    };
  }
  if (code === 'NO_PERMISSION' || (!hasCoords && permDenied)) {
    return {
      code: 'NO_PERMISSION',
      label: 'دسترسی موقعیت مکانی رد شده',
      shortLabel: 'عدم دسترسی',
      color: '#EF4444',
      bgClass: 'bg-red-950/90 border-red-500/60 text-red-200',
      icon: '🚫',
      isIssue: true,
    };
  }
  if (code === 'GPS_AND_LOCATION_OFF' || (!hasCoords && gpsOff && locOff)) {
    return {
      code: 'GPS_AND_LOCATION_OFF',
      label: 'GPS و موقعیت‌یاب گوشی خاموش',
      shortLabel: 'GPS خاموش',
      color: '#F59E0B',
      bgClass: 'bg-amber-950/90 border-amber-500/60 text-amber-200',
      icon: '📵',
      isIssue: true,
    };
  }
  if (code === 'GPS_OFF' || (!hasCoords && gpsOff)) {
    return {
      code: 'GPS_OFF',
      label: 'GPS خاموش بوده است',
      shortLabel: 'GPS خاموش',
      color: '#F59E0B',
      bgClass: 'bg-amber-950/90 border-amber-500/60 text-amber-200',
      icon: '📵',
      isIssue: true,
    };
  }
  if (code === 'LOCATION_OFF' || (!hasCoords && locOff)) {
    return {
      code: 'LOCATION_OFF',
      label: 'سرویس موقعیت‌یاب گوشی خاموش',
      shortLabel: 'لوکیشن خاموش',
      color: '#F59E0B',
      bgClass: 'bg-amber-950/90 border-amber-500/60 text-amber-200',
      icon: '📍',
      isIssue: true,
    };
  }
  if (code === 'NO_SIGNAL' || !hasCoords) {
    return {
      code: 'NO_SIGNAL',
      label: 'عدم دریافت سیگنال ماهواره (GPS روشن)',
      shortLabel: 'عدم سیگنال',
      color: '#A855F7',
      bgClass: 'bg-purple-950/90 border-purple-500/60 text-purple-200',
      icon: '📡',
      isIssue: true,
    };
  }
  if (code === 'NO_PERMISSION_WITH_LOC' || permDenied) {
    return {
      code: 'NO_PERMISSION_WITH_LOC',
      label: 'موقعیت ثبت‌شده (هشدار دسترسی)',
      shortLabel: 'هشدار دسترسی',
      color: '#EF4444',
      bgClass: 'bg-red-950/80 border-red-500/50 text-red-200',
      icon: '⚠️',
      isIssue: true,
    };
  }
  if (code === 'GPS_OFF_WITH_LOC' || gpsOff) {
    return {
      code: 'GPS_OFF_WITH_LOC',
      label: 'موقعیت تقریبی شبکه (GPS خاموش)',
      shortLabel: 'شبکه (GPS خاموش)',
      color: '#F59E0B',
      bgClass: 'bg-amber-950/80 border-amber-500/50 text-amber-200',
      icon: '⚠️',
      isIssue: true,
    };
  }
  if (code === 'LOCATION_OFF_WITH_LOC' || locOff) {
    return {
      code: 'LOCATION_OFF_WITH_LOC',
      label: 'موقعیت ثبت‌شده (هشدار لوکیشن)',
      shortLabel: 'هشدار لوکیشن',
      color: '#F59E0B',
      bgClass: 'bg-amber-950/80 border-amber-500/50 text-amber-200',
      icon: '⚠️',
      isIssue: true,
    };
  }
  return {
    code: 'OK',
    label: 'موقعیت معتبر',
    shortLabel: 'معتبر',
    color: '#10B981',
    bgClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
    icon: '●',
    isIssue: false,
  };
};

const timeRangesConfig = [
  { key: '1h', label: '۱ ساعت' },
  { key: '24h', label: '۲۴ ساعت' },
  { key: '7d', label: '۷ روز' },
  { key: '1m', label: '۱ ماه' },
  { key: '1y', label: '۱ سال' },
];

const historyNormalIcon = L.divIcon({
  className: '',
  html: `<div style="background-color:#EF4444;width:16px;height:16px;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.6);border-radius:50%;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const createHistoryIssueIcon = (color, symbol) =>
  L.divIcon({
    className: '',
    html: `<div style="background-color:${color};width:28px;height:28px;border:2.5px solid white;box-shadow:0 0 14px ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;animation:pulse 1.5s infinite;">${symbol}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createFeatureIcon = (svgString) =>
  L.divIcon({
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
    popupAnchor: [0, -28],
  });

const GAP_THRESHOLD_MS = 10 * 60 * 1000;
const MAX_SPEED_KMH = 150;

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
  const markerStateCacheRef = useRef({});
  const geofenceLayerRef = useRef(null);
  const historyLineRef = useRef(null);
  const outageLineRef = useRef(null);
  const historyMarkerRef = useRef(null);
  const historyMarkerIconKeyRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const routesAndFeaturesLayerRef = useRef(null);

  const [timeRange, setTimeRange] = useState('24h');
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isHistoryCleared, setIsHistoryCleared] = useState(false);
  const [isSatelliteEnabled, setIsSatelliteEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowingMarker, setIsFollowingMarker] = useState(true);

  const selectedWorker = useMemo(() => {
    return (workers || []).find((w) => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  const isHistoryMode = Boolean(selectedWorkerId && !isHistoryCleared);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new L.Map(mapContainerRef.current, {
        key: 'web.83d364e4d58e4b1e966567753524cdf8',
        maptype: 'neshan',
        poi: false,
        traffic: false,
        center: [36.2974, 59.6062],
        zoom: 10,
        zoomControl: false,
      });

      const googleOfflineLayer = L.tileLayer(`/media/tiles/{z}/{x}/{y}.png`, {
        minZoom: 10,
        maxZoom: 19,
        attribution: 'نقشه ماهواره‌ای',
        errorTileUrl:
          'data:application/octet-stream;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      });
      satelliteLayerRef.current = googleOfflineLayer;

      map.on('dragstart', () => setIsFollowingMarker(false));

      routesAndFeaturesLayerRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !satelliteLayerRef.current) return;
    if (isSatelliteEnabled) {
      map.addLayer(satelliteLayerRef.current);
    } else {
      map.removeLayer(satelliteLayerRef.current);
    }
  }, [isSatelliteEnabled]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (geofenceLayerRef.current) {
      map.removeLayer(geofenceLayerRef.current);
    }

    if (projectGeofence && projectGeofence.length > 2) {
      geofenceLayerRef.current = L.polygon(projectGeofence, {
        color: '#3b82f6',
        weight: 2,
        dashArray: '10, 10',
        fillOpacity: 0.1,
      })
        .bindPopup('محدوده پروژه')
        .addTo(map);
      map.fitBounds(geofenceLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [projectGeofence]);

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

  const {
    timelineItems,
    cumulativeDistances,
    issueIndices,
  } = useMemo(() => {
    if (!selectedWorkerId || isHistoryCleared || loadingHistory) {
      return { timelineItems: [], cumulativeDistances: [], issueIndices: [] };
    }

    const rawList = Array.isArray(workerHistory) ? workerHistory : [];
    if (rawList.length === 0) {
      return { timelineItems: [], cumulativeDistances: [], issueIndices: [] };
    }

    const baseItems = rawList.map((loc) => {
      const hasCoords = isValidCoordPair(loc.latitude, loc.longitude);
      const startMs = loc.timestamp ? new Date(loc.timestamp).getTime() : 0;
      const endMs = loc.end_timestamp ? new Date(loc.end_timestamp).getTime() : startMs;
      return {
        ...loc,
        hasCoords,
        startMs,
        endMs,
        meta: resolveEventMeta(loc, hasCoords),
      };
    });

    const withGaps = [];
    for (let i = 0; i < baseItems.length; i++) {
      const item = baseItems[i];
      if (i > 0) {
        const prev = baseItems[i - 1];
        const gapMs = item.startMs - prev.endMs;
        if (gapMs > GAP_THRESHOLD_MS) {
          const gapItem = {
            id: `gap-${prev.id}-${item.id}`,
            latitude: null,
            longitude: null,
            speed: null,
            timestamp: new Date(prev.endMs).toISOString(),
            end_timestamp: new Date(item.startMs).toISOString(),
            duration_seconds: Math.round(gapMs / 1000),
            records_count: 0,
            status_code: 'SILENT_GAP',
            hasCoords: false,
            startMs: prev.endMs,
            endMs: item.startMs,
            meta: resolveEventMeta({ status_code: 'SILENT_GAP' }, false),
          };
          withGaps.push(gapItem);
        }
      }
      withGaps.push(item);
    }

    const firstValidCoord = withGaps.find((x) => x.hasCoords);
    let lastLat = firstValidCoord ? firstValidCoord.latitude : null;
    let lastLng = firstValidCoord ? firstValidCoord.longitude : null;
    let lastCoordPoint = null;
    let totalDist = 0;
    const dists = [];
    const issues = [];

    const enriched = withGaps.map((item, idx) => {
      if (item.hasCoords) {
        if (lastCoordPoint) {
          const timeDiff = item.startMs - lastCoordPoint.startMs;
          const d = calculateDistance(
            lastCoordPoint.latitude,
            lastCoordPoint.longitude,
            item.latitude,
            item.longitude
          );
          const speedKmh = timeDiff > 0 ? (d / (timeDiff / 1000)) * 3.6 : 0;
          if (timeDiff <= GAP_THRESHOLD_MS && speedKmh <= MAX_SPEED_KMH) {
            totalDist += d;
          }
        }
        lastLat = item.latitude;
        lastLng = item.longitude;
        lastCoordPoint = item;
      }

      dists.push(totalDist);
      if (item.meta.isIssue) {
        issues.push(idx);
      }

      return {
        ...item,
        anchorLat: item.hasCoords ? item.latitude : lastLat,
        anchorLng: item.hasCoords ? item.longitude : lastLng,
      };
    });

    return {
      timelineItems: enriched,
      cumulativeDistances: dists,
      issueIndices: issues,
    };
  }, [workerHistory, selectedWorkerId, isHistoryCleared, loadingHistory]);

  const maxIndex = timelineItems.length > 0 ? timelineItems.length - 1 : 0;
  const clampedIndex = Math.min(historyIndex, maxIndex);
  const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1] || 0;
  const currentDistanceMeters = cumulativeDistances[clampedIndex] || 0;
  const currentItem = timelineItems[clampedIndex] || null;
  const currentPoint =
    currentItem && currentItem.anchorLat !== null && currentItem.anchorLng !== null
      ? [currentItem.anchorLat, currentItem.anchorLng]
      : null;

  const { visibleSegments, visibleOutageConnectors } = useMemo(() => {
    if (timelineItems.length === 0) {
      return { visibleSegments: [], visibleOutageConnectors: [] };
    }

    const segments = [];
    const connectors = [];
    let currentSeg = [];
    let lastValid = null;
    let hadGapSinceLastValid = false;

    for (let i = 0; i <= clampedIndex; i++) {
      const item = timelineItems[i];
      if (!item.hasCoords) {
        hadGapSinceLastValid = true;
        continue;
      }

      const pt = [item.latitude, item.longitude];
      if (lastValid) {
        const timeDiff = item.startMs - lastValid.startMs;
        const d = calculateDistance(lastValid.latitude, lastValid.longitude, item.latitude, item.longitude);
        const speedKmh = timeDiff > 0 ? (d / (timeDiff / 1000)) * 3.6 : 0;

        if (hadGapSinceLastValid || timeDiff > GAP_THRESHOLD_MS || speedKmh > MAX_SPEED_KMH) {
          if (currentSeg.length > 0) segments.push(currentSeg);
          currentSeg = [pt];
          connectors.push([[lastValid.latitude, lastValid.longitude], pt]);
        } else {
          currentSeg.push(pt);
        }
      } else {
        currentSeg = [pt];
      }

      lastValid = item;
      hadGapSinceLastValid = false;
    }

    if (currentSeg.length > 0) segments.push(currentSeg);
    return { visibleSegments: segments, visibleOutageConnectors: connectors };
  }, [timelineItems, clampedIndex]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (visibleSegments.length === 0) {
      if (historyLineRef.current) {
        map.removeLayer(historyLineRef.current);
        historyLineRef.current = null;
      }
    } else if (!historyLineRef.current) {
      historyLineRef.current = L.polyline(visibleSegments, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
    } else {
      historyLineRef.current.setLatLngs(visibleSegments);
    }

    if (visibleOutageConnectors.length === 0) {
      if (outageLineRef.current) {
        map.removeLayer(outageLineRef.current);
        outageLineRef.current = null;
      }
    } else if (!outageLineRef.current) {
      outageLineRef.current = L.polyline(visibleOutageConnectors, {
        color: '#F59E0B',
        weight: 2.5,
        opacity: 0.7,
        dashArray: '6, 8',
      }).addTo(map);
    } else {
      outageLineRef.current.setLatLngs(visibleOutageConnectors);
    }
  }, [visibleSegments, visibleOutageConnectors]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!currentPoint || !currentItem) {
      if (historyMarkerRef.current) {
        map.removeLayer(historyMarkerRef.current);
        historyMarkerRef.current = null;
        historyMarkerIconKeyRef.current = null;
      }
      return;
    }

    const meta = currentItem.meta;
    const isIssueStep = meta.isIssue;
    const iconKey = isIssueStep ? `${meta.code}-${meta.color}` : 'OK';
    const markerIcon = isIssueStep
      ? createHistoryIssueIcon(meta.color, meta.icon)
      : historyNormalIcon;

    const durationStr = formatDurationFa(currentItem.duration_seconds);
    const hasRange = currentItem.end_timestamp && currentItem.end_timestamp !== currentItem.timestamp;

    let popupContent = '';
    if (!currentItem.hasCoords) {
      popupContent = `
        <div style="font-family:Tahoma,sans-serif;font-size:12px;min-width:190px;direction:rtl;">
          <div style="font-weight:bold;color:${meta.color};border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px;text-align:center;">
            ${meta.icon} ${meta.label}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;">
            <span>شروع:</span>
            <b style="font-family:monospace;font-size:11px;">${formatHistoryTime(currentItem.timestamp)}</b>
          </div>
          ${
            hasRange
              ? `<div style="display:flex;justify-content:space-between;margin-top:4px;">
                  <span>پایان:</span>
                  <b style="font-family:monospace;font-size:11px;">${formatHistoryTime(currentItem.end_timestamp)}</b>
                </div>`
              : ''
          }
          ${
            durationStr
              ? `<div style="display:flex;justify-content:space-between;margin-top:4px;">
                  <span>مدت:</span>
                  <b style="color:${meta.color};">${durationStr}</b>
                </div>`
              : ''
          }
          <div style="margin-top:6px;padding:4px 6px;background:#F8FAFC;border-radius:6px;color:#475569;font-size:10px;text-align:center;">
            نشانگر روی آخرین موقعیت ثبت‌شده قرار دارد
          </div>
        </div>
      `;
    } else {
      const histSpeed = Math.round((currentItem.speed || 0) * 3.6);
      const steps = Math.round(currentDistanceMeters / 0.75);
      const issueBanner = isIssueStep
        ? `<div style="margin-top:6px;padding:4px 6px;background:#FEF3C7;border:1px solid #F59E0B;color:#92400E;border-radius:6px;font-size:10px;font-weight:bold;text-align:center;">${meta.icon} ${meta.label}</div>`
        : '';

      popupContent = `
        <div style="font-family:Tahoma,sans-serif;font-size:12px;min-width:170px;direction:rtl;">
          <div style="font-weight:bold;color:#DC2626;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px;text-align:center;">وضعیت نقطه‌یاب</div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>زمان:</span> <b style="font-family:monospace;font-size:11px;">${formatHistoryTime(currentItem.timestamp)}</b></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>سرعت:</span> <b style="color:#2563EB;">${histSpeed} km/h</b></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>مسافت:</span> <b style="color:#059669;">${Math.round(currentDistanceMeters)} m</b></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>قدم:</span> <b style="color:#D97706;">${steps}</b></div>
          ${issueBanner}
        </div>
      `;
    }

    if (!historyMarkerRef.current) {
      historyMarkerRef.current = L.marker(currentPoint, { icon: markerIcon, zIndexOffset: 2000 })
        .bindPopup(L.popup({ className: 'sharp-popup', autoPan: false }).setContent(popupContent))
        .addTo(map);
      historyMarkerIconKeyRef.current = iconKey;
    } else {
      historyMarkerRef.current.setLatLng(currentPoint);
      if (historyMarkerIconKeyRef.current !== iconKey) {
        historyMarkerRef.current.setIcon(markerIcon);
        historyMarkerIconKeyRef.current = iconKey;
      }
      const popup = historyMarkerRef.current.getPopup();
      if (popup) popup.setContent(popupContent);
    }

    if (isFollowingMarker) {
      const currentMapZoom = map.getZoom();
      const mapBounds = map.getBounds();

      if (!mapBounds.contains(currentPoint)) {
        map.setView(currentPoint, currentMapZoom >= 14 ? currentMapZoom : 15, { animate: false });
      } else if (isPlaying) {
        map.panTo(currentPoint, { animate: false });
      }
    }
  }, [currentPoint, currentItem, currentDistanceMeters, isFollowingMarker, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setHistoryIndex((prev) => {
        if (prev >= maxIndex) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying, maxIndex]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isHistoryMode) {
      Object.values(workerMarkersRef.current).forEach((marker) => map.removeLayer(marker));
      workerMarkersRef.current = {};
      markerStateCacheRef.current = {};
      return;
    }

    const currentWorkerIds = new Set((workers || []).map((w) => w.id));

    Object.keys(workerMarkersRef.current).forEach((id) => {
      if (!currentWorkerIds.has(Number(id))) {
        map.removeLayer(workerMarkersRef.current[id]);
        delete workerMarkersRef.current[id];
        delete markerStateCacheRef.current[id];
      }
    });

    (workers || []).forEach((worker) => {
      if (!worker.latitude || !worker.longitude) return;

      const isOffline = worker.stale;
      const gpsStatus = getWorkerGpsStatus(worker);
      const positionColor = isOffline ? '#6B7280' : worker.position_color_hex || '#3B82F6';
      const markerColor = gpsStatus.hasIssue ? '#F59E0B' : positionColor;
      const opacity = isOffline ? 0.6 : 1;
      const speedKmh = Math.round((worker.speed || 0) * 3.6);

      const prevVisualState = markerStateCacheRef.current[worker.id];
      const hasVisualChanged =
        !prevVisualState ||
        prevVisualState.isOffline !== isOffline ||
        prevVisualState.hasIssue !== gpsStatus.hasIssue ||
        prevVisualState.markerColor !== markerColor ||
        prevVisualState.speedKmh !== speedKmh;

      const buildLivePopup = () => {
        const speedHtml =
          !isOffline && speedKmh > 0
            ? `<div style="margin-top:6px;font-size:12px;color:#2563EB;font-family:monospace;font-weight:bold;">💨 سرعت: ${speedKmh} km/h</div>`
            : '';
        const gpsStatusHtml = gpsStatus.hasIssue
          ? `<div style="margin-top:6px;padding:4px 8px;background:#FEF3C7;font-size:11px;color:#92400E;font-weight:bold;border-radius:4px;">⚠️ ${gpsStatus.label}</div>`
          : '';
        return `
          <div style="text-align:center; min-width:140px; font-family:Tahoma,sans-serif;">
            ${
              worker.profile_image
                ? `<img src="${worker.profile_image}" style="width:56px;height:56px;border-radius:4px;margin:0 auto 8px auto;object-fit:cover;border:3px solid ${markerColor};" />`
                : ''
            }
            <b style="font-size:14px;display:block;color:#1f2937;">${worker.full_name || 'کارگر ناشناس'}</b>
            <span style="font-size:12px;font-weight:bold;color:${markerColor};display:block;margin-top:4px;">${worker.position || 'نیروی ساده'}</span>
            ${worker.current_project_name ? `<div style="margin-top:8px;font-size:11px;color:#4b5563;">📍 ${worker.current_project_name}</div>` : ''}
            ${speedHtml}
            ${gpsStatusHtml}
          </div>
        `;
      };

      const buildLiveIcon = () => {
        const badge = gpsStatus.hasIssue
          ? `<span style="position:absolute;top:-14px;right:-6px;font-size:13px;" title="${gpsStatus.label}">⚠️</span>`
          : isOffline
          ? `<span style="position:absolute;top:-12px;right:-5px;font-size:11px;">💤</span>`
          : '';
        return L.divIcon({
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
      };

      if (!workerMarkersRef.current[worker.id]) {
        workerMarkersRef.current[worker.id] = L.marker([worker.latitude, worker.longitude], {
          icon: buildLiveIcon(),
          zIndexOffset: 1000,
        })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(buildLivePopup()))
          .addTo(map);

        markerStateCacheRef.current[worker.id] = {
          isOffline,
          hasIssue: gpsStatus.hasIssue,
          markerColor,
          speedKmh,
          lat: worker.latitude,
          lng: worker.longitude,
        };
      } else {
        const marker = workerMarkersRef.current[worker.id];

        if (prevVisualState.lat !== worker.latitude || prevVisualState.lng !== worker.longitude) {
          marker.setLatLng([worker.latitude, worker.longitude]);
          prevVisualState.lat = worker.latitude;
          prevVisualState.lng = worker.longitude;
        }

        if (hasVisualChanged) {
          marker.setIcon(buildLiveIcon());
          const popup = marker.getPopup();
          if (popup) popup.setContent(buildLivePopup());

          markerStateCacheRef.current[worker.id] = {
            isOffline,
            hasIssue: gpsStatus.hasIssue,
            markerColor,
            speedKmh,
            lat: worker.latitude,
            lng: worker.longitude,
          };
        }
      }
    });
  }, [workers, isHistoryMode]);

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
      filteredTemplates = routeTemplates.filter((rt) => !rt.project);
      filteredFeatures = projectFeatures.filter((pf) => !pf.project);
    } else {
      const targetId = String(selectedProjectId);
      filteredTemplates = routeTemplates.filter((rt) => {
        const pId = rt.project && typeof rt.project === 'object' ? rt.project.id : rt.project;
        return String(pId) === targetId;
      });
      filteredFeatures = projectFeatures.filter((pf) => {
        const pId = pf.project && typeof pf.project === 'object' ? pf.project.id : pf.project;
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
        const correctedPolygon = template.polygon_coordinates.map((pt) => [pt[1], pt[0]]);
        L.polygon(correctedPolygon, { color: '#8B5CF6', weight: 2, fillOpacity: 0.2 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      } else if (template.line_coordinates?.length > 0) {
        const correctedLine = template.line_coordinates.map((pt) => [pt[1], pt[0]]);
        L.polyline(correctedLine, { color: '#10B981', weight: 3 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      } else if (template.multi_line_coordinates?.length > 0) {
        const correctedMultiLine = template.multi_line_coordinates.map((line) =>
          line.map((pt) => [pt[1], pt[0]])
        );
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
    if (outageLineRef.current) mapInstanceRef.current?.removeLayer(outageLineRef.current);
    if (historyMarkerRef.current) mapInstanceRef.current?.removeLayer(historyMarkerRef.current);
    historyLineRef.current = null;
    outageLineRef.current = null;
    historyMarkerRef.current = null;
    historyMarkerIconKeyRef.current = null;
    if (onCloseHistory) onCloseHistory();
  }, [onCloseHistory]);

  const jumpToIssue = useCallback(
    (direction) => {
      if (issueIndices.length === 0) return;
      setIsPlaying(false);
      if (direction === 'next') {
        const nextIdx = issueIndices.find((idx) => idx > clampedIndex);
        setHistoryIndex(nextIdx !== undefined ? nextIdx : issueIndices[0]);
      } else {
        const prevIdx = [...issueIndices].reverse().find((idx) => idx < clampedIndex);
        setHistoryIndex(prevIdx !== undefined ? prevIdx : issueIndices[issueIndices.length - 1]);
      }
    },
    [issueIndices, clampedIndex]
  );

  const bottomControlsPositionClass =
    isHistoryMode && timelineItems.length > 0
      ? 'bottom-[104px] sm:bottom-[108px]'
      : 'bottom-6 sm:bottom-8';

  const currentDurationText = currentItem ? formatDurationFa(currentItem.duration_seconds) : '';
  const currentHasRange =
    currentItem && currentItem.end_timestamp && currentItem.end_timestamp !== currentItem.timestamp;

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
        {isHistoryMode && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[400] max-w-[95vw] sm:max-w-[90vw] bg-gray-900/95 backdrop-blur-md border border-gray-700/60 rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xl">
            {selectedWorker && (
              <span className="hidden md:inline text-xs font-bold text-gray-200 px-2 truncate max-w-[120px]">
                {selectedWorker.full_name}
              </span>
            )}
            <div className="flex overflow-x-auto scrollbar-hide gap-1">
              {timeRangesConfig.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setTimeRange(key);
                    setIsPlaying(false);
                  }}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                    timeRange === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleResetFilter}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg bg-red-500/90 text-white hover:bg-red-600 shrink-0 transition-colors"
            >
              بستن
            </button>
          </div>
        )}

        <div
          className={`absolute top-2 sm:top-4 left-2 sm:left-4 z-[390] px-3 py-1.5 rounded-xl text-xs font-bold border shadow-lg pointer-events-none backdrop-blur-md ${
            isHistoryMode
              ? 'bg-blue-900/80 border-blue-500/50 text-blue-100'
              : connected
              ? 'bg-gray-900/80 border-gray-700/50 text-gray-200'
              : 'bg-red-900/80 border-red-500/50 text-red-100'
          }`}
        >
          {isHistoryMode ? (loadingHistory ? 'در حال دریافت...' : 'حالت تاریخچه') : connected ? 'LIVE' : 'OFFLINE'}
        </div>

        {isHistoryMode && !loadingHistory && timelineItems.length === 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] max-w-[90vw] bg-gray-900/95 border border-amber-500/50 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm">
            <span>
              ⚠️ در بازه <b>{timeRangesConfig.find((r) => r.key === timeRange)?.label}</b> ترددی ثبت نشده است. بازه دیگری را انتخاب کنید.
            </span>
          </div>
        )}

        <div className={`absolute right-2 sm:right-4 z-[390] flex flex-col gap-2 transition-all duration-300 ${bottomControlsPositionClass}`}>
          {isHistoryMode && currentPoint && (
            <button
              onClick={() => {
                setIsFollowingMarker(!isFollowingMarker);
                if (!isFollowingMarker && currentPoint) mapInstanceRef.current?.panTo(currentPoint);
              }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-xl border flex items-center justify-center text-base sm:text-lg backdrop-blur-md transition-all ${
                isFollowingMarker ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/90 border-gray-300 text-gray-600'
              }`}
              title="قفل روی نشانگر"
            >
              🎯
            </button>
          )}

          <div className="flex flex-col shadow-xl rounded-lg sm:rounded-xl overflow-hidden border border-gray-300/50 backdrop-blur-md">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 text-gray-800 border-b border-gray-200 font-bold text-lg sm:text-xl hover:bg-gray-100"
            >
              +
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 text-gray-800 font-bold text-lg sm:text-xl hover:bg-gray-100"
            >
              −
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsSatelliteEnabled(!isSatelliteEnabled)}
          className={`absolute left-2 sm:left-4 z-[390] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-xl border backdrop-blur-md transition-all duration-300 ${bottomControlsPositionClass} ${
            isSatelliteEnabled
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-white/90 text-gray-800 border-gray-300/50'
          }`}
        >
          {isSatelliteEnabled ? 'بستن ماهواره' : 'نقشه ماهواره'}
        </button>

        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: '#e5e7eb' }} />

        {loadingHistory && isHistoryMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] bg-black/85 text-white py-3 px-5 rounded-2xl text-sm flex items-center gap-3 backdrop-blur-md border border-gray-600 shadow-2xl">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-bold">در حال دریافت و پردازش مسیر...</span>
          </div>
        )}

        {isHistoryMode && timelineItems.length > 0 && currentItem && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/60 px-2.5 pt-2 pb-1.5 sm:px-4 sm:pt-2 sm:pb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.55)]">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-bold ${currentItem.meta.bgClass}`}
                >
                  <span>{currentItem.meta.icon}</span>
                  <span>{currentItem.meta.label}</span>
                  <span className="opacity-60">|</span>
                  <span className="font-mono text-[10px] sm:text-[11px]" dir="ltr">
                    {currentHasRange
                      ? `${formatClockOnly(currentItem.timestamp)} → ${formatClockOnly(currentItem.end_timestamp)}`
                      : formatHistoryTime(currentItem.timestamp)}
                  </span>
                  {currentDurationText && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30">
                      {currentDurationText}
                    </span>
                  )}
                </div>

                {issueIndices.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                    <button
                      onClick={() => jumpToIssue('prev')}
                      className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 font-bold transition-colors"
                      title="رخداد قبلی"
                    >
                      ◀ قبلی
                    </button>
                    <span className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                      {issueIndices.length} رخداد
                    </span>
                    <button
                      onClick={() => jumpToIssue('next')}
                      className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 font-bold transition-colors"
                      title="رخداد بعدی"
                    >
                      بعدی ▶
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-[11px] sm:text-xs text-gray-300 leading-none">
                <span className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-white transition-colors ${
                      isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <span>
                    مسافت: <b className="text-emerald-400">{Math.round(currentDistanceMeters)}</b> / {Math.round(totalDistanceMeters)} m
                  </span>
                </span>
                <span className="hidden sm:inline font-mono text-[11px] text-gray-300">
                  {formatHistoryTime(currentItem.timestamp)}
                </span>
                <span>
                  قدم‌ها: <b className="text-amber-400">{Math.round(currentDistanceMeters / 0.75)}</b>
                </span>
              </div>

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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 m-0"
                />

                <div className="absolute w-full h-1.5 bg-gray-700 rounded-full overflow-hidden pointer-events-none z-0">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-75"
                    style={{ width: `${maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 100}%` }}
                  />
                </div>

                {maxIndex > 0 &&
                  issueIndices.map((idx) => {
                    const pos = (idx / maxIndex) * 100;
                    const color = timelineItems[idx]?.meta?.color || '#F59E0B';
                    return (
                      <div
                        key={idx}
                        className="absolute w-1.5 h-2.5 rounded-full pointer-events-none z-10 -translate-x-1/2"
                        style={{ left: `${pos}%`, backgroundColor: color }}
                      />
                    );
                  })}

                <div
                  className="absolute w-3.5 h-3.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.75)] border-2 border-white pointer-events-none transform -translate-x-1/2 transition-all duration-75 z-20"
                  style={{
                    left: `${maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 0}%`,
                    backgroundColor: currentItem.meta.isIssue ? currentItem.meta.color : '#3B82F6',
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 font-mono leading-none" dir="ltr">
                <span>{formatClockOnly(timelineItems[0]?.timestamp)}</span>
                <span className="font-bold text-white bg-gray-800/80 px-1.5 py-0.5 rounded-md border border-gray-600">
                  {clampedIndex + 1} / {timelineItems.length}
                </span>
                <span>{formatClockOnly(timelineItems[maxIndex]?.end_timestamp || timelineItems[maxIndex]?.timestamp)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMap;