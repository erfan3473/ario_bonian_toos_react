import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QRCode from 'react-qr-code';

import {
  fetchWorkers,
  updateWorkersBatch,
  cleanupOldWorkers,
  selectVisibleWorkers,
  selectProjectDashboardStats,
} from '../features/workers/workerSlice';

import {
  fetchProjects,
  setSelectedProject,
  fetchProjectGeofence,
  clearGeofence,
} from '../features/projects/projectSlice';

import {
  fetchFeatureIcons,
  fetchRouteTemplates,
  fetchProjectFeatures,
} from '../features/routeMaps/mapRoutesSlice';

import WorkerMap from '../components/WorkerMap';
import WorkerCard from '../components/WorkerCard';
import Loader from '../components/Loader';

const WS_URL = 'wss://www.ariobonyantoos.com/ws/worker/updates/';

const formatTimeAgo = (ts) => {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'هم‌اکنون';
  if (diff < 60) return `${diff} ثانیه پیش`;
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  return `${Math.floor(diff / 86400)} روز پیش`;
};

const WorkerDashboardScreen = () => {
  const dispatch = useDispatch();

  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { status: workerStatus } = useSelector((state) => state.workers);
  const {
    history: { status: historyStatus, data: historyData },
  } = useSelector((state) => state.workers);

  const {
    list: projectsList,
    selectedProjectId,
    loading: projectsLoading,
    geofence: { data: geofenceData },
  } = useSelector((state) => state.projects);

  useEffect(() => {
    dispatch(fetchFeatureIcons());
    dispatch(fetchRouteTemplates());
    dispatch(fetchProjectFeatures());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProjectId && typeof selectedProjectId === 'number') {
      dispatch(fetchProjectGeofence(selectedProjectId));
    } else {
      dispatch(clearGeofence());
    }
  }, [selectedProjectId, dispatch]);

  const visibleWorkers = useSelector(selectVisibleWorkers);
  const dashboardStats = useSelector(selectProjectDashboardStats);

  const [showOfflineWorkers, setShowOfflineWorkers] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [highlightId] = useState(null);
  const [mapSelectedWorkerId, setMapSelectedWorkerId] = useState(null);
  const [zoomTrigger, setZoomTrigger] = useState(0);

  const socketRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timeoutId: null });
  const updatesBufferRef = useRef([]);

  useEffect(() => {
    if (workerStatus === 'idle') dispatch(fetchWorkers());
    if (projectsList.length === 0 && !projectsLoading) dispatch(fetchProjects());
  }, [dispatch, workerStatus, projectsList.length, projectsLoading]);

  useEffect(() => {
    const interval = setInterval(() => dispatch(cleanupOldWorkers()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    let alive = true;
    let flushInterval = null;

    const flushBuffer = () => {
      if (updatesBufferRef.current.length > 0) {
        const batch = [...updatesBufferRef.current];
        updatesBufferRef.current = [];
        dispatch(updateWorkersBatch(batch));
      }
    };

    const connect = () => {
      if (!alive || paused) return;
      if (socketRef.current) socketRef.current.close();

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        reconnectRef.current.attempts = 0;
        flushInterval = setInterval(flushBuffer, 500);
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === 'initial_snapshot' && data.workers) {
            dispatch(updateWorkersBatch(data.workers));
            return;
          }

          if (
            data.type === 'heartbeat_update' ||
            data.type === 'worker_location_update' ||
            data.id ||
            data.worker_id
          ) {
            updatesBufferRef.current.push(data);
          }
        } catch (_) {}
      };

      socket.onclose = () => {
        if (alive) {
          setConnected(false);
          clearInterval(flushInterval);
          if (!paused) {
            const timeout = Math.min(30000, 1000 * 2 ** reconnectRef.current.attempts++);
            reconnectRef.current.timeoutId = setTimeout(connect, timeout);
          }
        }
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      alive = false;
      if (socketRef.current) socketRef.current.close();
      clearInterval(flushInterval);
      clearTimeout(reconnectRef.current.timeoutId);
    };
  }, [paused, dispatch]);

  const finalWorkers = useMemo(() => {
    if (!visibleWorkers || visibleWorkers.length === 0) return [];
    let list = visibleWorkers;
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (w) =>
          (w.full_name || '').toLowerCase().includes(q) ||
          (w.current_project_name || '').toLowerCase().includes(q) ||
          String(w.user_id || '').includes(q)
      );
    }

    if (!showOfflineWorkers) list = list.filter((w) => !w.stale);

    return [...list].sort((a, b) => {
      if (a.stale !== b.stale) return a.stale ? 1 : -1;
      if (sortBy === 'recent') return (b.lastUpdate || 0) - (a.lastUpdate || 0);
      return (a.full_name || '').localeCompare(b.full_name || '', 'fa');
    });
  }, [visibleWorkers, search, sortBy, showOfflineWorkers]);

  const currentProjectStats = useMemo(() => {
    if (selectedProjectId) {
      return (
        dashboardStats.projects[selectedProjectId] || {
          name: 'ناشناس',
          totalWorkers: 0,
          activeWorkers: 0,
        }
      );
    }
    return {
      name: 'نمای کلی (همه پروژه‌ها)',
      totalWorkers: dashboardStats.globalStats.totalWorkers,
      activeWorkers: dashboardStats.globalStats.activeWorkers,
    };
  }, [dashboardStats, selectedProjectId]);

  const handlePrintQR = () => {
    const qrElement = document.getElementById('printable-qr-area');
    if (!qrElement) {
      alert('خطا: QR Code یافت نشد. لطفا مودال را باز نگه دارید.');
      return;
    }

    const qrSvg = qrElement.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>چاپ QR Code - ${currentProjectStats.name}</title>
        <style>
          body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family:'Tahoma',sans-serif; }
          h1 { margin-bottom:30px; font-size:28px; text-align:center; border-bottom:2px solid #000; padding-bottom:10px; }
          .qr-box { padding:30px; border:4px solid black; display:flex; justify-content:center; align-items:center; }
          svg { width:400px !important; height:400px !important; }
          .footer { margin-top:20px; font-size:16px; color:#333; font-weight:bold; }
          @media print { @page { margin:0; size:A4 portrait; } body { -webkit-print-color-adjust: exact; } header, footer { display:none; } }
        </style>
      </head>
      <body>
        <h1>پروژه: ${currentProjectStats.name}</h1>
        <div class="qr-box">${qrSvg}</div>
        <p class="footer">برای ورود به پروژه، کد را با اپلیکیشن اسکن کنید.</p>
        <script>window.onload=function(){setTimeout(()=>{window.print();},500);}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'
    }`}>
      {!connected && !paused && (
        <div className="bg-yellow-600 border-b border-yellow-500 text-white px-4 py-2 flex justify-center items-center gap-3 animate-pulse">
          <span className="font-bold text-sm">اتصال قطع است. تلاش برای اتصال مجدد...</span>
        </div>
      )}

      <div className={`w-full h-[55vh] sm:h-[65vh] md:h-[75vh] min-h-[400px] border-b z-10 relative ${
        isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-white'
      }`}>
        <WorkerMap
          workers={finalWorkers}
          selectedWorkerId={mapSelectedWorkerId}
          zoomTrigger={zoomTrigger}
          workerHistory={historyData[mapSelectedWorkerId] || []}
          loadingHistory={historyStatus === 'loading'}
          projectGeofence={geofenceData?.boundary_coordinates}
          connected={connected}
          selectedProjectId={selectedProjectId}
          onCloseHistory={() => setMapSelectedWorkerId(null)}
        />
      </div>

      <div className="flex-1 p-3 sm:p-4 md:p-6 container mx-auto">
        <div className={`flex flex-col gap-3 mb-5 border rounded-xl p-3 sm:p-4 ${
          isDark ? 'bg-gray-900/70 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
              <select
                className={`w-full sm:w-72 py-2.5 px-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none font-medium ${
                  isDark
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}
                value={selectedProjectId ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') dispatch(setSelectedProject(null));
                  else if (value === 'uncategorized') dispatch(setSelectedProject('uncategorized'));
                  else dispatch(setSelectedProject(Number(value)));
                  setMapSelectedWorkerId(null);
                }}
              >
                <option value="">🌍 نمای کلی سازمان</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.name}
                  </option>
                ))}
                <option value="uncategorized">⚠️ بدون پروژه</option>
              </select>

              {selectedProjectId && selectedProjectId !== 'uncategorized' && (
                <button
                  onClick={() => setShowQRModal(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
                >
                  QR ورود
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2 w-full xl:w-auto">
              <button
                onClick={() => setPaused(!paused)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  paused
                    ? 'bg-yellow-600 text-white'
                    : isDark
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {paused ? '▶ ادامه' : '⏸ توقف'}
              </button>

              <button
                onClick={() => {
                  dispatch(fetchWorkers());
                  dispatch(fetchProjects());
                  dispatch(fetchRouteTemplates());
                  dispatch(fetchProjectFeatures());
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                ⟳ بازخوانی
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className={`flex flex-col gap-3 p-3 sm:p-4 rounded-xl border ${
              isDark ? 'bg-gray-900/70 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-base sm:text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  👷 پرسنل فعال
                  <span className="mr-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {finalWorkers.length}
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  placeholder="جستجو نام، پروژه، کد..."
                  className={`sm:col-span-2 border px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDark
                      ? 'bg-gray-950 border-gray-700 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`border px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDark
                      ? 'bg-gray-950 border-gray-700 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="name">مرتب‌سازی: الفبا</option>
                  <option value="recent">مرتب‌سازی: زمان آپدیت</option>
                </select>
              </div>

              <label className={`inline-flex w-fit items-center gap-2 text-sm cursor-pointer select-none px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-950 border-gray-700 text-gray-300'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}>
                <input
                  type="checkbox"
                  checked={showOfflineWorkers}
                  onChange={(e) => setShowOfflineWorkers(e.target.checked)}
                  className="accent-blue-500"
                />
                نمایش آفلاین‌ها
              </label>
            </div>

            {workerStatus === 'loading' ? (
              <Loader />
            ) : (
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 min-h-[200px]">
                {finalWorkers.length === 0 ? (
                  <div className={`col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl ${
                    isDark ? 'text-gray-500 border-gray-800' : 'text-gray-500 border-gray-300'
                  }`}>
                    <p>هیچ نیرویی با این مشخصات یافت نشد.</p>
                  </div>
                ) : (
                  finalWorkers.map((w) => (
                    <WorkerCard
                      key={w.id}
                      worker={w}
                      highlight={highlightId === w.id}
                      selected={mapSelectedWorkerId === w.id}
                      onClick={(id) => {
                        const newId = id === mapSelectedWorkerId ? null : id;
                        setMapSelectedWorkerId(newId);
                        if (newId) setZoomTrigger((prev) => prev + 1);
                      }}
                      lastSeen={formatTimeAgo(w.lastUpdate)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6 h-fit lg:sticky lg:top-6">
            <div className={`p-4 sm:p-5 rounded-xl border relative overflow-hidden ${
              isDark ? 'bg-gray-900/70 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
              <h3 className={`text-xs mb-4 uppercase tracking-wider font-bold ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                وضعیت: {currentProjectStats.name}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentProjectStats.totalWorkers}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>کل پرسنل</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                  <div className="text-2xl sm:text-3xl font-extrabold text-green-500">
                    {currentProjectStats.activeWorkers}
                  </div>
                  <div className="text-xs text-green-600 mt-1">حاضر در شیفت</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showQRModal && selectedProjectId && selectedProjectId !== 'uncategorized' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className={`border rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md relative ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              className={`absolute top-2 left-3 text-2xl leading-none ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ×
            </button>

            <h2 className={`text-base sm:text-lg font-bold mb-4 text-center pr-5 ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              QR ورود: {currentProjectStats.name}
            </h2>

            <div id="printable-qr-area" className="flex justify-center mb-4">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-gray-950 border-gray-700' : 'bg-gray-50 border-gray-300'
              }`}>
                <QRCode
                  value={JSON.stringify({
                    project_id: selectedProjectId,
                    type: 'project_join',
                  })}
                  fgColor={isDark ? '#F9FAFB' : '#111827'}
                  bgColor={isDark ? '#111827' : '#FFFFFF'}
                  size={180}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                این کد را برای ورود کارگران به پروژه چاپ کنید.
              </span>
              <button
                onClick={handlePrintQR}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
              >
                چاپ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboardScreen;
