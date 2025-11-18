import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWorkers,
  fetchProjects,
  updateWorkerLocation,
  cleanupOldWorkers,
  setSelectedProject,
  selectVisibleWorkers,
  selectProjectDashboardStats
} from '../features/workers/workerSlice';

import WorkerMap from '../components/WorkerMap';
import WorkerCard from '../components/WorkerCard';
import Loader from '../components/Loader';
import Message from '../components/Message';

// تنظیمات WebSocket
const WS_URL = 'ws://127.0.0.1:8000/ws/worker/updates/';

const formatTimeAgo = (ts) => {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'الان';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const WorkerDashboardScreen = () => {
  const dispatch = useDispatch();

  // 1) دریافت داده‌ها از Redux
  const {
    status: workerStatus,
    error,
    history: { status: historyStatus, data: historyData },
    projects: { list: projectsList, selectedProjectId }
  } = useSelector((state) => state.workers);

  // دریافت داده‌های محاسبه شده (Derived State)
  const visibleWorkersRedux = useSelector(selectVisibleWorkers);
  const dashboardStats = useSelector(selectProjectDashboardStats);

  // 2) State های محلی (Local State)
  const [showOfflineWorkers, setShowOfflineWorkers] = useState(false);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [highlightId, setHighlightId] = useState(null);
  const [mapSelectedWorkerId, setMapSelectedWorkerId] = useState(null);

  const socketRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timeoutId: null });
  const lastSeenRef = useRef(new Map());

  // 3) دریافت اطلاعات اولیه
  useEffect(() => {
    if (workerStatus === 'idle') {
      dispatch(fetchWorkers());
      dispatch(fetchProjects()); // دریافت لیست پروژه‌ها
    }
  }, [workerStatus, dispatch]);

  // 4) تایمر پاکسازی (60 ثانیه)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(cleanupOldWorkers());
    }, 60_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // 5) WebSocket
  useEffect(() => {
    let alive = true;

    const connect = () => {
      if (!alive || paused) return;
      setConnected(false);
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectRef.current.attempts = 0;
        setConnected(true);
        console.log('[WS] connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) return; // پیام سیستمی

          if (data && (data.id || data.worker_id)) {
            const workerId = data.id || data.worker_id;
            const now = Date.now();
            lastSeenRef.current.set(workerId, now);

            if (!paused) {
              dispatch(updateWorkerLocation(data));
            }
            setHighlightId(workerId);
            setTimeout(() => setHighlightId(null), 1500);
          }
        } catch (err) {
          console.error('[WS] error', err);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (alive && !paused) {
          const attempts = reconnectRef.current.attempts + 1;
          reconnectRef.current.attempts = attempts;
          const timeout = Math.min(30000, 1000 * 2 ** attempts);
          reconnectRef.current.timeoutId = setTimeout(connect, timeout);
        }
      };
    };

    connect();

    return () => {
      alive = false;
      if (socketRef.current) socketRef.current.close();
      if (reconnectRef.current.timeoutId) clearTimeout(reconnectRef.current.timeoutId);
    };
  }, [paused, dispatch]);

  // 6) فیلترینگ نهایی (ترکیب فیلتر پروژه + سرچ + آفلاین)
  const finalVisibleWorkers = useMemo(() => {
    // لیست اولیه که بر اساس پروژه فیلتر شده (از سلکتور)
    let list = visibleWorkersRedux;
    
    const q = (search || '').trim().toLowerCase();

    // فیلتر سرچ متنی
    if (q) {
      list = list.filter((w) => {
        const name = (w.name || '').toLowerCase();
        const pos = (w.position || '').toLowerCase();
        return name.includes(q) || pos.includes(q) || String(w.id) === q;
      });
    }

    // فیلتر آنلاین/آفلاین
    if (!showOfflineWorkers) {
      list = list.filter((w) => !w.stale);
    }

    // مرتب‌سازی
    if (sortBy === 'recent') {
      list = list.slice().sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0));
    } else {
      list = list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return list;
  }, [visibleWorkersRedux, search, sortBy, showOfflineWorkers]);

  // آمار لحظه‌ای برای سایدبار (بر اساس پروژه انتخاب شده یا کل)
  const currentStats = useMemo(() => {
     if (selectedProjectId) {
         const pStats = dashboardStats.projects[selectedProjectId];
         return pStats ? {
             total: pStats.totalWorkers,
             online: pStats.activeWorkers,
             label: pStats.name
         } : { total: 0, online: 0, label: 'نامشخص' };
     }
     return {
         total: dashboardStats.globalStats.totalWorkers,
         online: dashboardStats.globalStats.activeWorkers,
         label: 'همه پروژه‌ها'
     };
  }, [dashboardStats, selectedProjectId]);

  return (
    <div className="p-6 container mx-auto">
      
      {/* 🗺️ نقشه */}
      <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
        <WorkerMap
          workers={finalVisibleWorkers}
          selectedWorkerId={mapSelectedWorkerId}
          workerHistory={historyData[mapSelectedWorkerId] || []}
          loadingHistory={historyStatus === 'loading'}
        />
      </div>

      {/* 🎛️ نوار ابزار */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-200">
          مانیتورینگ: <span className="text-blue-400">{currentStats.label}</span>
        </h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* انتخاب پروژه */}
          <select 
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 text-sm focus:border-blue-500"
            value={selectedProjectId || ''}
            onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                dispatch(setSelectedProject(val));
            }}
          >
            <option value="">🌍 همه پروژه‌ها</option>
            {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="uncategorized">⚠️ بدون پروژه</option>
          </select>

          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`}></div>
          
          <button
            onClick={() => setPaused(!paused)}
            className={`px-3 py-1 rounded text-white text-sm ${paused ? 'bg-green-600' : 'bg-yellow-600'}`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          
          <button
            onClick={() => { dispatch(fetchWorkers()); dispatch(fetchProjects()); }}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 🔍 فیلتر و جستجو */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 text-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 text-sm"
        >
          <option value="name">حروف الفبا</option>
          <option value="recent">آخرین فعالیت</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showOfflineWorkers}
            onChange={(e) => setShowOfflineWorkers(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600"
          />
          نمایش آفلاین‌ها
        </label>
      </div>

      {/* 📋 لیست کارت‌ها */}
      {workerStatus === 'loading' ? (
        <Loader />
      ) : workerStatus === 'failed' ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* ستون اصلی کارت‌ها */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {finalVisibleWorkers.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500 border border-gray-700 rounded-lg border-dashed">
                   نیرویی با این مشخصات یافت نشد.
                </div>
              ) : (
                finalVisibleWorkers.map((w) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    highlight={highlightId === w.id}
                    selected={mapSelectedWorkerId === w.id}
                    onClick={(id) => setMapSelectedWorkerId(id === mapSelectedWorkerId ? null : id)}
                    lastSeen={formatTimeAgo(lastSeenRef.current.get(w.id))}
                  />
                ))
              )}
            </div>
          </div>

          {/* 📊 سایدبار آمار */}
          <aside className="bg-gray-800 p-4 rounded-lg h-fit sticky top-4">
            <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">
              وضعیت کلی
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-700 p-2 rounded text-center">
                    <span className="block text-xs text-gray-400">کل نیروها</span>
                    <span className="text-xl font-bold text-white">{currentStats.total}</span>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                    <span className="block text-xs text-gray-400">آنلاین</span>
                    <span className="text-xl font-bold text-green-400">{currentStats.online}</span>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-xs text-gray-400 mb-2">پروژه‌های فعال:</h4>
                <div className="flex flex-wrap gap-1">
                    {projectsList.map(p => {
                        const stats = dashboardStats.projects[p.id];
                        const isActive = stats && stats.activeWorkers > 0;
                        return (
                            <span 
                                key={p.id} 
                                onClick={() => dispatch(setSelectedProject(p.id))}
                                className={`text-[10px] px-2 py-1 rounded cursor-pointer border ${
                                    selectedProjectId === p.id 
                                    ? 'bg-blue-900 border-blue-500 text-white' 
                                    : isActive 
                                        ? 'bg-gray-700 border-green-800 text-gray-300' 
                                        : 'bg-gray-700 border-transparent text-gray-500'
                                }`}
                            >
                                {p.name} ({stats?.activeWorkers || 0})
                            </span>
                        )
                    })}
                </div>
            </div>

            <div>
              <h4 className="text-xs text-gray-400 mb-1">آخرین فعالیت‌ها:</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {Array.from(lastSeenRef.current.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([id, ts]) => {
                      // پیدا کردن نام کارگر برای نمایش زیباتر
                      const wName = state => state.workers.allWorkers[id]?.name || `#${id}`;
                      // نکته: اینجا چون هوک نیست نمیشه مستقیم سلکت کرد، برای سادگی ID میزنیم
                      // یا اینکه یه ممپ نیم بسازیم. فعلا فرمت ساده:
                      return (
                        <li key={id} className="text-[11px] text-gray-300 flex justify-between">
                          <span>کارگر #{id}</span>
                          <span className="text-gray-500">{formatTimeAgo(ts)}</span>
                        </li>
                      );
                  })}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboardScreen;