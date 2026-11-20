// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import NotebookScreen from './screens/NotebookScreen';
import HomeScreen from './screens/HomeScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProjectListScreen from './screens/ProjectListScreen';
import ProjectCreateScreen from './screens/ProjectCreateScreen';
import ProjectEditScreen from './screens/ProjectEditScreen';
import ProjectGeofenceScreen from './screens/ProjectGeofenceScreen';
import DailySummaryScreen from './screens/DailySummaryScreen';
import ProtectedRoute from './components/ProtectedRoute';
import PhonebookScreen from './screens/admin/PhonebookScreen';
import UserManagementScreen from './screens/admin/UserManagementScreen';
import SettingsScreen from './screens/admin/SettingsScreen';
import RequestManagementScreen from './screens/admin/RequestManagementScreen';
import SchemeContractScreen from './screens/admin/SchemeContractScreen';
import SchemeManagementScreen from './screens/admin/SchemeManagementScreen';
import AdminTimesheetScreen from './screens/admin/AdminTimesheetScreen';
import ChatScreen from './screens/admin/ChatScreen';
import OrganizationalPage from './screens/admin/user-details/OrganizationalPage';
import UserLocationHistory from './screens/admin/user-details/UserLocationHistory';
import SystemInfoPage from './screens/admin/user-details/SystemInfoPage';
import ContractsPage from './screens/admin/user-details/ContractsPage';
import FinancialPage from './screens/admin/user-details/FinancialPage';
import LeavePage from './screens/admin/user-details/LeavePage';
import UserDashboard from './screens/admin/UserDashboard';
import PayrollListView from './screens/admin/PayrollListView';
import PayrollDetailView from './screens/admin/PayrollDetailView';
import TaskListPage from './pages/TaskListPage';
import TaskViewPage from './pages/TaskViewPage';
import RoutineListPage from './pages/RoutineListPage';
import RoutineTemplatesPage from './pages/RoutineTemplatesPage';

import { Toaster } from 'react-hot-toast';
import {
  fetchNotifications,
  addNotificationFromWS,
  markNotificationsRead,
} from './features/notifications/notificationSlice';
import {
  fetchMyChats,
  setActiveChat,
  setInboxConnectionStatus,
  updateUserPresence,
  setChatTyping,
  handleInboxNewMessage,
} from './features/chat/chatSlice';
import NotificationDialog from './components/NotificationDialog';
import AssetVerifyScreen from './screens/AssetVerifyScreen';
import WebAttendanceScreen from './screens/WebAttendanceScreen';
import AiAgentScreen from './screens/AiAgentScreen';

import DomainQRScreen from './screens/DomainQRScreen';
import SecretariatListScreen from './screens/secretariat/SecretariatListScreen';
import SecretariatCreateScreen from './screens/secretariat/SecretariatCreateScreen';
import SecretariatDetailScreen from './screens/secretariat/SecretariatDetailScreen';
import SecretariatEditScreen from './screens/secretariat/SecretariatEditScreen';
import TaskTemplatesPage from './pages/TaskTemplatesPage';
import InstallPwaPrompt from './components/InstallPwaPrompt';
import axiosInstance from './api/axiosInstance';

