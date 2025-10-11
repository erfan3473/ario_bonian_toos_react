// ===== FILE: src/screens/WorkerDashboardScreen.jsx =====
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listWorkers, updateWorkerLocation, cleanupOldWorkers } from '../actions/workerActions';
import WorkerMap from '../components/WorkerMap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import WorkerCard from '../components/WorkerCard';

const WS_URL = 'ws://127.0.0.1:8000/ws/worker/updates/';

const formatTimeAgo = (ts) => {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'now';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const WorkerDashboardScreen = () => {
  const dispatch = useDispatch();
  const { loading, error, allWorkers, onlineWorkerIds } = useSelector((state) => state.workerList || {});
  const [showOfflineWorkers, setShowOfflineWorkers] = useState(false);
  const socketRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timeoutId: null });
  const lastSeenRef = useRef(new Map());
  const [, setTick] = useState(0);

  const [workerLocations, setWorkerLocations] = useState({});
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [highlightId, setHighlightId] = useState(null);
  const [mapSelectedWorkerId, setMapSelectedWorkerId] = useState(null);

  useEffect(() => {
    dispatch(listWorkers());
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(cleanupOldWorkers());
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

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
          if (data && (data.id || data.worker_id)) {
            const workerId = data.id || data.worker_id;
            const now = Date.now();

            lastSeenRef.current.set(workerId, now);

            setWorkerLocations((prev) => ({
              ...prev,
              [workerId]: {
                ...(prev[workerId] || {}),
                ...data,
                lastUpdate: now,
              },
            }));

            setTick((t) => t + 1);

            if (!paused) {
              dispatch(updateWorkerLocation(data));
            }

            setHighlightId(workerId);
            setTimeout(() => setHighlightId(null), 1800);
          } else if (data && data.message) {
            console.log('[WS]', data.message);
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };

      socket.onclose = (e) => {
        setConnected(false);
        console.log('[WS] closed', e);
        if (alive && !paused) {
          const attempts = reconnectRef.current.attempts + 1;
          reconnectRef.current.attempts = attempts;
          const timeout = Math.min(30000, 1000 * 2 ** attempts);
          reconnectRef.current.timeoutId = setTimeout(connect, timeout);
          console.log('[WS] reconnecting in', timeout);
        }
      };

      socket.onerror = (err) => {
        console.error('[WS] error', err);
        try {
          socket.close();
        } catch {
          // ignore
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

  const togglePause = () => {
    setPaused((p) => {
      const newP = !p;
      if (newP && socketRef.current) socketRef.current.close();
      else if (!newP) {
        reconnectRef.current.attempts = 0;
      }
      return newP;
    });
  };

  // WorkerDashboardScreen.jsx - تغییر بخش visibleWorkers
const visibleWorkers = useMemo(() => {
  // استفاده از همه کارگرها به جای فقط آنلاین‌ها
  const allWorkerIds = allWorkers ? Object.keys(allWorkers) : [];
  const q = (search || '').trim().toLowerCase();

  let list = allWorkerIds
    .map((id) => {
      const server = allWorkers[id] || {};
      const local = workerLocations[id] || {};
      const merged = {
        id: parseInt(id),
        name: server.name ?? local.name ?? `#${id}`,
        position: server.position ?? local.position ?? '',
        latitude: (local.latitude ?? server.latitude) ?? null,
        longitude: (local.longitude ?? server.longitude) ?? null,
        lastUpdate: Math.max(server.lastUpdate || 0, local.lastUpdate || 0),
        stale: server.stale, // استفاده از وضعیت stale از reducer
        ...server,
        ...local,
      };
      return merged;
    })
    .filter(Boolean);

  if (q) {
    list = list.filter((w) => {
      const name = (w.name || '').toLowerCase();
      const pos = (w.position || '').toLowerCase();
      return name.includes(q) || pos.includes(q) || String(w.id) === q;
    });
  }

  // فیلتر کردن بر اساس وضعیت آنلاین/آفلاین
  if (!showOfflineWorkers) {
    list = list.filter(w => !w.stale);
  }

  if (sortBy === 'recent') {
    list.sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0));
  } else {
    list.sort((a, b) => ('' + (a.name || '')).localeCompare(b.name || ''));
  }

  return list;
}, [allWorkers, workerLocations, search, sortBy, showOfflineWorkers]);

  const handleRefresh = () => dispatch(listWorkers());

  const downloadCSV = () => {
    const arr = visibleWorkers.map((w) => ({
      id: w.id,
      name: w.name,
      position: w.position,
      latitude: w.latitude,
      longitude: w.longitude,
    }));
    if (arr.length === 0) return;
    const csv = [Object.keys(arr[0] || {}).join(','), ...arr.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onlineCount = useMemo(() => {
    if (!onlineWorkerIds) return 0;
    if (typeof onlineWorkerIds.size === 'number') return onlineWorkerIds.size;
    if (Array.isArray(onlineWorkerIds)) return [...new Set(onlineWorkerIds)].length;
    if (typeof onlineWorkerIds === 'object') return Object.keys(onlineWorkerIds).length;
    return 0;
  }, [onlineWorkerIds]);

  return (
    <div className="p-6 container mx-auto">
      <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
        <WorkerMap workers={visibleWorkers} selectedWorkerId={mapSelectedWorkerId} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-200">رصد زنده نیرو های کار</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">{connected ? 'Live' : paused ? 'Paused' : 'Disconnected'}</span>
          </div>
          <button onClick={togglePause} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={handleRefresh} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">
            Refresh
          </button>
          <button onClick={downloadCSV} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">
            Export CSV
          </button>
        </div>
      </div>

      
<div className="mb-4 flex gap-3 items-center">
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by name, position or id"
    className="flex-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
  />
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
  >
    <option value="name">Sort: Name</option>
    <option value="recent">Sort: Most recent</option>
  </select>
  <label className="flex items-center gap-2 text-sm text-gray-300">
    <input
      type="checkbox"
      checked={showOfflineWorkers}
      onChange={(e) => setShowOfflineWorkers(e.target.checked)}
      className="rounded"
    />
    Show offline
  </label>
</div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleWorkers.length === 0 ? (
                <p className="text-gray-400">هیچ نیرونی پیدا نشد</p>
              ) : (
                visibleWorkers.map((w) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    highlight={highlightId === w.id}
                    onClick={() => setMapSelectedWorkerId(w.id === mapSelectedWorkerId ? null : w.id)}// ✅ فقط روی نقشه فوکوس کن
                    lastSeen={formatTimeAgo(lastSeenRef.current.get(w.id))}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Quick stats</h3>
            <p className="text-gray-300">تعداد نیروی : {allWorkers ? Object.keys(allWorkers).length : 0}</p>
            <p className="text-gray-300">در شیفت: {onlineCount}</p>
            <p className="text-gray-300">قابل مشاهده ها: {visibleWorkers.length}</p>
            <p className="text-gray-300">Live socket: {connected ? 'connected' : 'not connected'}</p>

            <div className="mt-4">
              <h4 className="text-sm text-gray-400">Recently updated</h4>
              <ul className="mt-2 space-y-1">
                {Array.from(lastSeenRef.current.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([id, ts]) => (
                    <li key={id} className="text-xs text-gray-300">
                      #{id} — {formatTimeAgo(ts)}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="mt-4">
              <small className="text-gray-500">WebSocket URL:</small>
              <code className="block mt-1 text-xs text-gray-300">{WS_URL}</code>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboardScreen;
