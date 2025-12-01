// src/features/admin/adminSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 📋 Async Thunks
// ═══════════════════════════════════════════════════════════

// 1️⃣ دریافت لیست همه کاربران
export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/users/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت کاربران');
    }
  }
);

// 2️⃣ دریافت جزئیات یک کاربر
export const fetchUserDetail = createAsyncThunk(
  'admin/fetchUserDetail',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/users/${userId}/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت جزئیات');
    }
  }
);

// 3️⃣ آپدیت کاربر (شخصی)
export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/admin/users/${userId}/`, userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در آپدیت کاربر');
    }
  }
);

// 4️⃣ حذف کاربر
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}/`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف کاربر');
    }
  }
);

// 5️⃣ آپدیت Employee (سازمانی)
export const updateEmployee = createAsyncThunk(
  'admin/updateEmployee',
  async ({ employeeId, employeeData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/admin/employees/${employeeId}/`,
        employeeData
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در آپدیت کارمند');
    }
  }
);

// 6️⃣ ساخت قرارداد جدید
export const createContract = createAsyncThunk(
  'admin/createContract',
  async (contractData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/admin/contracts/', contractData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ساخت قرارداد');
    }
  }
);

// 7️⃣ آپدیت قرارداد
export const updateContract = createAsyncThunk(
  'admin/updateContract',
  async ({ contractId, contractData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/admin/contracts/${contractId}/`,
        contractData
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در آپدیت قرارداد');
    }
  }
);

// 8️⃣ حذف قرارداد
export const deleteContract = createAsyncThunk(
  'admin/deleteContract',
  async (contractId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/contracts/${contractId}/`);
      return contractId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف قرارداد');
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 📋 Dropdown Lists
// ═══════════════════════════════════════════════════════════

export const fetchPositions = createAsyncThunk(
  'admin/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/dropdowns/positions/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت سمت‌ها');
    }
  }
);

export const fetchSkillLevels = createAsyncThunk(
  'admin/fetchSkillLevels',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/dropdowns/skill-levels/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت سطوح');
    }
  }
);

export const fetchEmploymentTypes = createAsyncThunk(
  'admin/fetchEmploymentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/dropdowns/employment-types/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت انواع');
    }
  }
);

export const fetchPayGrades = createAsyncThunk(
  'admin/fetchPayGrades',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/dropdowns/pay-grades/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت پایه‌ها');
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slice
// ═══════════════════════════════════════════════════════════

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    // لیست کاربران
    users: {
      list: [],
      loading: false,
      error: null,
    },

    // جزئیات یک کاربر (برای مودال)
    selectedUser: {
      data: null,
      loading: false,
      error: null,
    },

    // عملیات آپدیت
    updateStatus: {
      loading: false,
      success: false,
      error: null,
    },

    // Dropdown Lists
    positions: [],
    skillLevels: [],
    employmentTypes: [],
    payGrades: [],
    
    // فیلتر و جستجو
    filters: {
      searchTerm: '',
      role: 'all', // all, workers, staff, admin
      viewMode: 'cards', // cards, table
    },
  },

  reducers: {
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    setRoleFilter: (state, action) => {
      state.filters.role = action.payload;
    },
    setViewMode: (state, action) => {
      state.filters.viewMode = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser.data = null;
      state.selectedUser.error = null;
    },
    resetUpdateStatus: (state) => {
      state.updateStatus = { loading: false, success: false, error: null };
    },
  },

  extraReducers: (builder) => {
    builder
      // ═══════════════════════════════════════════════════════════
      // fetchAllUsers
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchAllUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.list = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // fetchUserDetail
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchUserDetail.pending, (state) => {
        state.selectedUser.loading = true;
        state.selectedUser.error = null;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.selectedUser.loading = false;
        state.selectedUser.data = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.selectedUser.loading = false;
        state.selectedUser.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // updateUser
      // ═══════════════════════════════════════════════════════════
      .addCase(updateUser.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
        
        // آپدیت در لیست
        const index = state.users.list.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users.list[index] = action.payload;
        }
        
        // آپدیت selectedUser
        if (state.selectedUser.data?.id === action.payload.id) {
          state.selectedUser.data = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // deleteUser
      // ═══════════════════════════════════════════════════════════
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users.list = state.users.list.filter((u) => u.id !== action.payload);
      })

      // ═══════════════════════════════════════════════════════════
      // updateEmployee
      // ═══════════════════════════════════════════════════════════
      .addCase(updateEmployee.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(updateEmployee.fulfilled, (state) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // createContract / updateContract
      // ═══════════════════════════════════════════════════════════
      .addCase(createContract.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(createContract.fulfilled, (state) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
      })
      .addCase(createContract.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      })

      .addCase(updateContract.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(updateContract.fulfilled, (state) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // Dropdown Lists
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload;
      })
      .addCase(fetchSkillLevels.fulfilled, (state, action) => {
        state.skillLevels = action.payload;
      })
      .addCase(fetchEmploymentTypes.fulfilled, (state, action) => {
        state.employmentTypes = action.payload;
      })
      .addCase(fetchPayGrades.fulfilled, (state, action) => {
        state.payGrades = action.payload;
      });
  },
});

export const {
  setSearchTerm,
  setRoleFilter,
  setViewMode,
  clearSelectedUser,
  resetUpdateStatus,
} = adminSlice.actions;

export default adminSlice.reducer;
