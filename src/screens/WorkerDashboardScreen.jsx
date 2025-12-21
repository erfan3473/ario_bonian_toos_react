// src/screens/WorkerDashboardScreen.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QRCode from "react-qr-code";

// ✅ تفکیک imports
import {
  fetchWorkers,
  updateWorkerLocation,
  cleanupOldWorkers,
  selectVisibleWorkers,
  selectProjectDashboardStats
} from '../features/workers/workerSlice';

// ✅ استفاده از projectSlice جدید
import {
  fetchProjects,
  setSelectedProject,
} from '../features/projects/projectSlice';

import WorkerMap from '../components/WorkerMap';
import WorkerCard from '../components/WorkerCard';
import Loader from '../components/Loader';

// 🌐 تنظیمات سوکت
const WS_URL = 'wss://ariobonyantoos.com/ws/worker/updates/';

// تابع کمکی برای نمایش زمان
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

  // ✅ 1) دریافت داده‌ها از Redux (اصلاح شده)
  const { status: workerStatus } = useSelector((state) => state.workers);
  const { history: { status: historyStatus, data: historyData } } = useSelector((state) => state.workers);
  
  // ✅ دریافت Projects از projectSlice
  const { list: projectsList, selectedProjectId, loading: projectsLoading } = useSelector((state) => state.projects);

  const visibleWorkers = useSelector(selectVisibleWorkers);
  const dashboardStats = useSelector(selectProjectDashboardStats);

  // استیت‌های لوکال
  const [showOfflineWorkers, setShowOfflineWorkers] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [highlightId, setHighlightId] = useState(null);
  const [mapSelectedWorkerId, setMapSelectedWorkerId] = useState(null);

  // رفرنس‌های سوکت و زمان
  const socketRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timeoutId: null });
  const lastSeenRef = useRef(new Map());

  // ✅ 1. دریافت اطلاعات اولیه
  useEffect(() => {
    if (workerStatus === 'idle') {
      dispatch(fetchWorkers());
    }
    // دریافت پروژه‌ها از projectSlice
    if (projectsList.length === 0 && !projectsLoading) {
      dispatch(fetchProjects());
    }
  }, [dispatch, workerStatus, projectsList.length, projectsLoading]);

  // 2. تایمر پاکسازی
  useEffect(() => {
    const interval = setInterval(() => dispatch(cleanupOldWorkers()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // 3. مدیریت پیشرفته WebSocket
  useEffect(() => {
    let alive = true;

    const connect = () => {
      if (!alive || paused) return;

      if (socketRef.current) {
        socketRef.current.close();
      }

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ [WS] Connected');
        setConnected(true);
        reconnectRef.current.attempts = 0;
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.message && !data.id && !data.worker_id) return;
          
          if (data.id || data.worker_id) {
            const workerId = data.id || data.worker_id;
            lastSeenRef.current.set(workerId, Date.now());
            
            if (!paused) {
              dispatch(updateWorkerLocation(data));
            }
            
            setHighlightId(workerId);
            setTimeout(() => setHighlightId(null), 1500);
          }
        } catch (err) {
          console.error('[WS] Parse Error:', err);
        }
      };

      socket.onclose = (e) => {
        if (alive) {
          setConnected(false);
          if (!paused) {
            const timeout = Math.min(30000, 1000 * 2 ** reconnectRef.current.attempts++);
            reconnectRef.current.timeoutId = setTimeout(connect, timeout);
          }
        }
      };

      socket.onerror = (err) => {
        socket.close();
      };
    };

    connect();

    return () => {
      alive = false;
      if (socketRef.current) socketRef.current.close();
      clearTimeout(reconnectRef.current.timeoutId);
    };
  }, [paused, dispatch]);

  // 4. فیلترینگ نهایی
  const finalWorkers = useMemo(() => {
    let list = visibleWorkers;
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(w => 
        (w.name || '').toLowerCase().includes(q) || 
        (w.position || '').toLowerCase().includes(q) ||
        String(w.id).includes(q)
      );
    }

    if (!showOfflineWorkers) {
      list = list.filter(w => !w.stale);
    }

    if (sortBy === 'recent') {
      list = [...list].sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0));
    } else {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return list;
  }, [visibleWorkers, search, sortBy, showOfflineWorkers]);
  // بعد از useMemo finalWorkers
