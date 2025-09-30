// src/features/roles/roleSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const ROLES_API = 'http://127.0.0.1:8000/api/roles/'

// ======================================================
// 🟢 Thunks
// ======================================================

// 1️⃣ لیست نقش‌ها
export const listRolesThunk = createAsyncThunk(
  'roles/list',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(ROLES_API, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 2️⃣ گرفتن یک نقش خاص
export const getRoleThunk = createAsyncThunk(
  'roles/get',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(`${ROLES_API}${id}/`, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 3️⃣ ساخت نقش جدید
export const createRoleThunk = createAsyncThunk(
  'roles/create',
  async (roleData, { getState, rejectWithValue, dispatch }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` } 
      }
      const { data } = await axios.post(ROLES_API, roleData, config)
      dispatch(listRolesThunk()) // رفرش لیست بعد از ساخت
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 4️⃣ آپدیت نقش
export const updateRoleThunk = createAsyncThunk(
  'roles/update',
  async ({ id, roleData }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` } 
      }
      const { data } = await axios.put(`${ROLES_API}${id}/`, roleData, config)
      dispatch(listRolesThunk())
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 5️⃣ حذف نقش
export const deleteRoleThunk = createAsyncThunk(
  'roles/delete',
  async (id, { getState, rejectWithValue, dispatch }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      await axios.delete(`${ROLES_API}${id}/`, config)
      dispatch(listRolesThunk())
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 6️⃣ مدیریت دسترسی RolePermission (POST یا PUT)
export const manageRolePermissionThunk = createAsyncThunk(
  'roles/managePermission',
  async ({ roleId, permissionData }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` } 
      }
      const { data } = await axios.post(`${ROLES_API}${roleId}/permissions/`, permissionData, config)
      dispatch(listRolesThunk())
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 7️⃣ گرفتن لیست مدل‌ها
export const listModelsThunk = createAsyncThunk(
  'roles/listModels',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(`${ROLES_API}models/`, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 8️⃣ گرفتن permissionهای یک نقش
export const fetchRolePermissionsThunk = createAsyncThunk(
  'rolePermissions/fetch',
  async (roleId, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(`${ROLES_API}${roleId}/permissions/`, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'خطا در دریافت')
    }
  }
)

// ======================================================
// 🟢 Slice: rolePermissions
// ======================================================
const rolePermissionSlice = createSlice({
  name: 'rolePermissions',
  initialState: { permissions: [], loading: false, error: null },
  reducers: {
    resetRolePermissions: (state) => {
      state.permissions = []
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRolePermissionsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRolePermissionsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.permissions = action.payload
      })
      .addCase(fetchRolePermissionsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const rolePermissionReducer = rolePermissionSlice.reducer
export const { resetRolePermissions } = rolePermissionSlice.actions

// ======================================================
// 🟢 Slice: roleList
// ======================================================
const initialState = {
  roles: [],
  loading: false,
  error: null,

  role: null,
  roleLoading: false,
  roleError: null,

  createLoading: false,
  createError: null,
  successCreate: false,

  updateLoading: false,
  updateError: null,
  successUpdate: false,

  deleteLoading: false,
  deleteError: null,
  successDelete: false,

  permLoading: false,
  permError: null,
  permSuccess: false,

  models: [],
  modelsLoading: false,
  modelsError: null,
}

const roleSlice = createSlice({
  name: 'roleList',
  initialState,
  reducers: {
    resetRoleCreate(state) {
      state.createLoading = false
      state.createError = null
      state.successCreate = false
    },
    resetRoleUpdate(state) {
      state.updateLoading = false
      state.updateError = null
      state.successUpdate = false
    },
    resetRoleDelete(state) {
      state.deleteLoading = false
      state.deleteError = null
      state.successDelete = false
    },
    resetRolePermission(state) {
      state.permLoading = false
      state.permError = null
      state.permSuccess = false
    },
    clearRoleDetail(state) {
      state.role = null
      state.roleError = null
      state.roleLoading = false
    }
  },
  extraReducers: (builder) => {
    // listRoles
    builder.addCase(listRolesThunk.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(listRolesThunk.fulfilled, (state, action) => {
      state.loading = false
      state.roles = action.payload
    })
    builder.addCase(listRolesThunk.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // getRole
    builder.addCase(getRoleThunk.pending, (state) => {
      state.roleLoading = true
      state.roleError = null
    })
    builder.addCase(getRoleThunk.fulfilled, (state, action) => {
      state.roleLoading = false
      state.role = action.payload
    })
    builder.addCase(getRoleThunk.rejected, (state, action) => {
      state.roleLoading = false
      state.roleError = action.payload
    })

    // createRole
    builder.addCase(createRoleThunk.pending, (state) => {
      state.createLoading = true
      state.createError = null
      state.successCreate = false
    })
    builder.addCase(createRoleThunk.fulfilled, (state, action) => {
      state.createLoading = false
      state.successCreate = true
      if (action.payload) state.roles.unshift(action.payload)
    })
    builder.addCase(createRoleThunk.rejected, (state, action) => {
      state.createLoading = false
      state.createError = action.payload
    })

    // updateRole
    builder.addCase(updateRoleThunk.pending, (state) => {
      state.updateLoading = true
      state.updateError = null
      state.successUpdate = false
    })
    builder.addCase(updateRoleThunk.fulfilled, (state, action) => {
      state.updateLoading = false
      state.successUpdate = true
      const updated = action.payload
      state.roles = state.roles.map(r => (r.id === updated.id ? updated : r))
    })
    builder.addCase(updateRoleThunk.rejected, (state, action) => {
      state.updateLoading = false
      state.updateError = action.payload
    })

    // deleteRole
    builder.addCase(deleteRoleThunk.pending, (state) => {
      state.deleteLoading = true
      state.deleteError = null
      state.successDelete = false
    })
    builder.addCase(deleteRoleThunk.fulfilled, (state, action) => {
      state.deleteLoading = false
      state.successDelete = true
      state.roles = state.roles.filter(r => r.id !== action.payload)
    })
    builder.addCase(deleteRoleThunk.rejected, (state, action) => {
      state.deleteLoading = false
      state.deleteError = action.payload
    })

    // manageRolePermission
    builder.addCase(manageRolePermissionThunk.pending, (state) => {
      state.permLoading = true
      state.permError = null
      state.permSuccess = false
    })
    builder.addCase(manageRolePermissionThunk.fulfilled, (state) => {
      state.permLoading = false
      state.permSuccess = true
    })
    builder.addCase(manageRolePermissionThunk.rejected, (state, action) => {
      state.permLoading = false
      state.permError = action.payload
    })

    // listModels
    builder.addCase(listModelsThunk.pending, (state) => {
      state.modelsLoading = true
      state.modelsError = null
    })
    builder.addCase(listModelsThunk.fulfilled, (state, action) => {
      state.modelsLoading = false
      state.models = action.payload
    })
    builder.addCase(listModelsThunk.rejected, (state, action) => {
      state.modelsLoading = false
      state.modelsError = action.payload
    })
  }
})

export const roleReducer = roleSlice.reducer
export const {
  resetRoleCreate,
  resetRoleUpdate,
  resetRoleDelete,
  resetRolePermission,
  clearRoleDetail
} = roleSlice.actions
