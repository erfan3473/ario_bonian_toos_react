// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDeleteReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
  userRoleReducer,
  userUpdateByAdminReducer
} from './features/users/userSlice';
import workerReducer from './features/workers/workerSlice';
import reportFormsReducer from './features/dailyReports/reportFormsSlice';
import { projectListReducer } from './features/projects/projectListSlice';
import { projectCreateReducer } from './features/projects/projectCreateSlice';
import dailyReportReducer from './features/dailyReports/dailyReportSlice';
import { roleReducer , rolePermissionReducer } from './features/roles/roleSlice' 
//payroll
import payrollPeriodReducer from './features/payroll/slices/payrollPeriodSlice'

import leaveRequestReducer from './features/payroll/slices/leaveRequestSlice';
import payrollReportReducer from './features/payroll/slices/payrollReportSlice';
import salaryComponentReducer from './features/payroll/slices/salaryComponentSlice';
import employeeReducer from './features/hr/employeeSlice';
import positionReducer from './features/hr/positionSlice';
import paygradeReducer from './features/hr/paygradeSlice';

import payslipReducer from './features/payroll/slices/payslipSlice';
import workerSlice from './features/workers/workerSlice';

import adminAttendanceReducer from './features/attendance/adminAttendanceSlice'; // ← جدید
// load user info from storage
const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const preloadedState = {
  userLogin: { userInfo: userInfoFromStorage },
};

const store = configureStore({
  reducer: {
    userLogin: userLoginReducer,
    userRegister: userRegisterReducer,
    userList: userListReducer,
    userDelete: userDeleteReducer,
    userDetails: userDetailsReducer,
    userUpdateProfile: userUpdateProfileReducer,
       workers: workerReducer, 
    projectList: projectListReducer,     // 📌 فقط لیست پروژه‌ها
    projectCreate: projectCreateReducer, // 📌 فقط ایجاد پروژه
    dailyReports: dailyReportReducer,
    reportForms: reportFormsReducer,
    userRole: userRoleReducer,
    userUpdateByAdmin: userUpdateByAdminReducer,
    roleList: roleReducer,
    rolePermissions: rolePermissionReducer,
    payrollPeriod: payrollPeriodReducer,
    payslip: payslipReducer,
    salaryComponent: salaryComponentReducer,
    leaveRequest: leaveRequestReducer,
    payrollReport: payrollReportReducer,
    employees: employeeReducer,
    positions: positionReducer,
    paygrades: paygradeReducer,
    adminAttendance: adminAttendanceReducer,
   
  },
  preloadedState,
});

export default store;
