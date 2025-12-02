// src/features/admin/adminSlice.jsx
// ⚠️ [translate:فایل کامل - جایگزین کن]

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/admin';

// ═══════════════════════════════════════════════════════════
// 🛠️ Helper Functions
// ═══════════════════════════════════════════════════════════

const extractErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object' && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
      if (firstKey) return data[firstKey];
    }
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
  }
  return error.message || 'خطای ناشناخته رخ داد';
};

const getAuthConfig = (getState, isMultipart = false) => {
  const { userLogin } = getState();
  const token = userLogin?.userInfo?.access;
  if (!token) throw new Error('توکن احراز هویت یافت نشد');
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
      const { data } = await axios.get(`${API_BASE}/users/`, { ...config, params });
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
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/users/${userId}/update/`, userData, config);
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
      const config = getAuthConfig(getState);
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
      const config = getAuthConfig(getState);
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
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/employees/${employeeId}/`, employeeData, config);
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
      const { data } = await axios.get(`${API_BASE}/contracts/`, { ...config, params });
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
      const config = getAuthConfig(getState);
      const { data } = await axios.post(`${API_BASE}/contracts/`, contractData, config);
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
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/contracts/${contractId}/`, contractData, config);
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
      const config = getAuthConfig(getState);
      await axios.delete(`${API_BASE}/contracts/${contractId}/`, config);
      return contractId;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🔄 Async Thunks - Dropdowns (GET)
// ═══════════════════════════════════════════════════════════

export const fetchDropdowns = createAsyncThunk(
  'admin/fetchDropdowns',
  async (_, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const [positions, skillLevels, employmentTypes, leaveTypes] = await Promise.all([
        axios.get(`${API_BASE}/dropdowns/positions/`, config),
        axios.get(`${API_BASE}/dropdowns/skill-levels/`, config),
        axios.get(`${API_BASE}/dropdowns/employment-types/`, config),
        axios.get(`${API_BASE}/dropdowns/leave-types/`, config),
      ]);
      return {
        positions: positions.data || [],
        skillLevels: skillLevels.data || [],
        employmentTypes: employmentTypes.data || [],
        leaveTypes: leaveTypes.data || [],
      };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 👔 Employment Types - CRUD
// ═══════════════════════════════════════════════════════════

export const createEmploymentType = createAsyncThunk(
  'admin/createEmploymentType',
  async (employmentTypeData, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.post(`${API_BASE}/employment-types/`, employmentTypeData, config);
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
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/employment-types/${id}/`, employmentTypeData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteEmploymentType = createAsyncThunk(
  'admin/deleteEmploymentType',
  async (id, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      await axios.delete(`${API_BASE}/employment-types/${id}/delete/`, config);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🎯 Positions - CRUD
// ═══════════════════════════════════════════════════════════

export const createPosition = createAsyncThunk(
  'admin/createPosition',
  async (positionData, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.post(`${API_BASE}/positions/`, positionData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updatePosition = createAsyncThunk(
  'admin/updatePosition',
  async ({ id, data: positionData }, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/positions/${id}/`, positionData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deletePosition = createAsyncThunk(
  'admin/deletePosition',
  async (id, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      await axios.delete(`${API_BASE}/positions/${id}/delete/`, config);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// ⭐ Skill Levels - CRUD
// ═══════════════════════════════════════════════════════════

export const createSkillLevel = createAsyncThunk(
  'admin/createSkillLevel',
  async (skillLevelData, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.post(`${API_BASE}/skill-levels/`, skillLevelData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateSkillLevel = createAsyncThunk(
  'admin/updateSkillLevel',
  async ({ id, data: skillLevelData }, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/skill-levels/${id}/`, skillLevelData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteSkillLevel = createAsyncThunk(
  'admin/deleteSkillLevel',
  async (id, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      await axios.delete(`${API_BASE}/skill-levels/${id}/delete/`, config);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🏖️ Leave Types - CRUD
// ═══════════════════════════════════════════════════════════

export const createLeaveType = createAsyncThunk(
  'admin/createLeaveType',
  async (leaveTypeData, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.post(`${API_BASE}/leave-types/`, leaveTypeData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateLeaveType = createAsyncThunk(
  'admin/updateLeaveType',
  async ({ id, data: leaveTypeData }, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      const { data } = await axios.put(`${API_BASE}/leave-types/${id}/`, leaveTypeData, config);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteLeaveType = createAsyncThunk(
  'admin/deleteLeaveType',
  async (id, { rejectWithValue, getState }) => {
    try {
      const config = getAuthConfig(getState);
      await axios.delete(`${API_BASE}/leave-types/${id}/delete/`, config);
      return id;
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
    users: { data: [], loading: false, error: null },
    selectedUser: { data: null, loading: false, error: null },
    updateStatus: { loading: false, success: false, error: null },
    
    // Dropdowns
    positions: [],
    skillLevels: [],
    employmentTypes: [],
    leaveTypes: [],
    dropdownsLoading: false,
    dropdownsError: null,
    
    contracts: { data: [], loading: false, error: null },
  },
  
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = { data: null, loading: false, error: null };
    },
    resetUpdateStatus: (state) => {
      state.updateStatus = { loading: false, success: false, error: null };
    },
    clearUsersError: (state) => {
      state.users.error = null;
    },
    clearContractsError: (state) => {
      state.contracts.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // ════════════════════════════════════════════════════
    // Users
    // ════════════════════════════════════════════════════
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload || 'خطا در بارگذاری کاربران';
      });
    
    builder
      .addCase(fetchUserDetail.pending, (state) => {
        state.selectedUser.loading = true;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.selectedUser.loading = false;
        state.selectedUser.data = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.selectedUser.loading = false;
        state.selectedUser.error = action.payload;
      });
    
    builder
      .addCase(updateUser.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.selectedUser.data = action.payload;
        const index = state.users.data.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users.data[index] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(createUser.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.users.data.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(deleteUser.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.users.data = state.users.data.filter((u) => u.id !== action.payload);
        state.updateStatus.success = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      });
    
    // ════════════════════════════════════════════════════
    // Employee
    // ════════════════════════════════════════════════════
    builder
      .addCase(updateEmployee.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        if (state.selectedUser.data) {
          state.selectedUser.data.employee_details = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    // ════════════════════════════════════════════════════
    // Dropdowns
    // ════════════════════════════════════════════════════
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
        state.leaveTypes = action.payload.leaveTypes;
      })
      .addCase(fetchDropdowns.rejected, (state, action) => {
        state.dropdownsLoading = false;
        state.dropdownsError = action.payload;
      });
    
    // ════════════════════════════════════════════════════
    // Contracts
    // ════════════════════════════════════════════════════
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.contracts.loading = true;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.contracts.loading = false;
        state.contracts.data = action.payload;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.contracts.loading = false;
        state.contracts.error = action.payload;
      });
    
    builder
      .addCase(createContract.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.contracts.data.push(action.payload);
        if (state.selectedUser.data?.employee_details) {
          if (!state.selectedUser.data.employee_details.contracts) {
            state.selectedUser.data.employee_details.contracts = [];
          }
          state.selectedUser.data.employee_details.contracts.push(action.payload);
        }
      })
      .addCase(createContract.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(updateContract.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.contracts.data.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.contracts.data[index] = action.payload;
        
        if (state.selectedUser.data?.employee_details?.contracts) {
          const userIndex = state.selectedUser.data.employee_details.contracts.findIndex(
            (c) => c.id === action.payload.id
          );
          if (userIndex !== -1) {
            state.selectedUser.data.employee_details.contracts[userIndex] = action.payload;
          }
        }
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(deleteContract.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.contracts.data = state.contracts.data.filter((c) => c.id !== action.payload);
        
        if (state.selectedUser.data?.employee_details?.contracts) {
          state.selectedUser.data.employee_details.contracts = 
            state.selectedUser.data.employee_details.contracts.filter((c) => c.id !== action.payload);
        }
        state.updateStatus.success = true;
      })
      .addCase(deleteContract.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      });
    
    // ════════════════════════════════════════════════════
    // 👔 Employment Types
    // ════════════════════════════════════════════════════
    builder
      .addCase(createEmploymentType.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(createEmploymentType.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.employmentTypes.push(action.payload);
      })
      .addCase(createEmploymentType.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(updateEmploymentType.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updateEmploymentType.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.employmentTypes.findIndex((et) => et.id === action.payload.id);
        if (index !== -1) state.employmentTypes[index] = action.payload;
      })
      .addCase(updateEmploymentType.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(deleteEmploymentType.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deleteEmploymentType.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.employmentTypes = state.employmentTypes.filter((et) => et.id !== action.payload);
        state.updateStatus.success = true;
      })
      .addCase(deleteEmploymentType.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      });
    
    // ════════════════════════════════════════════════════
    // 🎯 Positions
    // ════════════════════════════════════════════════════
    builder
      .addCase(createPosition.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(createPosition.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.positions.push(action.payload);
      })
      .addCase(createPosition.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(updatePosition.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updatePosition.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.positions.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.positions[index] = action.payload;
      })
      .addCase(updatePosition.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(deletePosition.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deletePosition.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.positions = state.positions.filter((p) => p.id !== action.payload);
        state.updateStatus.success = true;
      })
      .addCase(deletePosition.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      });
    
    // ════════════════════════════════════════════════════
    // ⭐ Skill Levels
    // ════════════════════════════════════════════════════
    builder
      .addCase(createSkillLevel.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(createSkillLevel.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.skillLevels.push(action.payload);
      })
      .addCase(createSkillLevel.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(updateSkillLevel.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updateSkillLevel.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.skillLevels.findIndex((sl) => sl.id === action.payload.id);
        if (index !== -1) state.skillLevels[index] = action.payload;
      })
      .addCase(updateSkillLevel.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(deleteSkillLevel.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deleteSkillLevel.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.skillLevels = state.skillLevels.filter((sl) => sl.id !== action.payload);
        state.updateStatus.success = true;
      })
      .addCase(deleteSkillLevel.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
      });
    
    // ════════════════════════════════════════════════════
    // 🏖️ Leave Types
    // ════════════════════════════════════════════════════
    builder
      .addCase(createLeaveType.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(createLeaveType.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.leaveTypes.push(action.payload);
      })
      .addCase(createLeaveType.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(updateLeaveType.pending, (state) => {
        state.updateStatus = { loading: true, success: false, error: null };
      })
      .addCase(updateLeaveType.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.leaveTypes.findIndex((lt) => lt.id === action.payload.id);
        if (index !== -1) state.leaveTypes[index] = action.payload;
      })
      .addCase(updateLeaveType.rejected, (state, action) => {
        state.updateStatus = { loading: false, success: false, error: action.payload };
      });
    
    builder
      .addCase(deleteLeaveType.pending, (state) => {
        state.updateStatus.loading = true;
      })
      .addCase(deleteLeaveType.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.leaveTypes = state.leaveTypes.filter((lt) => lt.id !== action.payload);
        state.updateStatus.success = true;
      })
      .addCase(deleteLeaveType.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload;
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
