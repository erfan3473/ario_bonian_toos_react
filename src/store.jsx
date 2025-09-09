// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import { userLoginReducer, userRegisterReducer } from './reducers/userReducers';

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
  },
  preloadedState,
});

export default store;
