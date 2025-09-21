// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDeleteReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
} from './reducers/userReducers';
import { workerListReducer } from './reducers/workerReducers';
import reportFormsReducer from './features/dailyReports/reportFormsSlice';
import projectReducer from './features/projects/projectSlice';
import dailyReportReducer from './features/dailyReports/dailyReportSlice';

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
    projects: projectReducer,
    dailyReports: dailyReportReducer,
    reportForms: reportFormsReducer,
    
  },
  preloadedState,
});

export default store;
