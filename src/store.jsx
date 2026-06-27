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
  userUpdateByAdminReducer,
} from './features/users/userSlice';
import workerReducer       from './features/workers/workerSlice';
import reportReducer       from './features/reports/reportSlice';
// ✅ ایمپورت فایل Combine شده به جای فایل قدیمی
import adminReducer        from './features/admin/adminRootReducer';
import projectReducer      from './features/projects/projectSlice';
import adminRequestReducer from './features/admin/adminRequestSlice';
import adminSchemeReducer  from './features/admin/adminSchemeSlice'; // اگر این را از جای دیگر دارید بگذارید بماند
import attendanceReducer   from './features/attendance/attendanceSlice';
import taskReducer         from './features/task/taskSlice';
import payrollReducer      from './features/payroll/payrollSlice';
import chatReducer         from './features/chat/chatSlice';
import notebookReducer     from './features/notebook/notebookSlice'; 
import mapRoutesReducer from './features/routeMaps/mapRoutesSlice';
import themeReducer from "./features/theme/themeSlice"; 


const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const preloadedState = {
  userLogin: {
    userInfo:              userInfoFromStorage,
    loading:               false,
    error:                 null,
    forgotPasswordLoading: false,
    forgotPasswordError:   null,
    forgotPasswordStep:    1,      
  },
};

const store = configureStore({
  reducer: {
    userLogin:          userLoginReducer,
    userRegister:       userRegisterReducer,
    userList:           userListReducer,
    userDelete:         userDeleteReducer,
    userDetails:        userDetailsReducer,
    userUpdateProfile:  userUpdateProfileReducer,
    userRole:           userRoleReducer,
    userUpdateByAdmin:  userUpdateByAdminReducer,

    // ✅ این متغیر حالا شامل زیرمجموعه‌های: users, contracts, dropdowns, leave, scheme است
    admin:          adminReducer,
    
    workers:        workerReducer,
    reports:        reportReducer,
    projects:       projectReducer,
    adminRequests:  adminRequestReducer,
    adminScheme:    adminSchemeReducer,
    attendance:     attendanceReducer,
    payroll:        payrollReducer,
    task:           taskReducer,
    chat:           chatReducer,
    notebook:       notebookReducer, 
    mapRoutes:      mapRoutesReducer,
    theme: themeReducer,
  },
  preloadedState,
});

export default store;
