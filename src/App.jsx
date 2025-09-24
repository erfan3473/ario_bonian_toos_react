// src/App.js
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomeScreen from './screens/HomeScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
// ... بقیه ایمپورت‌های شما
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex font-sans" style={{ direction: 'rtl' }}>
      {/* سایدبار همیشه رندر می‌شود */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* 👇 تغییر اصلی اینجاست 👇 */}
      {/* این div محتوای اصلی (هدر، بدنه، فوتر) را در بر می‌گیرد */}
      {/* کلاس md:mr-64 باعث می‌شود در صفحات بزرگ، محتوا به اندازه عرض سایدبار (w-64) به سمت چپ هل داده شود */}
      <div className="flex flex-col flex-grow md:mr-64">
        <Header toggleSidebar={toggleSidebar} />

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
            <Route path="/projects/:id/reports/create" element={<ReportCreateScreen />} />
            <Route path="/reports/:reportId/manager" element={<ManagerReportScreen />} />
            <Route path="/reports/:reportId/facilities" element={<FacilitiesReportScreen />} />
            <Route path="/reports/:reportId/security" element={<SecurityReportScreen />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 p-4 text-center text-gray-500 mt-auto">
          &copy; {new Date().getFullYear()} - سامانه مدیریت پروژه
        </footer>
      </div>
    </div>
  );
}

export default App;