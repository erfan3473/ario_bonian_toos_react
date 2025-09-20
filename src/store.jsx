import { configureStore } from '@reduxjs/toolkit';
import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDeleteReducer,
  userDetailsReducer,        // ✅ ردیوسر جدید اضافه شد
  userUpdateProfileReducer,  // ✅ ردیوسر جدید اضافه شد
} from './reducers/userReducers';
import { workerListReducer } from './reducers/workerReducers';
import dailyReportReducer from './features/dailyReports/dailyReportSlice';
import projectSliceReducer from './features/projects/projectSlice';

// Load user info from localStorage
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
    workerList: workerListReducer,
    userList: userListReducer,
    userDelete: userDeleteReducer,
    userDetails: userDetailsReducer,            // ✅ ردیوسر جدید به استور اضافه شد
    userUpdateProfile: userUpdateProfileReducer,  // ✅ ردیوسر جدید به استور اضافه شد
    dailyReports: dailyReportReducer,
    projects: projectSliceReducer,
  },
  preloadedState,
});

export default store;