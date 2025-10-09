// src/features/hr/employeeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; // مسیر را متناسب با پروژه تنظیم کنید

const initialState = {
  employees: [],
  selectedEmployee: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async Thunks for Employee CRUD operations

export const fetchEmployees = createAsyncThunk('hr/fetchEmployees', async () => {
  const response = await axiosInstance.get('employees/');
  return response.data;
});

export const fetchEmployeeById = createAsyncThunk('hr/fetchEmployeeById', async (employeeId) => {
  const response = await axiosInstance.get(`employees/${employeeId}/`);
  return response.data;
});

export const createEmployee = createAsyncThunk('hr/createEmployee', async (employeeData) => {
  const response = await axiosInstance.post('employees/', employeeData);
  return response.data;
});

export const updateEmployee = createAsyncThunk('hr/updateEmployee', async ({ id, ...employeeData }) => {
  const response = await axiosInstance.put(`employees/${id}/`, employeeData);
  return response.data;
});

export const deleteEmployee = createAsyncThunk('hr/deleteEmployee', async (employeeId) => {
  await axiosInstance.delete(`employees/${employeeId}/`);
  return employeeId;
});

// Employee Slice
const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    resetEmployeeStatus: (state) => {
        state.status = 'idle';
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Employees
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Fetch Employee By ID
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.selectedEmployee = action.payload;
      })
      // Create Employee
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
      })
      // Update Employee
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.employees.findIndex(emp => emp.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
      })
      // Delete Employee
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(emp => emp.id !== action.payload);
      });
  },
});

export const { resetEmployeeStatus } = employeeSlice.actions;

export default employeeSlice.reducer;