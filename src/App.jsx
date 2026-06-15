// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import NotebookScreen from './screens/NotebookScreen';
// Screens
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
// Admin Screens
import UserManagementScreen from './screens/admin/UserManagementScreen';
import SettingsScreen from './screens/admin/SettingsScreen';
import RequestManagementScreen from './screens/admin/RequestManagementScreen';
import SchemeContractScreen from './screens/admin/SchemeContractScreen';
import SchemeManagementScreen from './screens/admin/SchemeManagementScreen';
import AdminTimesheetScreen from './screens/admin/AdminTimesheetScreen';
import ChatScreen from './screens/admin/ChatScreen'; 
import OrganizationalPage from './screens/admin/OrganizationalPage';

// Layout و صفحات جدید مربوط به کاربر
import SystemInfoPage from './screens/admin/user-details/SystemInfoPage';
import ContractsPage from './screens/admin/user-details/ContractsPage';
import FinancialPage from './screens/admin/user-details/FinancialPage';
import LeavePage from './screens/admin/user-details/LeavePage';
import UserDashboard from './screens/admin/UserDashboard'; 
// Payroll Screens
import PayrollListView from './screens/admin/PayrollListView';
import PayrollDetailView from './screens/admin/PayrollDetailView';

// Other Screens
import MyTasksScreen from './screens/MyTasksScreen';

function App() {
  const { userInfo } = useSelector((state) => state.userLogin);

  return (
    <div
      className="bg-gray-900 text-white min-h-screen flex flex-col font-sans"
      style={{ direction: 'rtl' }}
    >
      <Header />

      <main className="flex-grow container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/dashboard" element={<WorkerDashboardScreen />} />
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/chat" element={<ChatScreen />} />

          {/* Projects Routes */}
          <Route path="/projects" element={<ProjectListScreen />} />
          <Route path="/admin/projects/create" element={<ProjectCreateScreen />} />
          <Route path="/admin/projects/:id/edit" element={<ProjectEditScreen />} />
          <Route path="/admin/projects/:id/geofence" element={<ProjectGeofenceScreen />} />
          <Route path="/notebooks" element={<NotebookScreen />} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<UserManagementScreen />} />
          
          {/* مسیر مجزا برای صفحه سازمانی */}
          <Route path="/admin/users/:userId" element={<UserDashboard />} />
          {/* مسیر لایوت و تب‌های کاربری */}
          <Route path="/admin/users/:userId/organizational" element={<OrganizationalPage />} />
          <Route path="/admin/users/:userId/personal" element={<SystemInfoPage />} />
          <Route path="/admin/users/:userId/contracts" element={<ContractsPage />} />
          <Route path="/admin/users/:userId/financial" element={<FinancialPage />} />
          <Route path="/admin/users/:userId/leave" element={<LeavePage />} />
          
          <Route path="/admin/users/new" element={<Navigate to="/admin/users" />} /> {/* موقت تا ساخت صفحه افزودن کاربر مجزا */}
          
          <Route path="/admin/settings" element={<SettingsScreen />} />
          <Route path="/admin/daily-summary" element={<DailySummaryScreen />} />
          <Route path="/admin/attendance/:projectId/:date" element={<DailyAttendanceScreen />} />
          <Route path="/admin/scheme-contracts" element={<SchemeContractScreen />} />
          <Route path="/admin/scheme-contracts/:id" element={<SchemeContractScreen />} />
          <Route path="/admin/scheme-managements" element={<SchemeManagementScreen />} />
          <Route path="/admin/requests" element={<RequestManagementScreen />} />
          <Route path="/admin/timesheet" element={<AdminTimesheetScreen />} />
          
          {/* Payroll Routes */}
          <Route path="/admin/payroll/list" element={<PayrollListView />} />
          <Route path="/admin/payroll/detail" element={<PayrollDetailView />} />
          
          {/* Tasks & Phonebook */}
          <Route path="/tasks" element={<MyTasksScreen />} />
          <Route path="/admin/phonebook" element={<PhonebookScreen />} />

        </Routes>
      </main>

      <footer className="bg-gray-800 p-4 text-center text-gray-500 mt-auto">
        &copy; {new Date().getFullYear()} - سامانه مدیریت پروژه آریو بنیان توس
      </footer>
    </div>
  );
}

export default App;
