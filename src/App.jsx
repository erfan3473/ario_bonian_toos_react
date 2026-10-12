import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import DailyAttendanceScreen from './screens/DailyAttendanceScreen';
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
import { Toaster, toast } from 'react-hot-toast'; 
import { fetchNotifications, addNotificationFromWS, markNotificationsRead } from './features/notifications/notificationSlice';
import AssetVerifyScreen from './screens/AssetVerifyScreen';
import WebAttendanceScreen from './screens/WebAttendanceScreen';
import AiAgentScreen from './screens/AiAgentScreen';
// 👇 ایمپورت صفحات دبیرخانه

import DomainQRScreen from './screens/DomainQRScreen';
import SecretariatListScreen from './screens/secretariat/SecretariatListScreen';
import SecretariatCreateScreen from './screens/secretariat/SecretariatCreateScreen';
import SecretariatDetailScreen from './screens/secretariat/SecretariatDetailScreen';
import SecretariatEditScreen from './screens/secretariat/SecretariatEditScreen';
function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";
  const { userInfo } = useSelector((state) => state.userLogin);

  const isDarkRef = useRef(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    if (!userInfo?.token && !userInfo?.access) return; 

    const token = userInfo.access || userInfo.token;
    
    dispatch(fetchNotifications());

    const wsUrl = `wss://www.ariobonyantoos.com/ws/inbox/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('🟢 WebSocket Inbox Connected!');
    ws.onerror = (e) => console.error('🔴 WebSocket Inbox Error: ', e);
    ws.onclose = (e) => console.warn(`🟠 WebSocket Inbox Closed (Code: ${e.code})`);

    ws.onmessage = (event) => {
      console.log('🔔 Raw Socket Message:', event.data);
      const data = JSON.parse(event.data);
      
      const notifData = data.payload || data;

      if (notifData.type === 'notification') {
          dispatch(addNotificationFromWS(notifData)); 
      }

      if (notifData.type === 'notification') {
        
        const isChat = notifData.notif_type === 'CHAT_MESSAGE';
        const isTask = notifData.notif_type && notifData.notif_type.startsWith('TASK_');
        
        const isRoutine = notifData.notif_type === 'SYSTEM_MESSAGE' && 
                          notifData.extra_data?.event === 'TIME_BASED_ROUTINE_REMINDER';

        const icon = isChat ? '💬' : (isTask ? '📋' : (isRoutine ? '⏰' : '🔔'));
        const defaultTitle = isChat ? 'پیام جدید' : (isTask ? 'ماموریت' : (isRoutine ? 'یادآوری روتین' : 'اعلان جدید'));
        const buttonLabel = isChat ? 'مشاهده پیام' : (isTask ? 'مشاهده ماموریت' : (isRoutine ? 'انجام روتین' : 'مشاهده'));

        const currentIsDark = isDarkRef.current;

        toast.custom((t) => (
          <div
            dir="rtl"
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-sm w-full shadow-2xl rounded-2xl pointer-events-auto flex flex-col border ${
              isChat ? 'border-green-500' : (isTask ? 'border-blue-500' : (isRoutine ? 'border-orange-500' : 'border-gray-500'))
            } overflow-hidden ${
              currentIsDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <div className={`p-4 flex items-start gap-4 ${currentIsDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex-1">
                <h3 className="font-bold text-base flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
                  <span className={isChat ? 'text-green-500' : (isTask ? 'text-blue-500' : (isRoutine ? 'text-orange-500' : ''))}>
                    {notifData.title || defaultTitle}
                  </span>
                </h3>
                <p className="text-sm opacity-90 leading-relaxed font-medium">
                  {notifData.body || 'شما یک اعلان جدید دارید.'}
                </p>
              </div>
            </div>

            <div className={`flex border-t ${currentIsDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  
                  if (notifData.id) {
                    dispatch(markNotificationsRead([notifData.id]));
                  }
                  
                  if (isChat) {
                    const targetChatId = notifData.object_id || notifData.extra_data?.chat_id;
                    if (targetChatId) {
                      navigate(`/chat?active=${targetChatId}`);
                    } else {
                      navigate('/chat');
                    }
                  } else if (isTask) {
                    const targetTaskId = notifData.object_id;
                    if (targetTaskId) {
                      navigate(`/tasks/${targetTaskId}`);
                    } else {
                      navigate('/tasks'); 
                    }
                  } else if (isRoutine) {
                    navigate('/routines');
                  }
                }}
                className={`w-full py-3 flex items-center justify-center text-sm font-bold transition-colors ${
                  currentIsDark 
                    ? (isChat ? 'text-green-400 hover:bg-gray-700' : isRoutine ? 'text-orange-400 hover:bg-gray-700' : 'text-blue-400 hover:bg-gray-700') 
                    : (isChat ? 'text-green-600 hover:bg-gray-100' : isRoutine ? 'text-orange-600 hover:bg-gray-100' : 'text-blue-600 hover:bg-gray-100')
                } border-l ${currentIsDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                {buttonLabel}
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className={`w-full py-3 flex items-center justify-center text-sm font-bold transition-colors opacity-80 ${
                  currentIsDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                بستن
              </button>
            </div>
          </div>
        ), { 
          duration: 10000, 
          position: 'top-center', 
        });
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [dispatch, userInfo, navigate]); 

  return (
    <div
      className={`${
        isDark ? "bg-blue-800 text-white" : "bg-white text-gray-900"
      } min-h-screen flex flex-col font-sans transition-colors duration-300`}
      style={{ direction: "rtl" }}
    >
      <Toaster /> 
      <Header />
      <main className="flex-grow w-full px-2 sm:px-4 pt-0 pb-4">

        <div
          className={`${
            isDark
              ? "bg-blue-800 border border-blue-700 border-t-0 shadow-none"
              : "bg-white border border-gray-200 border-t-0 shadow-none"
          } rounded-t-none rounded-b-2xl pt-2 sm:pt-3 px-3 sm:px-4 pb-3 sm:pb-4 min-h-[calc(100vh-130px)] transition-colors duration-300`}
        >
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            
            <Route path="/ai-assistant" element={<ProtectedRoute><AiAgentScreen /></ProtectedRoute>} />

            <Route path="/verify/:assetCode" element={<AssetVerifyScreen />} />
            <Route path="/dashboard" element={<WorkerDashboardScreen />} />
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/projects" element={<ProjectListScreen />} />
            <Route path="/admin/projects/create" element={<ProjectCreateScreen />} />
            <Route path="/admin/projects/:id/edit" element={<ProjectEditScreen />} />
            <Route path="/admin/projects/:id/geofence" element={<ProjectGeofenceScreen />} />
            <Route path="/notebooks" element={<NotebookScreen />} />
            <Route path="/admin/users" element={<UserManagementScreen />} />
            <Route path="/admin/users/:userId/location-history" element={<UserLocationHistory />} />
            <Route path="/admin/users/:userId" element={<UserDashboard />} />
            <Route path="/admin/users/:userId/organizational" element={<OrganizationalPage />} />
            <Route path="/admin/users/:userId/personal" element={<SystemInfoPage />} />
            <Route path="/admin/users/:userId/contracts" element={<ContractsPage />} />
            <Route path="/admin/users/:userId/financial" element={<FinancialPage />} />
            <Route path="/admin/users/:userId/leave" element={<LeavePage />} />
            <Route path="/admin/users/new" element={<Navigate to="/admin/users" />} />
            <Route path="/admin/settings" element={<SettingsScreen />} />
            <Route path="/admin/daily-summary" element={<DailySummaryScreen />} />
            <Route path="/admin/attendance/:projectId/:date" element={<DailyAttendanceScreen />} />
            <Route path="/admin/scheme-contracts" element={<SchemeContractScreen />} />
            <Route path="/admin/scheme-contracts/:id" element={<SchemeContractScreen />} />
            <Route path="/admin/scheme-managements" element={<SchemeManagementScreen />} />
            <Route path="/admin/requests" element={<RequestManagementScreen />} />
            <Route path="/admin/timesheet" element={<AdminTimesheetScreen />} />
            <Route path="/admin/payroll/list" element={<PayrollListView />} />
            <Route path="/admin/payroll/detail" element={<PayrollDetailView />} />
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/:id" element={<TaskViewPage />} />
            <Route path="/routines" element={<RoutineListPage />} />
            <Route path="/routines/templates" element={<RoutineTemplatesPage />} /> 
            <Route path="/attendance" element={<ProtectedRoute><WebAttendanceScreen /></ProtectedRoute>} />

            {/* 👇 مسیرهای جدید دبیرخانه */}
            <Route path="/secretariat" element={<ProtectedRoute><SecretariatListScreen /></ProtectedRoute>} />
            <Route path="/secretariat/create" element={<ProtectedRoute><SecretariatCreateScreen /></ProtectedRoute>} />
            <Route path="/secretariat/:id" element={<ProtectedRoute><SecretariatDetailScreen /></ProtectedRoute>} />
            <Route path="/secretariat/:id/edit" element={<ProtectedRoute><SecretariatEditScreen /></ProtectedRoute>} />
            <Route path="/domain-qr" element={<DomainQRScreen />} />
          </Routes>
        </div>
      </main>

      <footer className={`print:hidden ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600"} p-3 text-center text-sm mt-auto transition-colors duration-300`}>
        &copy; {new Date().getFullYear()} - سامانه مدیریت پروژه آریو بنیان توس
      </footer>
    </div>
  );
}

export default App;