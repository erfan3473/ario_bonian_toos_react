import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
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
import ProjectCreateScreen from './screens/ProjectCreateScreen';
import RoleListScreen from './screens/RoleListScreen';
import AdminAttendanceScreen from './screens/AdminAttendanceScreen';
import DailyReportPage from './screens/DailyReportPage'
import PortfolioScreen from './screens/PortfolioScreen';
// Payroll pages
import PayrollModule from './screens/PayrollModule';
import { PayslipListPage } from './screens/PayslipListPage';
import { PayslipDetailPage } from './screens/PayslipDetailPage';
import { SalaryComponentListPage } from './screens/SalaryComponentListPage';
import { LeaveRequestListPage } from './screens/LeaveRequestListPage';
import { PayrollReportPage } from './screens/PayrollReportPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userInfo } = useSelector((state) => state.userLogin);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ✅ فقط وقتی لاگین هست، sidebar رو نشون بده
  const showSidebar = !!userInfo;

  return (
    <div
      className="bg-gray-900 text-white min-h-screen flex font-sans"
      style={{ direction: 'rtl' }}
    >
      {/* ✅ سایدبار فقط در حالت لاگین */}
      {showSidebar && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}

      <div
        className={`flex flex-col flex-grow transition-all duration-300 ${
          showSidebar ? 'md:mr-72' : ''
        } w-full`}
      >
        {/* ✅ هدر همیشه نمایش داده می‌شود */}
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-grow container mx-auto p-4">
          <Routes>
            {/* صفحات عمومی */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/portfolio" element={<PortfolioScreen />} />
            {/* صفحات پروژه و گزارش */}
            <Route path="/admin/project/create" element={<ProjectCreateScreen />} />
            <Route path="/dashboard" element={<WorkerDashboardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/admin/users" element={<UserListScreen />} />
            <Route path="/admin/roles" element={<RoleListScreen />} />
            <Route path="/projects" element={<ProjectListScreen />} />
            <Route path="/projects/:id/reports" element={<DailyReportListScreen />} />
            <Route path="/reports/:reportId" element={<ReportDetailScreen />} />
            <Route path="/projects/:id/reports/create" element={<ReportCreateScreen />} />
            <Route path="/reports/:reportId/manager" element={<ManagerReportScreen />} />
            <Route path="/reports/:reportId/facilities" element={<FacilitiesReportScreen />} />
            <Route path="/reports/:reportId/security" element={<SecurityReportScreen />} />

            {/* Payroll Module */}
            <Route path="/admin/payroll" element={<PayrollModule />} />
            <Route path="/admin/payroll/payslips" element={<PayslipListPage />} />
            <Route path="/admin/payroll/payslips/:id" element={<PayslipDetailPage />} />
            <Route path="/admin/payroll/leaves" element={<LeaveRequestListPage />} />
            <Route path="/admin/payroll/components" element={<SalaryComponentListPage />} />
            <Route path="/admin/payroll/reports" element={<PayrollReportPage />} />
            <Route path="/daily-report/:projectId" element={<DailyReportPage />} />
            <Route path="/admin/attendance" element={<AdminAttendanceScreen />} />
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
