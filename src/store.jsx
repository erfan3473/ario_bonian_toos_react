import { configureStore } from '@reduxjs/toolkit';
import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDeleteReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
  userRoleReducer,
  userUpdateByAdminReducer,
} from './features/users/userSlice';
import workerReducer from './features/workers/workerSlice';
import reportReducer from './features/reports/reportSlice'; 
import adminReducer from './features/admin/adminSlice'; 
import projectReducer from './features/projects/projectSlice'; 
import adminRequestReducer from './features/admin/adminRequestSlice';
import adminSchemeReducer from './features/admin/adminSchemeSlice';
import attendanceReducer from './features/attendance/attendanceSlice';
import tasksReducer from './features/tasks/taskSlice';
import payrollReducer from './features/payroll/payrollSlice';
// load user info from storage
const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const preloadedState = {
  userLogin: { userInfo: userInfoFromStorage },
};

const store = configureStore({
  reducer: {
    admin: adminReducer,

    userLogin: userLoginReducer,
    userRegister: userRegisterReducer,
    userList: userListReducer,
    userDelete: userDeleteReducer,
    userDetails: userDetailsReducer,
    userUpdateProfile: userUpdateProfileReducer,

    workers: workerReducer,
    reports: reportReducer, 
    projects: projectReducer,
    adminRequests: adminRequestReducer, 
    userRole: userRoleReducer,
    userUpdateByAdmin: userUpdateByAdminReducer,
    adminScheme: adminSchemeReducer,
    attendance: attendanceReducer,
    payroll: payrollReducer,
    tasks: tasksReducer,

  },
  preloadedState,
});

export default store;