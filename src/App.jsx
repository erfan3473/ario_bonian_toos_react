// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
// ❌ حذف: import Sidebar from './components/Sidebar';
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
import UserManagementScreen from './screens/admin/UserManagementScreen';
import UserDetailPage from './screens/admin/UserDetailPage';
import SettingsScreen from './screens/admin/SettingsScreen';
import RequestManagementScreen from './screens/admin/RequestManagementScreen';

function App() {
  const { userInfo } = useSelector((state) => state.userLogin);

  return (
    <div
      className="bg-gray-900 text-white min-h-screen flex flex-col font-sans"
      style={{ direction: 'rtl' }}
    >
      {/* ✅ فقط Header */}
      <Header />

      {/* محتوای اصلی */}
      <main className="flex-grow container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/dashboard" element={<WorkerDashboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          
          {/* Projects Routes */}
          <Route path="/projects" element={<ProjectListScreen />} />
          <Route path="/admin/projects/create" element={<ProjectCreateScreen />} />
          <Route path="/admin/projects/:id/edit" element={<ProjectEditScreen />} />
          <Route path="/admin/projects/:id/geofence" element={<ProjectGeofenceScreen />} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<UserManagementScreen />} />
          <Route path="/admin/users/:userId" element={<UserDetailPage />} />
          <Route path="/admin/users/new" element={<UserDetailPage />} />
          <Route path="/admin/settings" element={<SettingsScreen />} />
          <Route path="/admin/daily-summary" element={<DailySummaryScreen />} />
          <Route path="/admin/attendance/:projectId/:date" element={<DailyAttendanceScreen />} />
          <Route path="/admin/requests" element={<RequestManagementScreen />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 p-4 text-center text-gray-500 mt-auto">
        &copy; {new Date().getFullYear()} - سامانه مدیریت پروژه آریو بنیان
      </footer>
    </div>
  );
}

export default App;
