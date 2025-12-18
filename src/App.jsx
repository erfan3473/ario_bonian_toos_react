// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomeScreen from './screens/HomeScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
// import VoiceAssistantScreen from "./screens/VoiceAssistantScreen";
import ProjectListScreen from './screens/ProjectListScreen';
import ProjectGeofenceScreen from './screens/ProjectGeofenceScreen';
import DailyAttendanceScreen from './screens/DailyAttendanceScreen';
import DailySummaryScreen from './screens/DailySummaryScreen';
// import PendingApprovalsScreen from './screens/PendingApprovalsScreen';
import UserManagementScreen from './screens/admin/UserManagementScreen';
import UserDetailPage from './screens/admin/UserDetailPage'; // ✅ جدید
import SettingsScreen from './screens/admin/SettingsScreen';
import RequestManagementScreen from './screens/admin/RequestManagementScreen';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userInfo } = useSelector((state) => state.userLogin);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const showSidebar = !!userInfo;

  return (
    <div
      className="bg-gray-900 text-white min-h-screen flex font-sans"
      style={{ direction: 'rtl' }}
    >
      {showSidebar && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}

      <div
        className={`flex flex-col flex-grow transition-all duration-300 ${
          showSidebar ? 'md:mr-72' : ''
        } w-full`}
      >
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/dashboard" element={<WorkerDashboardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            {/* <Route path="/assistant" element={<VoiceAssistantScreen />} /> */}
            <Route path="/projects" element={<ProjectListScreen />} />
            
            {/* ✅ Admin Routes - User Management */}
            <Route path="/admin/users" element={<UserManagementScreen />} />
            <Route path="/admin/users/:userId" element={<UserDetailPage />} /> {/* ✅ جدید */}
            <Route path="/admin/users/new" element={<UserDetailPage />} /> {/* ✅ جدید */}
            
            <Route path="/admin/settings" element={<SettingsScreen />} />
            <Route path="/admin/projects/:id/geofence" element={<ProjectGeofenceScreen />} />
            <Route path="/admin/daily-summary" element={<DailySummaryScreen />} />
            <Route path="/admin/attendance/:projectId/:date" element={<DailyAttendanceScreen />} />
            {/* <Route path="/admin/approvals" element={<PendingApprovalsScreen />} /> */}
             <Route path="/admin/requests" element={<RequestManagementScreen />} /> {/* ✅ جدید */}
          </Routes>
        </main>

        <footer className="bg-gray-800 p-4 text-center text-gray-500 mt-auto">
          &copy; {new Date().getFullYear()} - سامانه مدیریت پروژه آریو بنیان
        </footer>
      </div>
    </div>
  );
}

export default App;
