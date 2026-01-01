// src/features/admin/adminSlice.jsx
// ⚠️ فایل کامل و نهایی - جایگزین فایل قبلی شود

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 🔄 ASYNC THUNKS
// ═══════════════════════════════════════════════════════════

// 👥 Users
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (role = '', { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/${role ? `?role=${role}` : ''}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت کاربران');
    }
  }
);

export const fetchUserDetail = createAsyncThunk(
  'admin/fetchUserDetail',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/${userId}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت جزئیات کاربر');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/users/${userId}/update/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش کاربر');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${userId}/delete/`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف کاربر');
    }
  }
);

// 👔 Employees
export const updateEmployee = createAsyncThunk(
  'admin/updateEmployee',
  async ({ employeeId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/employees/${employeeId}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش کارمند');
    }
  }
);

export const fetchEmployeeLeaveSummary = createAsyncThunk(
  'admin/fetchEmployeeLeaveSummary',
  async ({ employeeId, year }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/employees/${employeeId}/leave-summary/?year=${year}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت موجودی مرخصی');
    }
  }
);

// 📝 Contracts
export const fetchContracts = createAsyncThunk(
  'admin/fetchContracts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/contracts/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت قراردادها');
    }
  }
);

export const createContract = createAsyncThunk(
  'admin/createContract',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/contracts/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ایجاد قرارداد');
    }
  }
);

export const updateContract = createAsyncThunk(
  'admin/updateContract',
  async ({ contractId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/contracts/${contractId}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش قرارداد');
    }
  }
);

export const deleteContract = createAsyncThunk(
  'admin/deleteContract',
  async (contractId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/contracts/${contractId}/`);
      return contractId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف قرارداد');
    }
  }
);

// 📋 Dropdowns - Individual
export const fetchPositions = createAsyncThunk(
  'admin/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dropdowns/positions/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت سمت‌ها');
    }
  }
);

export const fetchSkillLevels = createAsyncThunk(
  'admin/fetchSkillLevels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dropdowns/skill-levels/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت سطوح مهارت');
    }
  }
);

export const fetchEmploymentTypes = createAsyncThunk(
  'admin/fetchEmploymentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dropdowns/employment-types/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت انواع استخدام');
    }
  }
);

export const fetchLeaveTypes = createAsyncThunk(
  'admin/fetchLeaveTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dropdowns/leave-types/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت انواع مرخصی');
    }
  }
);

// 📋 Dropdowns - Batch
export const fetchDropdowns = createAsyncThunk(
  'admin/fetchDropdowns',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const results = await Promise.allSettled([
        dispatch(fetchPositions()).unwrap(),
        dispatch(fetchSkillLevels()).unwrap(),
        dispatch(fetchEmploymentTypes()).unwrap(),
        dispatch(fetchLeaveTypes()).unwrap(),
      ]);

      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason);

      if (errors.length > 0) {
        return rejectWithValue(errors[0]);
      }

      return { success: true };
    } catch (error) {
      return rejectWithValue('خطا در بارگذاری داده‌ها');
    }
  }
);

// 👔 Employment Types - CRUD
export const createEmploymentType = createAsyncThunk(
  'admin/createEmploymentType',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/employment-types/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ایجاد نوع استخدام');
    }
  }
);

export const updateEmploymentType = createAsyncThunk(
  'admin/updateEmploymentType',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/employment-types/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش نوع استخدام');
    }
  }
);

export const deleteEmploymentType = createAsyncThunk(
  'admin/deleteEmploymentType',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/employment-types/${id}/delete/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف نوع استخدام');
    }
  }
);

// 🎯 Positions - CRUD
export const createPosition = createAsyncThunk(
  'admin/createPosition',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/positions/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ایجاد سمت');
    }
  }
);

export const updatePosition = createAsyncThunk(
  'admin/updatePosition',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/positions/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش سمت');
    }
  }
);

