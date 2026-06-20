// src/screens/admin/user-details/UserLocationHistory.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import JalaliDatePicker from '../../../components/JalaliDatePicker';
import { fetchUserLocationHistory, clearWorkerInfo } from '../../../features/admin/usersSlice';

const formatHistoryTime = (isoTs) => {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  return d.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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

const historyPointIcon = L.divIcon({
  className: '',
  html: `<div style="background-color: #EF4444; width: 16px; height: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border-radius: 50%;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const GAP_THRESHOLD_MS = 10 * 60 * 1000; // 10 دقیقه

const UserLocationHistory = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { workerInfo, loading } = useSelector((state) => state.admin.users);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const historyLineRef = useRef(null);
  const historyMarkersRef = useRef([]);
  const satelliteLayerRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [isSatelliteEnabled, setIsSatelliteEnabled] = useState(false);

  const fetchHistory = async () => {
    if (!startDate || !endDate) {
      setErrorMessage('لطفاً بازه زمانی را انتخاب کنید');
      return;
    }

    try {
      setErrorMessage('');
      await dispatch(
        fetchUserLocationHistory({
          userId,
          startDate,
          endDate,
        }),
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

  const historyPoints = useMemo(() => {
    if (!workerInfo || loading?.workerInfo) return [];
    return locations.filter((loc) => loc?.latitude && loc?.longitude);
  }, [locations, workerInfo, loading?.workerInfo]);

  const maxIndex = historyPoints.length > 0 ? historyPoints.length - 1 : 0;
  const clampedIndex = Math.min(historyIndex, maxIndex);
  const progressPercent = maxIndex > 0 ? (clampedIndex / maxIndex) * 100 : 0;

  const cumulativeDistances = useMemo(() => {
    if (historyPoints.length === 0) return [];
    const dists = [0];
    let total = 0;

    for (let i = 1; i < historyPoints.length; i++) {
      const p1 = historyPoints[i - 1];
      const p2 = historyPoints[i];
      const timeDiff =
        new Date(p2.timestamp).getTime() -
        new Date(p1.timestamp).getTime();

      if (timeDiff <= GAP_THRESHOLD_MS) {
        total += calculateDistance(
          p1.latitude,
          p1.longitude,
          p2.latitude,
          p2.longitude,
        );
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
        const prevPt = historyPoints[i - 1];
        const timeDiff =
          new Date(pt.timestamp).getTime() -
          new Date(prevPt.timestamp).getTime();

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

  const currentPoint = historyPoints[clampedIndex]
    ? [historyPoints[clampedIndex].latitude, historyPoints[clampedIndex].longitude]
    : null;
  const currentMeta = historyPoints[clampedIndex] || null;

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (historyLineRef.current) {
      map.removeLayer(historyLineRef.current);
      historyLineRef.current = null;
    }

    historyMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    historyMarkersRef.current = [];

    if (visiblePathSegments.length > 0) {
      historyLineRef.current = L.polyline(visiblePathSegments, {
        color: '#EF4444',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
    }

    if (currentPoint && currentMeta) {
      const histSpeed = Math.round((currentMeta.speed || 0) * 3.6);
      const steps = Math.round(currentDistanceMeters / 0.75);

      let gapWarning = '';
      const nextMeta = historyPoints[clampedIndex + 1];
      if (nextMeta) {
        const timeDiffMs =
          new Date(nextMeta.timestamp).getTime() -
          new Date(currentMeta.timestamp).getTime();
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
          <div style="margin-top:4px;">زمان: <span style="font-family:monospace; float:left;">${formatHistoryTime(
            currentMeta.timestamp,
          )}</span></div>
          <div style="margin-top:4px;">سرعت: <span style="font-family:monospace; color:#2563EB; float:left;">${histSpeed} km/h</span></div>
          <div style="margin-top:4px;">طی شده: <span style="font-family:monospace; color:#059669; float:left;">${Math.round(
            currentDistanceMeters,
          )} m</span></div>
          <div style="margin-top:4px;">تعداد قدم: <span style="font-family:monospace; color:#D97706; float:left;">${steps}</span></div>
          ${gapWarning}
        </div>
      `;

      const marker = L.marker(currentPoint, { icon: historyPointIcon })
        .bindPopup(
          L.popup({
            className: 'sharp-popup',
            autoPan: false,
          }).setContent(popupContent),
        )
        .addTo(map);

      historyMarkersRef.current.push(marker);
      map.panTo(currentPoint, { animate: true, duration: 0.25 });
    }
  }, [
    visiblePathSegments,
    currentPoint,
    currentMeta,
    currentDistanceMeters,
    historyPoints,
    clampedIndex,
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !historyLineRef.current || historyPoints.length === 0) return;

    if (historyIndex === 0 && visiblePathSegments.length > 0) {
      const line = historyLineRef.current;
      const bounds = line.getBounds();

      setTimeout(() => {
        const m = mapInstanceRef.current;
        const l = historyLineRef.current;
        if (m && l) {
          m.fitBounds(bounds, { padding: [50, 50] });
        }
      }, 100);

      setTimeout(() => {
        const m = mapInstanceRef.current;
        if (m) m.invalidateSize(true);
      }, 400);
    }
  }, [workerInfo, historyIndex, historyPoints.length, visiblePathSegments.length]);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setHistoryIndex(0);
    setErrorMessage('');
    dispatch(clearWorkerInfo());
  };

  if (errorMessage && !workerInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-red-500 shadow-2xl max-w-md">
          <h3 className="text-2xl font-bold text-red-400 mb-4">
            ❌ {errorMessage}
          </h3>
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

  return (
    <div className="flex flex-col h-screen w-full relative bg-gray-900">
      <style>{`
        .sharp-popup .leaflet-popup-content-wrapper {
          border-radius: 4px !important;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .sharp-popup .leaflet-popup-tip { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Loading Overlay */}
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
          {errorMessage && (
            <p className="text-red-600 text-xs mt-2 font-bold">
              {errorMessage}
            </p>
          )}
        </div>

        {workerInfo && (
          <div className="absolute top-4 left-14 z-[400] backdrop-blur px-3 py-2 flex items-center gap-2 text-xs shadow-lg bg-blue-900/90 border border-blue-400 text-blue-100 rounded">
            <span className="text-lg">👷</span>
            <span className="font-mono font-bold text-sm pt-0.5">
              کد: {workerInfo.worker_code}
            </span>
            {currentMeta && (
              <>
                <span className="text-lg">🕓</span>
                <span className="font-mono font-bold text-sm pt-0.5">
                  {formatHistoryTime(currentMeta.timestamp)}
                </span>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setIsSatelliteEnabled((prev) => !prev)}
          className={`absolute bottom-28 left-4 z-[400] px-3 py-2 rounded shadow-xl font-bold text-xs flex items-center gap-2 transition-all ${
            isSatelliteEnabled
              ? 'bg-blue-600 text-white border-2 border-blue-400'
              : 'bg-white text-gray-800 border-2 border-gray-300'
          }`}
        >
          {isSatelliteEnabled ? '🗺️ بستن ماهواره' : '🛰️ نقشه ماهواره'}
        </button>

        <div className="absolute bottom-28 right-4 z-[400] bg-white/90 text-gray-800 px-2 py-1 border border-gray-300 rounded text-xs font-mono font-bold shadow-md">
          Zoom: {currentZoom}
        </div>

        <div className="absolute bottom-40 right-4 z-[400] flex flex-col shadow-xl rounded overflow-hidden border border-gray-300">
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

        {workerInfo && historyPoints.length === 0 && !loading?.workerInfo && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/90 text-red-300 text-center py-2 text-sm">
            در بازه‌ی انتخاب‌شده هیچ موقعیتی ثبت نشده است.
          </div>
        )}

        {historyPoints.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full z-[400] bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3 pb-6 md:pb-3">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="text-xs text-gray-300">
                  مسافت:{' '}
                  <span className="font-mono font-bold text-green-400">
                    {Math.round(totalDistanceMeters)} m
                  </span>
                </div>
                <div className="text-xs text-gray-300">
                  قدم‌ها:{' '}
                  <span className="font-mono font-bold text-amber-500">
                    {Math.round(totalDistanceMeters / 0.75)}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={maxIndex}
                value={clampedIndex}
                onChange={(e) => setHistoryIndex(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 appearance-none cursor-pointer accent-red-500 rounded"
                style={{
                  background: `linear-gradient(
                    to left,
                    #EF4444 0%,
                    #EF4444 ${progressPercent}%,
                    #374151 ${progressPercent}%,
                    #374151 100%
                  )`,
                }}
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-2 font-mono">
                <span>🏁 شروع</span>
                <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-600">
                  {clampedIndex + 1} / {historyPoints.length}
                </span>
                <span>انتها 🏁</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLocationHistory;
