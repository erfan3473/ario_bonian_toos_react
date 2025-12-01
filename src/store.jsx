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
import reportReducer from './features/reports/reportSlice'; // ✅ ایمپورت جدید
import adminReducer from './features/admin/adminSlice'; 
import projectReducer from './features/projects/projectSlice'; // ✅ جدید
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
    reports: reportReducer, // ✅ اضافه شد
     projects: projectReducer,
    
    userRole: userRoleReducer,
    userUpdateByAdmin: userUpdateByAdminReducer,

  },
  preloadedState,
});

export default store;