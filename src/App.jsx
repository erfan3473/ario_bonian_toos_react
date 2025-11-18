// src/app.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomeScreen from './screens/HomeScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import AuthScreen from './screens/AuthScreen';
// import UserListScreen from './screens/UserListScreen';
import ProfileScreen from './screens/ProfileScreen';

// import ProjectListScreen from './screens/ProjectListScreen';





// import ProjectCreateScreen from './screens/ProjectCreateScreen';

// import AdminAttendanceScreen from './screens/AdminAttendanceScreen';

// import PortfolioScreen from './screens/PortfolioScreen';
// Payroll pages
// import PayrollModule from './screens/PayrollModule';
// import { PayslipListPage } from './screens/PayslipListPage';
// import { PayslipDetailPage } from './screens/PayslipDetailPage';
// import { SalaryComponentListPage } from './screens/SalaryComponentListPage';
// import { LeaveRequestListPage } from './screens/LeaveRequestListPage';

// import ProjectDetailScreen from './screens/ProjectDetailScreen';


import VoiceAssistantScreen from "./screens/VoiceAssistantScreen";
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
            {/* <Route path="/portfolio" element={<PortfolioScreen />} /> */}
            {/* صفحات پروژه و گزارش */}
            {/* <Route path="/admin/project/create" element={<ProjectCreateScreen />} /> */}
            {/* <Route path="/projects/:id" element={<ProjectDetailScreen />} /> */}
            <Route path="/dashboard" element={<WorkerDashboardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            {/* <Route path="/admin/users" element={<UserListScreen />} /> */}
            {/* <Route path="/admin/roles" element={<RoleListScreen />} /> */}
            {/* <Route path="/projects" element={<ProjectListScreen />} /> */}


            {/* Payroll Module */}
            {/* <Route path="/admin/payroll" element={<PayrollModule />} /> */}
            {/* <Route path="/admin/payroll/payslips" element={<PayslipListPage />} /> */}
            {/* <Route path="/admin/payroll/payslips/:id" element={<PayslipDetailPage />} /> */}
            {/* <Route path="/admin/payroll/leaves" element={<LeaveRequestListPage />} /> */}
            {/* <Route path="/admin/payroll/components" element={<SalaryComponentListPage />} /> */}

            {/* <Route path="/admin/attendance" element={<AdminAttendanceScreen />} /> */}
            <Route path="/assistant" element={<VoiceAssistantScreen />} />
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