useEffect(() => {
  if (finalWorkers.length > 0) {
    console.log('🔍 Sample Worker:', finalWorkers[0]);
  }
}, [finalWorkers]);

  const currentProjectStats = useMemo(() => {
    if (selectedProjectId) {
      return dashboardStats.projects[selectedProjectId] || { 
        name: 'ناشناس', 
        totalWorkers: 0, 
        activeWorkers: 0 
      };
    }
    return { 
      name: 'نمای کلی (همه پروژه‌ها)', 
      totalWorkers: dashboardStats.globalStats.totalWorkers, 
      activeWorkers: dashboardStats.globalStats.activeWorkers 
    };
  }, [dashboardStats, selectedProjectId]);

  // ✅ تابع پرینت QR
  const handlePrintQR = () => {
    const qrElement = document.getElementById('printable-qr-area');
    
    if (qrElement) {
      const qrSvg = qrElement.innerHTML;
      const printWindow = window.open('', '_blank', 'width=800,height=800');
      
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
          <head>
            <title>چاپ QR Code - ${currentProjectStats.name}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                font-family: 'Tahoma', sans-serif; 
              }
              h1 { 
                margin-bottom: 30px; 
                font-size: 28px; 
                text-align: center; 
                border-bottom: 2px solid #000; 
                padding-bottom: 10px;
              }
              .qr-box { 
                padding: 30px; 
                border: 4px solid black; 
                border-radius: 20px; 
                display: flex;
                justify-content: center;
                align-items: center;
              }
              svg {
                width: 400px !important;
                height: 400px !important;
              }
              .footer { 
                margin-top: 20px; 
                font-size: 16px; 
                color: #333; 
                font-weight: bold; 
              }
              @media print {
                @page { margin: 0; size: A4 portrait; }
                body { -webkit-print-color-adjust: exact; }
                header, footer { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>پروژه: ${currentProjectStats.name}</h1>
            <div class="qr-box">${qrSvg}</div>
            <p class="footer">برای ورود به پروژه، کد را با اپلیکیشن اسکن کنید.</p>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                }, 500);
              }
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      alert("خطا: QR Code یافت نشد. لطفا مودال را باز نگه دارید.");
    }
  };

  return (
    <div className="p-6 container mx-auto min-h-screen bg-gray-900 text-gray-100">
      
      {/* 🚨 هشدار قطع اتصال */}
      {!connected && !paused && (
        <div className="bg-yellow-600/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>اتصال قطع است.</span>
        </div>
      )}

      {/* 🗺️ نقشه */}
      <div className="mb-6 rounded-xl overflow-hidden shadow-2xl border border-gray-700 h-[450px] relative">
        <WorkerMap
          workers={finalWorkers}
          selectedWorkerId={mapSelectedWorkerId}
          workerHistory={historyData[mapSelectedWorkerId] || []}
          loadingHistory={historyStatus === 'loading'}
        />
        
        <div className={`absolute top-4 left-14 z-[400] backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 text-xs border shadow-lg transition-colors ${connected ? 'bg-gray-900/80 border-gray-700' : 'bg-red-900/90 border-red-500'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="font-mono font-bold">{connected ? 'LIVE STREAM' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {/* 🎛️ نوار کنترل */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-grow xl:flex-grow-0">
            <select
              className="w-full xl:w-64 appearance-none bg-gray-700 text-white py-2.5 pl-4 pr-10 rounded-lg focus:ring-2 focus:ring-blue-500 border border-gray-600 font-bold"
              value={selectedProjectId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') dispatch(setSelectedProject(null));
                else if (value === 'uncategorized') dispatch(setSelectedProject('uncategorized'));
                else dispatch(setSelectedProject(Number(value)));
              }}
            >
              <option value="">🌍 نمای کلی سازمان</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>🏗️ {p.name}</option>
              ))}
              <option value="uncategorized" className="text-yellow-500">⚠️ بدون پروژه</option>
            </select>
          </div>

          {/* دکمه QR */}
          {selectedProjectId && selectedProjectId !== 'uncategorized' && (
            <button 
              onClick={() => setShowQRModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg shadow transition-colors flex items-center gap-2 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75z" />
              </svg>
              <span>QR ورود</span>
            </button>
          )}
        </div>

        {/* کنترل‌های عمومی */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          <button
            onClick={() => setPaused(!paused)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${paused ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {paused ? '▶ ادامه' : '⏸ توقف'}
          </button>
          
          <button
            onClick={() => { 
              dispatch(fetchWorkers()); 
              dispatch(fetchProjects()); 
            }}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors"
          >
            ⟳ بازخوانی
          </button>
        </div>
      </div>

      {/* لیست و آمار */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-200">
              👷 پرسنل فعال <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{finalWorkers.length}</span>
            </h2>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <input 
                placeholder="جستجو..." 
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white flex-grow"
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
              />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="name">الفبا</option>
                <option value="recent">زمان آپدیت</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300">
                <input 
                  type="checkbox" 
                  checked={showOfflineWorkers} 
                  onChange={e => setShowOfflineWorkers(e.target.checked)} 
                />
                نمایش آفلاین‌ها
              </label>
            </div>
          </div>

          {workerStatus === 'loading' ? <Loader /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[200px]">
              {finalWorkers.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-12 border-2 border-dashed border-gray-700 rounded-xl">
                  <p>هیچ نیرویی با این مشخصات یافت نشد.</p>
                </div>
              ) : (
                finalWorkers.map(w => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    highlight={highlightId === w.id}
                    selected={mapSelectedWorkerId === w.id}
                    onClick={(id) => setMapSelectedWorkerId(id === mapSelectedWorkerId ? null : id)}
                    lastSeen={formatTimeAgo(w.lastUpdate)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6 h-fit sticky top-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <h3 className="text-gray-300 text-xs mb-4 uppercase tracking-wider font-bold">وضعیت: {currentProjectStats.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-3xl font-extrabold text-white">{currentProjectStats.totalWorkers}</div>
                <div className="text-xs text-gray-400 mt-1">کل پرسنل</div>
              </div>
              <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/20">
                <div className="text-3xl font-extrabold text-green-400">{currentProjectStats.activeWorkers}</div>
                <div className="text-xs text-green-300 mt-1">حاضر در شیفت</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* مودال QR Code */}
      {showQRModal && selectedProjectId && selectedProjectId !== 'uncategorized' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-gray-900 text-2xl font-bold">{currentProjectStats.name}</h2>
              <p className="text-gray-500 text-sm mt-1">کد را اسکن کنید</p>
            </div>
            
            <div id="printable-qr-area" className="flex justify-center mb-6 p-6 bg-gray-100 rounded-2xl border border-gray-200">
              <QRCode 
                value={JSON.stringify({ 
                  project_id: selectedProjectId,
                  type: 'project_join' 
                })} 
                size={220}
                fgColor="#1F2937"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handlePrintQR}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                پرینت
              </button>
              
              <button 
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkerDashboardScreen;
