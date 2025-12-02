// src/features/admin/adminSlice.jsx

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/admin';

// ═══════════════════════════════════════════════════════════
// 🛠️ Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * استخراج پیام خطا از response
 */
const extractErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    
    // اگر خطا به صورت object بود (مثلاً validation errors)
    if (typeof data === 'object' && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        return data[firstKey][0];
      }
      if (firstKey) {
        return data[firstKey];
      }
    }
    
    // اگر خطا string بود
    if (typeof data === 'string') return data;
    
    // اگر detail داشت
    if (data.detail) return data.detail;
  }
  
  return error.message || 'خطای ناشناخته رخ داد';
};

/**
 * ساخت config با token
 */
const getAuthConfig = (getState, isMultipart = false) => {
  const { userLogin } = getState();
  const token = userLogin?.userInfo?.access;
  
  if (!token) {
    throw new Error('توکن احراز هویت یافت نشد');
  }
  
  return {
    headers: {
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};

// ═══════════════════════════════════════════════════════════
// 🔄 Async Thunks - Users
// ═══════════════════════════════════════════════════════════

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      // ✅ GET /api/admin/users/?role=admin|employee|worker
      const { data } = await axios.get(`${API_BASE}/users/`, {
        ...config,
        params, // ?role=worker, ?search=علی
      });
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchUserDetail = createAsyncThunk(
  'admin/fetchUserDetail',
  async (userId, { rejectWithValue, getState }) => {
    try {
      if (!userId) throw new Error('شناسه کاربر الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ GET /api/admin/users/<id>/
      const { data } = await axios.get(`${API_BASE}/users/${userId}/`, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { rejectWithValue, getState }) => {
    try {
      if (!userId) throw new Error('شناسه کاربر الزامی است');
      if (!userData) throw new Error('داده‌های کاربر الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ PUT /api/admin/users/<id>/update/
      const { data } = await axios.put(
        `${API_BASE}/users/${userId}/update/`,
        userData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { rejectWithValue, getState }) => {
    try {
      if (!userData) throw new Error('داده‌های کاربر الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ POST /api/admin/users/
      const { data } = await axios.post(`${API_BASE}/users/`, userData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue, getState }) => {
    try {
      if (!userId) throw new Error('شناسه کاربر الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ DELETE /api/admin/users/<id>/delete/
      await axios.delete(`${API_BASE}/users/${userId}/delete/`, config);
      return userId;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🔄 Async Thunks - Employees
// ═══════════════════════════════════════════════════════════

export const updateEmployee = createAsyncThunk(
  'admin/updateEmployee',
  async ({ employeeId, employeeData }, { rejectWithValue, getState }) => {
    try {
      if (!employeeId) throw new Error('شناسه کارمند الزامی است');
      if (!employeeData) throw new Error('داده‌های کارمند الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ PUT /api/admin/employees/<id>/
      const { data } = await axios.put(
        `${API_BASE}/employees/${employeeId}/`,
        employeeData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🔄 Async Thunks - Contracts
// ═══════════════════════════════════════════════════════════

export const fetchContracts = createAsyncThunk(
  'admin/fetchContracts',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      // ✅ GET /api/admin/contracts/
      const { data } = await axios.get(`${API_BASE}/contracts/`, {
        ...config,
        params,
      });
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const createContract = createAsyncThunk(
  'admin/createContract',
  async (contractData, { rejectWithValue, getState }) => {
    try {
      if (!contractData) throw new Error('داده‌های قرارداد الزامی است');
      if (!contractData.employee) throw new Error('شناسه کارمند الزامی است');
      if (!contractData.project) throw new Error('شناسه پروژه الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ POST /api/admin/contracts/
      const { data } = await axios.post(
        `${API_BASE}/contracts/`,
        contractData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateContract = createAsyncThunk(
  'admin/updateContract',
  async ({ contractId, contractData }, { rejectWithValue, getState }) => {
    try {
      if (!contractId) throw new Error('شناسه قرارداد الزامی است');
      if (!contractData) throw new Error('داده‌های قرارداد الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ PUT /api/admin/contracts/<id>/
      const { data } = await axios.put(
        `${API_BASE}/contracts/${contractId}/`,
        contractData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteContract = createAsyncThunk(
  'admin/deleteContract',
  async (contractId, { rejectWithValue, getState }) => {
    try {
      if (!contractId) throw new Error('شناسه قرارداد الزامی است');
      
      const config = getAuthConfig(getState);
      // ✅ DELETE /api/admin/contracts/<id>/
      await axios.delete(`${API_BASE}/contracts/${contractId}/`, config);
      return contractId;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🔄 Async Thunks - Dropdowns
// ═══════════════════════════════════════════════════════════

export const fetchDropdowns = createAsyncThunk(
  'admin/fetchDropdowns',
  async (_, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      
         // ✅ فقط 3 تای اول رو بگیر (پروژه‌ها از projectSlice میاد)
      const [positions, skillLevels, employmentTypes] = await Promise.all([
        axios.get(`${API_BASE}/dropdowns/positions/`, config),
        axios.get(`${API_BASE}/dropdowns/skill-levels/`, config),
        axios.get(`${API_BASE}/dropdowns/employment-types/`, config),
      ]);

      return {
        positions: positions.data || [],
        skillLevels: skillLevels.data || [],
        employmentTypes: employmentTypes.data || [],
        
      };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ✅ برای بارگذاری جداگانه هر dropdown (اختیاری)
export const fetchPositions = createAsyncThunk(
  'admin/fetchPositions',
  async (_, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.get(`${API_BASE}/dropdowns/positions/`, config);
      return data || [];
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchSkillLevels = createAsyncThunk(
  'admin/fetchSkillLevels',
  async (_, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.get(`${API_BASE}/dropdowns/skill-levels/`, config);
      return data || [];
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchEmploymentTypes = createAsyncThunk(
  'admin/fetchEmploymentTypes',
  async (_, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.get(`${API_BASE}/dropdowns/employment-types/`, config);
      return data || [];
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🔄 Async Thunks - Employment Types Management (Settings)
// ═══════════════════════════════════════════════════════════

export const createEmploymentType = createAsyncThunk(
  'admin/createEmploymentType',
  async (employmentTypeData, { rejectWithValue, getState }) => {
    try {
      if (!employmentTypeData?.key) throw new Error('کلید نوع استخدام الزامی است');
      if (!employmentTypeData?.description) throw new Error('نام فارسی الزامی است');
      
      const config = getAuthConfig(getState);
      // ⚠️ این endpoint هنوز نساختیم! باید به admin_views.py اضافه بشه
      const { data } = await axios.post(
        `${API_BASE}/employment-types/`,
        employmentTypeData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateEmploymentType = createAsyncThunk(
  'admin/updateEmploymentType',
  async ({ id, data: employmentTypeData }, { rejectWithValue, getState }) => {
    try {
      if (!id) throw new Error('شناسه نوع استخدام الزامی است');
      if (!employmentTypeData) throw new Error('داده‌های نوع استخدام الزامی است');
      
      const config = getAuthConfig(getState);
      // ⚠️ این endpoint هنوز نساختیم!
      const { data } = await axios.put(
        `${API_BASE}/employment-types/${id}/`,
        employmentTypeData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗄️ Slice
// ═══════════════════════════════════════════════════════════

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    // Users
    users: {
      data: [],
      loading: false,
      error: null,
    },
    
    // Selected User (برای modal جزئیات)
    selectedUser: {
      data: null,
      loading: false,
      error: null,
    },
    
    // Update Status (برای همه عملیات CUD)
    updateStatus: {
      loading: false,
      success: false,
      error: null,
    },
    
    // Dropdowns
    positions: [],
    skillLevels: [],
    employmentTypes: [],
    projects: [],
    dropdownsLoading: false,
    dropdownsError: null,
    
    // Contracts
    contracts: {
      data: [],
      loading: false,
      error: null,
    },
  },
  
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser.data = null;
      state.selectedUser.error = null;
      state.selectedUser.loading = false;
    },
    
    resetUpdateStatus: (state) => {
      state.updateStatus.loading = false;
      state.updateStatus.success = false;
      state.updateStatus.error = null;
    },
    
    clearUsersError: (state) => {
      state.users.error = null;
    },
    
    clearContractsError: (state) => {
      state.contracts.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // ═════════════════════════════════════════════════════════
    // Users
    // ═════════════════════════════════════════════════════════
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.data = action.payload;
        state.users.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload || 'خطا در بارگذاری کاربران';
      });
    
    // User Detail
    builder
      .addCase(fetchUserDetail.pending, (state) => {
        state.selectedUser.loading = true;
        state.selectedUser.error = null;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.selectedUser.loading = false;
        state.selectedUser.data = action.payload;
        state.selectedUser.error = null;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.selectedUser.loading = false;
        state.selectedUser.error = action.payload || 'خطا در بارگذاری اطلاعات کاربر';
      });
    
    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.success = false;
        state.updateStatus.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
        state.selectedUser.data = action.payload;
        
        // آپدیت در لیست
        const index = state.users.data.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users.data[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در ذخیره اطلاعات';
      });
    
    // Create User
    builder
      .addCase(createUser.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.success = false;
        state.updateStatus.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
        state.users.data.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در ایجاد کاربر';
      });
    
    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.users.data = state.users.data.filter((u) => u.id !== action.payload);
        state.updateStatus.success = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در حذف کاربر';
      });
    
    // ═════════════════════════════════════════════════════════
    // Employee
    // ═════════════════════════════════════════════════════════
    builder
      .addCase(updateEmployee.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.success = false;
        state.updateStatus.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
        
        // آپدیت employee_details در selectedUser
        if (state.selectedUser.data) {
          state.selectedUser.data.employee_details = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در ذخیره اطلاعات کارمند';
      });
    
    // ═════════════════════════════════════════════════════════
    // Dropdowns
    // ═════════════════════════════════════════════════════════
    builder
      .addCase(fetchDropdowns.pending, (state) => {
        state.dropdownsLoading = true;
        state.dropdownsError = null;
      })
      .addCase(fetchDropdowns.fulfilled, (state, action) => {
        state.dropdownsLoading = false;
        state.positions = action.payload.positions;
        state.skillLevels = action.payload.skillLevels;
        state.employmentTypes = action.payload.employmentTypes;
        state.projects = action.payload.projects;
      })
      .addCase(fetchDropdowns.rejected, (state, action) => {
        state.dropdownsLoading = false;
        state.dropdownsError = action.payload || 'خطا در بارگذاری داده‌ها';
      });
    
    // Individual Dropdowns
    builder
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload;
      })
      .addCase(fetchSkillLevels.fulfilled, (state, action) => {
        state.skillLevels = action.payload;
      })
      .addCase(fetchEmploymentTypes.fulfilled, (state, action) => {
        state.employmentTypes = action.payload;
      });
    
    // ═════════════════════════════════════════════════════════
    // Contracts
    // ═════════════════════════════════════════════════════════
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.contracts.loading = true;
        state.contracts.error = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.contracts.loading = false;
        state.contracts.data = action.payload;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.contracts.loading = false;
        state.contracts.error = action.payload || 'خطا در بارگذاری قراردادها';
      });
    
    // Create Contract
    builder
      .addCase(createContract.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.success = false;
        state.updateStatus.error = null;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
        state.contracts.data.push(action.payload);
        
        // آپدیت در selectedUser
        if (state.selectedUser.data?.employee_details) {
          if (!state.selectedUser.data.employee_details.contracts) {
            state.selectedUser.data.employee_details.contracts = [];
          }
          state.selectedUser.data.employee_details.contracts.push(action.payload);
        }
      })
      .addCase(createContract.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در ایجاد قرارداد';
      });
    
    // Update Contract
    builder
      .addCase(updateContract.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.success = false;
        state.updateStatus.error = null;
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
        
        // آپدیت در لیست
        const index = state.contracts.data.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts.data[index] = action.payload;
        }
        
        // آپدیت در selectedUser
        if (state.selectedUser.data?.employee_details?.contracts) {
          const userContractIndex = state.selectedUser.data.employee_details.contracts.findIndex(
            (c) => c.id === action.payload.id
          );
          if (userContractIndex !== -1) {
            state.selectedUser.data.employee_details.contracts[userContractIndex] = action.payload;
          }
        }
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در ویرایش قرارداد';
      });
    
    // Delete Contract
    builder
      .addCase(deleteContract.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.contracts.data = state.contracts.data.filter((c) => c.id !== action.payload);
        
        // حذف از selectedUser
        if (state.selectedUser.data?.employee_details?.contracts) {
          state.selectedUser.data.employee_details.contracts = 
            state.selectedUser.data.employee_details.contracts.filter(
              (c) => c.id !== action.payload
            );
        }
        
        state.updateStatus.success = true;
      })
      .addCase(deleteContract.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || 'خطا در حذف قرارداد';
      });
    
    // ═════════════════════════════════════════════════════════
    // Employment Types Management
    // ═════════════════════════════════════════════════════════
    builder
      .addCase(createEmploymentType.fulfilled, (state, action) => {
        state.employmentTypes.push(action.payload);
        state.updateStatus.success = true;
      })
      .addCase(updateEmploymentType.fulfilled, (state, action) => {
        const index = state.employmentTypes.findIndex((et) => et.id === action.payload.id);
        if (index !== -1) {
          state.employmentTypes[index] = action.payload;
        }
        state.updateStatus.success = true;
      });
  },
});

export const {
  clearSelectedUser,
  resetUpdateStatus,
  clearUsersError,
  clearContractsError,
} = adminSlice.actions;

export default adminSlice.reducer;