const getInboxWsBaseUrl = () => {
  const apiBase = axiosInstance?.defaults?.baseURL || '';
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
  }
  return 'wss://www.ariobonyantoos.com';
};

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';
  const { userInfo } = useSelector((state) => state.userLogin);
  const activeChatId = useSelector((state) => state.chat?.activeChatId);

  const token = userInfo?.access || userInfo?.token;
  const myId = userInfo?.id ?? userInfo?.user?.id;

  const [dialogNotifications, setDialogNotifications] = useState([]);


  
  const isFullScreenAppRoute = ['/notebooks', '/chat', '/ai-assistant'].some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token) return;

    dispatch(fetchNotifications());
    dispatch(fetchMyChats());

    let ws = null;
    let pingInterval = null;
    let reconnectTimeout = null;
    let isComponentMounted = true;
    let reconnectAttempts = 0;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      if (!navigator.onLine) {
        dispatch(setInboxConnectionStatus('offline'));
        return;
      }

      dispatch(
        setInboxConnectionStatus(
          reconnectAttempts > 0 ? 'reconnecting' : 'connecting'
        )
      );

      const wsUrl = `${getInboxWsBaseUrl()}/ws/inbox/?token=${token}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        reconnectAttempts = 0;
        dispatch(setInboxConnectionStatus('connected'));
        dispatch(fetchMyChats());

        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onerror = () => {
        dispatch(setInboxConnectionStatus('offline'));
      };

      ws.onclose = () => {
        clearInterval(pingInterval);
        dispatch(setInboxConnectionStatus('offline'));

        if (isComponentMounted && navigator.onLine) {
          clearTimeout(reconnectTimeout);
          const delay =
            Math.min(30000, 3000 + reconnectAttempts * 3000) +
            Math.random() * 500;
          reconnectAttempts += 1;
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'pong' || data.type === 'connection') return;

        const payload = data.payload || data;

        // وضعیت آنلاین/آفلاین کاربران
        if (payload.type === 'inbox_user_status') {
          dispatch(updateUserPresence(payload));
          return;
        }

        // وضعیت در حال نوشتن در لیست گفتگوها
        if (payload.type === 'inbox_typing') {
          if (payload.user_id && payload.user_id !== myId) {
            dispatch(
              setChatTyping({
                chat_id: payload.chat_id,
                user_id: payload.user_id,
                user_name: payload.user_name,
                is_typing: true,
              })
            );
            setTimeout(() => {
              if (isComponentMounted) {
                dispatch(
                  setChatTyping({
                    chat_id: payload.chat_id,
                    user_id: payload.user_id,
                    is_typing: false,
                  })
                );
              }
            }, 4000);
          }
          return;
        }

        // پیام جدید در اینباکس (آپدیت لحظه‌ای سایدبار چت‌ها)
        if (payload.type === 'inbox_new_message') {
          dispatch(handleInboxNewMessage(payload));
          return;
        }

        // اعلان جدید -> نمایش روی دیالوگ مودال
        if (payload.type === 'notification') {
          dispatch(addNotificationFromWS(payload));

          const isChat =
            payload.notif_type === 'CHAT_MESSAGE' || payload.model === 'chat';
          if (isChat) {
            dispatch(fetchMyChats());
            const targetChatId = Number(
              payload.object_id || payload.extra_data?.chat_id || 0
            );
            const isAlreadyInChat =
              locationRef.current.pathname === '/chat' &&
              Number(activeChatIdRef.current) === targetChatId;

            if (isAlreadyInChat) {
              if (payload.id) {
                dispatch(markNotificationsRead([payload.id]));
              }
              return;
            }
          }

          setDialogNotifications((prev) => {
            if (payload.id && prev.some((n) => n.id === payload.id)) {
              return prev;
            }
            return [...prev, payload];
          });
        }
      };
    };

    connectWebSocket();

    const handleOnline = () => {
      reconnectAttempts = 0;
      connectWebSocket();
    };
    const handleOffline = () => {
      clearTimeout(reconnectTimeout);
      dispatch(setInboxConnectionStatus('offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isComponentMounted = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [dispatch, token, myId]);

  const handleOpenNotificationTarget = (notifData) => {
    setDialogNotifications((prev) => prev.filter((n) => n.id !== notifData.id));

    if (notifData.id) {
      dispatch(markNotificationsRead([notifData.id]));
    }

    const isChat =
      notifData.notif_type === 'CHAT_MESSAGE' || notifData.model === 'chat';
    const isTask =
      (notifData.notif_type && notifData.notif_type.startsWith('TASK_')) ||
      notifData.model === 'task';
    const isRoutine =
      (notifData.notif_type === 'SYSTEM_MESSAGE' &&
        (notifData.extra_data?.event === 'TIME_BASED_ROUTINE_REMINDER' ||
          notifData.extra_data?.event === 'INCOMPLETE_ROUTINE_CHECKOUT_WARNING')) ||
      notifData.model === 'routineinstance';

    if (isChat) {
      const rawChatId =
        notifData.object_id ?? notifData.extra_data?.chat_id ?? notifData.chat_id;
      const targetChatId = rawChatId ? Number(rawChatId) : null;

      if (targetChatId && !Number.isNaN(targetChatId)) {
        dispatch(setActiveChat(targetChatId));
        dispatch(fetchMyChats());
        navigate(`/chat?active=${targetChatId}`);
      } else {
        navigate('/chat');
      }
    } else if (isTask) {
      const targetTaskId = notifData.object_id || notifData.extra_data?.task_id;
      if (targetTaskId) {
        navigate(`/tasks/${targetTaskId}`);
      } else {
        navigate('/tasks');
      }
    } else if (isRoutine) {
      navigate('/routines');
    }
  };

  return (
    <div
      className={`${
        isDark
          ? 'bg-tactical-canvas text-slate-200'
          : 'bg-tactical-lightCanvas text-slate-900'
      } ${
        isFullScreenAppRoute
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none'
          : 'min-h-screen'
      } flex flex-col font-sans transition-colors duration-200`}
      style={{ direction: 'rtl' }}
    >
      <Toaster />

      {/* دیالوگ اعلان‌های زنده */}
      <NotificationDialog
        notifications={dialogNotifications}
        isDark={isDark}
        onOpenTarget={handleOpenNotificationTarget}
        onDismissCurrent={() =>
          setDialogNotifications((prev) => prev.slice(1))
        }
        onDismissAll={() => setDialogNotifications([])}
      />

      <div className="shrink-0">
        <Header />
      </div>
      <main
        className={`w-full flex flex-col ${
          isFullScreenAppRoute
            ? 'flex-1 min-h-0 overflow-hidden p-0'
            : 'flex-grow p-0'
        }`}
      >
        <div
          className={
            isFullScreenAppRoute
              ? 'flex-1 min-h-0 flex flex-col overflow-hidden p-0'
              : 'w-full flex-grow'
          }
        >
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/auth" element={<AuthScreen />} />

            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AiAgentScreen />
                </ProtectedRoute>
              }
            />

            <Route path="/verify/:assetCode" element={<AssetVerifyScreen />} />
            <Route path="/dashboard" element={<WorkerDashboardScreen />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/projects" element={<ProjectListScreen />} />
            <Route
              path="/admin/projects/create"
              element={<ProjectCreateScreen />}
            />
            <Route
              path="/admin/projects/:id/edit"
              element={<ProjectEditScreen />}
            />
            <Route
              path="/admin/projects/:id/geofence"
              element={<ProjectGeofenceScreen />}
            />
            <Route path="/notebooks" element={<NotebookScreen />} />
            <Route path="/admin/users" element={<UserManagementScreen />} />
            <Route
              path="/admin/users/:userId/location-history"
              element={<UserLocationHistory />}
            />
            <Route path="/admin/users/:userId" element={<UserDashboard />} />
            <Route
              path="/admin/users/:userId/organizational"
              element={<OrganizationalPage />}
            />
            <Route
              path="/admin/users/:userId/personal"
              element={<SystemInfoPage />}
            />
            <Route
              path="/admin/users/:userId/contracts"
              element={<ContractsPage />}
            />
            <Route
              path="/admin/users/:userId/financial"
              element={<FinancialPage />}
            />
            <Route
              path="/admin/users/:userId/leave"
              element={<LeavePage />}
            />
            <Route
              path="/admin/users/new"
              element={<Navigate to="/admin/users" />}
            />
            <Route path="/admin/settings" element={<SettingsScreen />} />
            <Route
              path="/admin/daily-summary"
              element={<DailySummaryScreen />}
            />
            <Route
              path="/admin/scheme-contracts"
              element={<SchemeContractScreen />}
            />
            <Route
              path="/admin/scheme-contracts/:id"
              element={<SchemeContractScreen />}
            />
            <Route
              path="/admin/scheme-managements"
              element={<SchemeManagementScreen />}
            />
            <Route
              path="/admin/requests"
              element={<RequestManagementScreen />}
            />
            <Route
              path="/admin/timesheet"
              element={<AdminTimesheetScreen />}
            />
            <Route path="/admin/payroll/list" element={<PayrollListView />} />
            <Route
              path="/admin/payroll/detail"
              element={<PayrollDetailView />}
            />
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/:id" element={<TaskViewPage />} />
            <Route
              path="/tasks/templates"
              element={
                <ProtectedRoute>
                  <TaskTemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/routines" element={<RoutineListPage />} />
            <Route
              path="/routines/templates"
              element={<RoutineTemplatesPage />}
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <WebAttendanceScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/secretariat"
              element={
                <ProtectedRoute>
                  <SecretariatListScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretariat/create"
              element={
                <ProtectedRoute>
                  <SecretariatCreateScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretariat/:id"
              element={
                <ProtectedRoute>
                  <SecretariatDetailScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretariat/:id/edit"
              element={
                <ProtectedRoute>
                  <SecretariatEditScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/domain-qr" element={<DomainQRScreen />} />
          </Routes>
        </div>
      </main>

      <InstallPwaPrompt />

      {!isFullScreenAppRoute && (
        <footer
          className={`print:hidden mt-auto transition-colors duration-200 border-t px-4 py-3 text-xs ${
            isDark
              ? 'bg-tactical-surface1 border-slate-400/15 text-slate-400'
              : 'bg-white border-slate-900/15 text-slate-600'
          }`}
        >
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 tracking-normal">
            <span>© {new Date().getFullYear()} سامانه مدیریت پروژه آریو بنیان توس</span>
            <span className="text-[11px] font-medium text-slate-500">
              سامانه یکپارچه عملیات عمرانی، فضای سبز و خدمات شهری
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;