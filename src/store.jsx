// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import {
  userLoginReducer,
  userRegisterReducer,
  userListReducer,
  userDeleteReducer,
} from './reducers/userReducers';
import { workerListReducer } from './reducers/workerReducers';

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
  },
  preloadedState,
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(), // thunk هست پیش‌فرض
});

export default store;