export const deletePosition = createAsyncThunk(
  'admin/deletePosition',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/positions/${id}/delete/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف سمت');
    }
  }
);

// ⭐ Skill Levels - CRUD
export const createSkillLevel = createAsyncThunk(
  'admin/createSkillLevel',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/skill-levels/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ایجاد سطح مهارت');
    }
  }
);

export const updateSkillLevel = createAsyncThunk(
  'admin/updateSkillLevel',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/skill-levels/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش سطح مهارت');
    }
  }
);

export const deleteSkillLevel = createAsyncThunk(
  'admin/deleteSkillLevel',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/skill-levels/${id}/delete/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف سطح مهارت');
    }
  }
);

// 🏖️ Leave Types - CRUD
export const createLeaveType = createAsyncThunk(
  'admin/createLeaveType',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/leave-types/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ایجاد نوع مرخصی');
    }
  }
);

export const updateLeaveType = createAsyncThunk(
  'admin/updateLeaveType',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/leave-types/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ویرایش نوع مرخصی');
    }
  }
);

export const deleteLeaveType = createAsyncThunk(
  'admin/deleteLeaveType',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/leave-types/${id}/delete/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در حذف نوع مرخصی');
    }
  }
);

// 🏖️ Leave Requests
export const fetchLeaveRequests = createAsyncThunk(
  'admin/fetchLeaveRequests',
  async (status = '', { rejectWithValue }) => {
    try {
      const url = status 
        ? `/admin/leave-requests/?status=${status}`
        : '/admin/leave-requests/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت درخواست‌ها');
    }
  }
);

export const approveLeaveRequest = createAsyncThunk(
  'admin/approveLeaveRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await api.post(`/admin/leave-requests/${requestId}/approve/`);
      return requestId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در تایید درخواست');
    }
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  'admin/rejectLeaveRequest',
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      await api.post(`/admin/leave-requests/${requestId}/reject/`, { reason });
      return requestId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در رد درخواست');
    }
  }
);
export const getSchemeJobClasses = createAsyncThunk(
  'admin/getSchemeJobClasses',
  async () => {
    const response = await api.get('/admin/scheme/job-classes/');
    return response.data;
  }
);

export const getSchemeJobGroups = createAsyncThunk(
  'admin/getSchemeJobGroups',
  async ({ year, group } = {}) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (group) params.append('group', group);
    const response = await api.get('/admin/scheme/job-groups/', { params });
    return response.data;
  }
);

export const getSchemeContracts = createAsyncThunk(
  'admin/getSchemeContracts',
  async ({ employeeId, projectId, contractId } = {}) => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employee_id', employeeId);
    if (projectId) params.append('project_id', projectId);
    if (contractId) params.append('contract_id', contractId);
    const response = await api.get('/admin/scheme/contracts/', { params });
    return response.data;
  }
);

export const createSchemeContract = createAsyncThunk(
  'admin/createSchemeContract',
  async (data) => {
    const response = await api.post('/admin/scheme/contracts/', data);
    return response.data;
  }
);

export const updateSchemeContract = createAsyncThunk(
  'admin/updateSchemeContract',
  async ({ id, data }) => {
    const response = await api.put(`/admin/scheme/contracts/${id}/`, data);
    return response.data;
  }
);

export const recalculateSchemeContract = createAsyncThunk(
  'admin/recalculateSchemeContract',
  async (id) => {
    const response = await api.post(`/admin/scheme/contracts/${id}/recalculate/`);
    return response.data;
  }
);
// ═══════════════════════════════════════════════════════════
// 📦 INITIAL STATE
// ═══════════════════════════════════════════════════════════

