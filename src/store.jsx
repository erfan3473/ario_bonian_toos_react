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
import { workerListReducer } from './reducers/workerReducers';
import reportFormsReducer from './features/dailyReports/reportFormsSlice';
import { projectListReducer } from './features/projects/projectListSlice';
import { projectCreateReducer } from './features/projects/projectCreateSlice';
import dailyReportReducer from './features/dailyReports/dailyReportSlice';
import { roleReducer , rolePermissionReducer } from './features/roles/roleSlice' 
import { employmentTypeReducer } from './features/payroll/employmentTypeSlice'

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
    workerList: workerListReducer,
    projectList: projectListReducer,     // 📌 فقط لیست پروژه‌ها
    projectCreate: projectCreateReducer, // 📌 فقط ایجاد پروژه
    dailyReports: dailyReportReducer,
    reportForms: reportFormsReducer,
    userRole: userRoleReducer,
    userUpdateByAdmin: userUpdateByAdminReducer,
    roleList: roleReducer,
    rolePermissions: rolePermissionReducer,
    employmentTypes: employmentTypeReducer,
  },
  preloadedState,
});

export default store;
