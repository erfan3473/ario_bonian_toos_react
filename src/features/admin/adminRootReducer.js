// src/features/admin/adminRootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import usersReducer from './usersSlice';
import contractsReducer from './contractsSlice';
import dropdownsReducer from './dropdownsSlice';
import leaveReducer from './leaveSlice';
import adminRequestReducer from './adminRequestSlice'; // 👈 اضافه شد

const adminRootReducer = combineReducers({
  users: usersReducer,
  contracts: contractsReducer,
  dropdowns: dropdownsReducer,
  leave: leaveReducer,
  requests: adminRequestReducer, // 👈 اضافه شد
});

export default adminRootReducer;
