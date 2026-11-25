import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import JalaliDatePicker from '../../../components/JalaliDatePicker';
import { fetchUserLocationHistory, clearWorkerInfo } from '../../../features/admin/usersSlice';

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
      color: '#F59E0B',
      bgClass: 'bg-amber-950/80 border-amber-500/50 text-amber-200',
      icon: '⚠️',
      isIssue: true,
    };
  }
  return {
    code: 'OK',
    label: 'موقعیت معتبر',
    color: '#10B981',
    bgClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
    icon: '●',
    isIssue: false,
  };
};

const historyNormalIcon = L.divIcon({
  className: '',
  html: `<div style="background-color:#EF4444;width:16px;height:16px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);border-radius:50%;"></div>`,
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

const GAP_THRESHOLD_MS = 10 * 60 * 1000;
const MAX_SPEED_KMH = 150;

const UserLocationHistory = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { workerInfo, loading } = useSelector((state) => state.admin.users);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const historyLineRef = useRef(null);
  const outageLineRef = useRef(null);
  const historyMarkerRef = useRef(null);
  const historyMarkerIconKeyRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [isSatelliteEnabled, setIsSatelliteEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchHistory = async () => {
    if (!startDate || !endDate) {
      setErrorMessage('لطفاً بازه زمانی را انتخاب کنید');
      return;
    }

    try {
      setErrorMessage('');
      setIsPlaying(false);
      hasFittedBoundsRef.current = false;
      await dispatch(
        fetchUserLocationHistory({
          userId,
          startDate,
          endDate,
        })
      ).unwrap();

      setHistoryIndex(0);
    } catch (err) {
      const msg = err?.error || err?.detail || err || 'خطای نامشخص';
      setErrorMessage(msg);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = new L.Map(mapContainerRef.current, {
      key: 'web.83d364e4d58e4b1e966567753524cdf8',
      maptype: 'neshan',
      poi: false,
      traffic: false,
      center: [35.6892, 51.389],
      zoom: 10,
      zoomControl: false,
    });

    const googleOfflineLayer = L.tileLayer('/media/tiles/{z}/{x}/{y}.png', {
      minZoom: 10,
      maxZoom: 19,
      attribution: 'نقشه ماهواره‌ای گوگل (آفلاین)',
      errorTileUrl:
        'data:application/octet-stream;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    });
    satelliteLayerRef.current = googleOfflineLayer;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

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
      if (!map.hasLayer(satelliteLayerRef.current)) {
        map.addLayer(satelliteLayerRef.current);
      }
    } else {
      if (map.hasLayer(satelliteLayerRef.current)) {
        map.removeLayer(satelliteLayerRef.current);
      }
    }
  }, [isSatelliteEnabled]);

  const locations = workerInfo?.locations || [];

  const { timelineItems, cumulativeDistances, issueIndices } = useMemo(() => {
    if (!workerInfo || loading?.workerInfo || !Array.isArray(locations) || locations.length === 0) {
      return { timelineItems: [], cumulativeDistances: [], issueIndices: [] };
    }

    const baseItems = locations.map((loc) => {
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
          withGaps.push({
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
          });
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
  }, [locations, workerInfo, loading?.workerInfo]);

  const maxIndex = timelineItems.length > 0 ? timelineItems.length - 1 : 0;
  const clampedIndex = Math.min(historyIndex, maxIndex);
  const progressPercent = maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 100;
  const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1] || 0;
  const currentDistanceMeters = cumulativeDistances[clampedIndex] || 0;
  const currentItem = timelineItems[clampedIndex] || null;
  const currentPoint =
    currentItem && currentItem.anchorLat !== null && currentItem.anchorLng !== null
      ? [currentItem.anchorLat, currentItem.anchorLng]
      : null;

  const { visibleSegments, visibleOutageConnectors, allValidCoords } = useMemo(() => {
    if (timelineItems.length === 0) {
      return { visibleSegments: [], visibleOutageConnectors: [], allValidCoords: [] };
    }

    const segments = [];
    const connectors = [];
    const allCoords = [];
    let currentSeg = [];
    let lastValid = null;
    let hadGapSinceLastValid = false;

    for (let i = 0; i < timelineItems.length; i++) {
      if (timelineItems[i].hasCoords) {
        allCoords.push([timelineItems[i].latitude, timelineItems[i].longitude]);
      }
    }

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
    return { visibleSegments: segments, visibleOutageConnectors: connectors, allValidCoords: allCoords };
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
        color: '#EF4444',
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
        opacity: 0.75,
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
        <div style="font-family:Tahoma,sans-serif;font-size:12px;min-width:165px;direction:rtl;">
          <div style="font-weight:bold;color:#DC2626;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px;text-align:center;">📍 وضعیت در این لحظه</div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>زمان:</span> <b style="font-family:monospace;font-size:11px;">${formatHistoryTime(currentItem.timestamp)}</b></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>سرعت:</span> <b style="color:#2563EB;">${histSpeed} km/h</b></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>طی شده:</span> <b style="color:#059669;">${Math.round(currentDistanceMeters)} m</b></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>تعداد قدم:</span> <b style="color:#D97706;">${steps}</b></div>
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

    if (hasFittedBoundsRef.current) {
      map.panTo(currentPoint, { animate: !isPlaying, duration: 0.2 });
    }
  }, [currentPoint, currentItem, currentDistanceMeters, isPlaying]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || allValidCoords.length === 0 || hasFittedBoundsRef.current) return;

    const bounds = L.latLngBounds(allValidCoords);
    if (bounds.isValid()) {
      hasFittedBoundsRef.current = true;
      setTimeout(() => {
        const m = mapInstanceRef.current;
        if (m) {
          m.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }, 100);
      setTimeout(() => {
        const m = mapInstanceRef.current;
        if (m) m.invalidateSize(true);
      }, 400);
    }
  }, [allValidCoords]);

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

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setHistoryIndex(0);
    setIsPlaying(false);
    setErrorMessage('');
    hasFittedBoundsRef.current = false;
    if (historyLineRef.current) mapInstanceRef.current?.removeLayer(historyLineRef.current);
    if (outageLineRef.current) mapInstanceRef.current?.removeLayer(outageLineRef.current);
    if (historyMarkerRef.current) mapInstanceRef.current?.removeLayer(historyMarkerRef.current);
    historyLineRef.current = null;
    outageLineRef.current = null;
    historyMarkerRef.current = null;
    historyMarkerIconKeyRef.current = null;
    dispatch(clearWorkerInfo());
  };

  if (errorMessage && !workerInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-red-500 shadow-2xl max-w-md">
          <h3 className="text-2xl font-bold text-red-400 mb-4">❌ {errorMessage}</h3>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const currentDurationText = currentItem ? formatDurationFa(currentItem.duration_seconds) : '';
  const currentHasRange =
    currentItem && currentItem.end_timestamp && currentItem.end_timestamp !== currentItem.timestamp;

  return (
    <div className="flex flex-col h-screen w-full relative bg-gray-900">
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        .sharp-popup .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .sharp-popup .leaflet-popup-tip { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {loading?.workerInfo && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-bold">در حال بارگذاری...</p>
          </div>
        </div>
      )}

      <div className="relative w-full h-full z-0 isolate">
        <div className="absolute top-4 right-4 z-[400] bg-white p-4 rounded-lg shadow-2xl border border-gray-300 max-w-sm">
          <div className="flex flex-col gap-3">
            <JalaliDatePicker
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              label="از تاریخ"
            />
            <JalaliDatePicker
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              label="تا تاریخ"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={fetchHistory}
                disabled={!startDate || !endDate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded text-sm transition"
              >
                نمایش
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm transition"
              >
                پاک کردن
              </button>
            </div>
          </div>
          {errorMessage && <p className="text-red-600 text-xs mt-2 font-bold">{errorMessage}</p>}
        </div>

        {workerInfo && (
          <div className="absolute top-4 left-14 z-[400] backdrop-blur px-3 py-2 flex items-center gap-2 text-xs shadow-lg bg-blue-900/90 border border-blue-400 text-blue-100 rounded">
            <span className="text-lg">👷</span>
            <span className="font-mono font-bold text-sm pt-0.5">کد: {workerInfo.worker_code}</span>
            {currentItem && (
              <>
                <span className="text-lg">🕓</span>
                <span className="font-mono font-bold text-sm pt-0.5">
                  {formatClockOnly(currentItem.timestamp)}
                </span>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setIsSatelliteEnabled((prev) => !prev)}
          className={`absolute bottom-36 left-4 z-[400] px-3 py-2 rounded shadow-xl font-bold text-xs flex items-center gap-2 transition-all ${
            isSatelliteEnabled
              ? 'bg-blue-600 text-white border-2 border-blue-400'
              : 'bg-white text-gray-800 border-2 border-gray-300'
          }`}
        >
          {isSatelliteEnabled ? '🗺️ بستن ماهواره' : '🛰️ نقشه ماهواره'}
        </button>

        <div className="absolute bottom-36 right-4 z-[400] bg-white/90 text-gray-800 px-2 py-1 border border-gray-300 rounded text-xs font-mono font-bold shadow-md">
          Zoom: {currentZoom}
        </div>

        <div className="absolute bottom-48 right-4 z-[400] flex flex-col shadow-xl rounded overflow-hidden border border-gray-300">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 bg-white text-gray-800 border-b border-gray-200 font-bold text-xl hover:bg-gray-100 flex justify-center items-center focus:outline-none"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 bg-white text-gray-800 font-bold text-2xl hover:bg-gray-100 flex justify-center items-center focus:outline-none pb-1"
          >
            -
          </button>
        </div>

        <div
          ref={mapContainerRef}
          style={{
            height: '100%',
            width: '100%',
            zIndex: 0,
            backgroundColor: '#f3f4f6',
          }}
        />

        {workerInfo && timelineItems.length === 0 && !loading?.workerInfo && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/90 text-red-300 text-center py-2 text-sm">
            در بازه‌ی انتخاب‌شده هیچ موقعیت یا وضعیتی ثبت نشده است.
          </div>
        )}

        {timelineItems.length > 0 && currentItem && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3 pb-6 md:pb-3">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${currentItem.meta.bgClass}`}
                >
                  <span>{currentItem.meta.icon}</span>
                  <span>{currentItem.meta.label}</span>
                  <span className="opacity-60">|</span>
                  <span className="font-mono text-[11px]" dir="ltr">
                    {currentHasRange
                      ? `${formatClockOnly(currentItem.timestamp)} → ${formatClockOnly(currentItem.end_timestamp)}`
                      : formatHistoryTime(currentItem.timestamp)}
                  </span>
                  {currentDurationText && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                      {currentDurationText}
                    </span>
                  )}
                </div>

                {issueIndices.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      onClick={() => jumpToIssue('prev')}
                      className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 font-bold"
                    >
                      ◀ قبلی
                    </button>
                    <span className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                      {issueIndices.length} رخداد
                    </span>
                    <button
                      onClick={() => jumpToIssue('next')}
                      className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 font-bold"
                    >
                      بعدی ▶
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-white transition-colors ${
                      isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <span>
                    مسافت:{' '}
                    <span className="font-mono font-bold text-green-400">
                      {Math.round(currentDistanceMeters)} / {Math.round(totalDistanceMeters)} m
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-300">
                  قدم‌ها:{' '}
                  <span className="font-mono font-bold text-amber-500">
                    {Math.round(currentDistanceMeters / 0.75)}
                  </span>
                </div>
              </div>

              <div className="relative flex items-center w-full h-4 cursor-pointer" dir="ltr">
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
                    className="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-75"
                    style={{ width: `${progressPercent}%` }}
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
                  className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none transform -translate-x-1/2 z-20"
                  style={{
                    left: `${maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 0}%`,
                    backgroundColor: currentItem.meta.isIssue ? currentItem.meta.color : '#EF4444',
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 font-mono" dir="ltr">
                <span>{formatClockOnly(timelineItems[0]?.timestamp)}</span>
                <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-600">
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

export default UserLocationHistory;