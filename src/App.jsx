import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import AuthScreen from './screens/AuthScreen';
import UserListScreen from './screens/UserListScreen';
import ProfileScreen from './screens/ProfileScreen';
import DailyReportListScreen from './screens/DailyReportListScreen';
import ProjectListScreen from './screens/ProjectListScreen';
import ReportDetailScreen from './screens/ReportDetailScreen';
import ReportCreateScreen from './screens/ReportCreateScreen';
import ManagerReportScreen from './screens/ManagerReportScreen';
import FacilitiesReportScreen from './screens/FacilitiesReportScreen';
import SecurityReportScreen from './screens/SecurityReportScreen';

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/dashboard" element={<WorkerDashboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/admin/users" element={<UserListScreen />} />

          <Route path="/projects" element={<ProjectListScreen />} />
          <Route path="/projects/:id/reports" element={<DailyReportListScreen />} />
          <Route path="/reports/:reportId" element={<ReportDetailScreen />} />

          {/* مسیر ایجاد گزارش */}
          <Route path="/projects/:id/reports/create" element={<ReportCreateScreen />} />

          <Route path="/reports/:reportId/manager" element={<ManagerReportScreen />} />
          <Route path="/reports/:reportId/facilities" element={<FacilitiesReportScreen />} />
          <Route path="/reports/:reportId/security" element={<SecurityReportScreen />} /> 
        </Routes>
      </main>

      <footer className="bg-gray-800 p-4 text-center text-gray-500 mt-auto">
        &copy; {new Date().getFullYear()} - سامانه مدیریت کارگران
      </footer>
    </div>
  );
}

export default App;