const initialState = {

  scheme: {
    contracts: [],
    jobClasses: [],
    jobGroups: [],
  },
  users: [],
  selectedUser: null,
  contracts: [],
  positions: [],
  skillLevels: [],
  employmentTypes: [],
  leaveTypes: [],
  leaveRequests: [],
  leaveSummary: null,
  
  loading: {
    users: false,
    userDetail: false,  
    contracts: false,
    leaveSummary: false,
    leaveRequests: false,
  },

  dropdownsLoading: false,
  dropdownsError: null,
  
  updateStatus: {
    loading: false,
    success: false,
    error: null,
  },
};

// ═══════════════════════════════════════════════════════════
// 🎯 SLICE
// ═══════════════════════════════════════════════════════════

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetUpdateStatus: (state) => {
      state.updateStatus = { loading: false, success: false, error: null };
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearLeaveSummary: (state) => {
      state.leaveSummary = null;
    },
  },
  extraReducers: (builder) => {
    // 👥 Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading.users = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading.users = false;
      })
      
      .addCase(fetchUserDetail.pending, (state) => {
        state.loading.userDetail = true;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.loading.userDetail = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.loading.userDetail = false;
        console.error('Fetch user detail failed:', action.payload);
      })
      
      .addCase(updateUser.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      })
      
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      });

    // 👔 Employees
    builder
      .addCase(updateEmployee.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        
        // ✅ [FIX] استفاده از employee_details به جای employee
        if (state.selectedUser && 
            state.selectedUser.employee_details && 
            state.selectedUser.employee_details.id === action.payload.id) {
            
            state.selectedUser.employee_details = {
                ...state.selectedUser.employee_details,
                ...action.payload,
            };
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      })
      
      .addCase(fetchEmployeeLeaveSummary.pending, (state) => {
        state.loading.leaveSummary = true;
      })
      .addCase(fetchEmployeeLeaveSummary.fulfilled, (state, action) => {
        state.loading.leaveSummary = false;
        state.leaveSummary = action.payload;
      })
      .addCase(fetchEmployeeLeaveSummary.rejected, (state) => {
        state.loading.leaveSummary = false;
      });

    // 📝 Contracts
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.loading.contracts = true;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading.contracts = false;
        state.contracts = action.payload;
      })
      .addCase(fetchContracts.rejected, (state) => {
        state.loading.contracts = false;
      })
      
      .addCase(createContract.fulfilled, (state, action) => {
        state.contracts.push(action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
        
        // ✅ [FIX] استفاده از employee_details
        if (state.selectedUser?.employee_details?.id === action.payload.employee) {
          if (!state.selectedUser.employee_details.contracts) {
            state.selectedUser.employee_details.contracts = [];
          }
          state.selectedUser.employee_details.contracts.unshift(action.payload);
        }
      })
      
      .addCase(updateContract.fulfilled, (state, action) => {
        const index = state.contracts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.contracts[index] = action.payload;
        state.updateStatus = { loading: false, success: true, error: null };
        
        // ✅ [FIX] استفاده از employee_details
        if (state.selectedUser?.employee_details?.contracts) {
          const empContractIndex = state.selectedUser.employee_details.contracts.findIndex(c => c.id === action.payload.id);
          if (empContractIndex !== -1) {
            state.selectedUser.employee_details.contracts[empContractIndex] = action.payload;
          }
        }
      })
      
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.contracts = state.contracts.filter((c) => c.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
        
        // ✅ [FIX] استفاده از employee_details
        if (state.selectedUser?.employee_details?.contracts) {
          state.selectedUser.employee_details.contracts = state.selectedUser.employee_details.contracts.filter(c => c.id !== action.payload);
        }
      });

    // 📋 Dropdowns - Batch
    builder
      .addCase(fetchDropdowns.pending, (state) => {
        state.dropdownsLoading = true;
        state.dropdownsError = null;
      })
      .addCase(fetchDropdowns.fulfilled, (state) => {
        state.dropdownsLoading = false;
      })
      .addCase(fetchDropdowns.rejected, (state, action) => {
        state.dropdownsLoading = false;
        state.dropdownsError = action.payload;
      });

    // 📋 Dropdowns - Individual
    builder
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload;
      })
      .addCase(fetchSkillLevels.fulfilled, (state, action) => {
        state.skillLevels = action.payload;
      })
      .addCase(fetchEmploymentTypes.fulfilled, (state, action) => {
        state.employmentTypes = action.payload;
      })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.leaveTypes = action.payload;
      });

    // 👔 Employment Types - CRUD
    builder
      .addCase(createEmploymentType.fulfilled, (state, action) => {
        state.employmentTypes.push(action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(updateEmploymentType.fulfilled, (state, action) => {
        const index = state.employmentTypes.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) state.employmentTypes[index] = action.payload;
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(deleteEmploymentType.fulfilled, (state, action) => {
        state.employmentTypes = state.employmentTypes.filter((e) => e.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      });

    // 🎯 Positions - CRUD
    builder
      .addCase(createPosition.fulfilled, (state, action) => {
        state.positions.push(action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(updatePosition.fulfilled, (state, action) => {
        const index = state.positions.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.positions[index] = action.payload;
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(deletePosition.fulfilled, (state, action) => {
        state.positions = state.positions.filter((p) => p.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      });

    // ⭐ Skill Levels - CRUD
    builder
      .addCase(createSkillLevel.fulfilled, (state, action) => {
        state.skillLevels.push(action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(updateSkillLevel.fulfilled, (state, action) => {
        const index = state.skillLevels.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) state.skillLevels[index] = action.payload;
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(deleteSkillLevel.fulfilled, (state, action) => {
        state.skillLevels = state.skillLevels.filter((s) => s.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      });

    // 🏖️ Leave Types - CRUD
    builder
      .addCase(createLeaveType.fulfilled, (state, action) => {
        state.leaveTypes.push(action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(updateLeaveType.fulfilled, (state, action) => {
        const index = state.leaveTypes.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) state.leaveTypes[index] = action.payload;
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(deleteLeaveType.fulfilled, (state, action) => {
        state.leaveTypes = state.leaveTypes.filter((l) => l.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      });

    // 🏖️ Leave Requests
    builder
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.loading.leaveRequests = true;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.loading.leaveRequests = false;
        state.leaveRequests = action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state) => {
        state.loading.leaveRequests = false;
      })

      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.leaveRequests = state.leaveRequests.filter(
          (r) => r.id !== action.payload
        );
        if (state.leaveSummary) {
          state.leaveSummary.pending_requests = state.leaveSummary.pending_requests.filter(
            (r) => r.id !== action.payload
          );
        }
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        if (state.leaveSummary) {
          state.leaveSummary.pending_requests = state.leaveSummary.pending_requests.filter(
            (r) => r.id !== action.payload
          );
        }
      })
      
      // ✅ اضافات به extraReducers موجود
      .addCase(getSchemeJobClasses.fulfilled, (state, action) => {
        state.scheme.jobClasses = action.payload;
      })
      .addCase(getSchemeJobGroups.fulfilled, (state, action) => {
        state.scheme.jobGroups = action.payload;
      })
      .addCase(getSchemeContracts.fulfilled, (state, action) => {
        state.scheme.contracts = action.payload;
      })
      .addCase(createSchemeContract.fulfilled, (state, action) => {
        state.scheme.contracts.push(action.payload);
      })
      .addCase(updateSchemeContract.fulfilled, (state, action) => {
        const index = state.scheme.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.scheme.contracts[index] = action.payload;
      })
      .addCase(recalculateSchemeContract.fulfilled, (state, action) => {
        const index = state.scheme.contracts.findIndex(c => c.id === action.payload.data.id);
        if (index !== -1) state.scheme.contracts[index] = action.payload.data;
      });
  },
});

export const { resetUpdateStatus, clearSelectedUser, clearLeaveSummary } = adminSlice.actions;
export default adminSlice.reducer;





