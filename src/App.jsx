import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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

function App() {
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  return (
    <div
      className={`${
        isDark ? "bg-blue-800 text-white" : "bg-white text-gray-900"
      } min-h-screen flex flex-col font-sans transition-colors duration-300`}
      style={{ direction: "rtl" }}
    >
      <Header />
      <main className="flex-grow container mx-auto px-3 sm:px-4 pt-0 pb-4">
        <div
          className={`${
            isDark
              ? "bg-blue-800 border border-blue-700 border-t-0 shadow-none"
              : "bg-white border border-gray-200 border-t-0 shadow-none"
          } rounded-t-none rounded-b-2xl pt-4 sm:pt-5 px-3 sm:px-4 pb-3 sm:pb-4 min-h-[calc(100vh-180px)] transition-colors duration-300`}
        >
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
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
            <Route path="/admin/phonebook" element={<PhonebookScreen />} />
          </Routes>
        </div>
      </main>

      <footer className={`${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600"} p-4 text-center mt-auto transition-colors duration-300`}>
        &copy; {new Date().getFullYear()} - سامانه مدیریت پروژه آریو بنیان توس
      </footer>
    </div>
  );
}

export default App;
