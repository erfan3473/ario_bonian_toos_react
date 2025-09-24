// src/features/users/userSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// ===================================================================
// 🧠 بخش ۱: Constants
// ===================================================================
const API_BASE = 'http://127.0.0.1:8000/api/users/'

// ===================================================================
// 🧠 بخش ۲: Async Thunks (همگی در اینجا تعریف می‌شوند)
// ===================================================================

// --- Thunks for Authentication ---
export const loginThunk = createAsyncThunk('user/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } }
    const { data } = await axios.post(`${API_BASE}login/`, { username, password }, config)
    localStorage.setItem('userInfo', JSON.stringify(data))
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

export const registerThunk = createAsyncThunk('user/register', async ({ username, password, password2 }, { rejectWithValue }) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } }
    const { data } = await axios.post(`${API_BASE}register/`, { username, password, password2 }, config)
    localStorage.setItem('userInfo', JSON.stringify(data))
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

// --- Thunks for User Profile ---
export const getUserDetailsThunk = createAsyncThunk('user/details', async (id = 'profile', { getState, rejectWithValue }) => {
  try {
    const { userLogin: { userInfo } } = getState()
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
    const endpoint = id === 'profile' ? 'profile/' : `${id}/`
    const { data } = await axios.get(`${API_BASE}${endpoint}`, config)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

export const updateUserProfileThunk = createAsyncThunk('user/updateProfile', async (userPayload, { getState, rejectWithValue }) => {
  try {
    const { userLogin: { userInfo } } = getState()
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userInfo?.token}`
      }
    }
    const { data } = await axios.put(`${API_BASE}profile/update/`, userPayload, config)
    localStorage.setItem('userInfo', JSON.stringify(data))
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

// --- Thunks for Admin Actions ---
export const listUsersThunk = createAsyncThunk('user/list', async (_, { getState, rejectWithValue }) => {
  try {
    const { userLogin: { userInfo } } = getState()
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
    const { data } = await axios.get(API_BASE, config)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

export const deleteUserThunk = createAsyncThunk('user/delete', async (id, { getState, rejectWithValue }) => {
  try {
    const { userLogin: { userInfo } } = getState()
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
    await axios.delete(`${API_BASE}delete/${id}/`, config)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

export const updateUserByAdminThunk = createAsyncThunk('user/updateByAdmin', async (userData, { getState, rejectWithValue }) => {
    try {
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` },
        };
        const { data } = await axios.put(`${API_BASE}update/${userData.id}/`, userData, config);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.detail || err.message);
    }
});


export const updateUserRoleThunk = createAsyncThunk('user/updateRole', async ({ userId, roleId, projectId }, { getState, rejectWithValue }) => {
  try {
    const { userLogin: { userInfo } } = getState()
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` }
    }
    const { data } = await axios.post(`${API_BASE}assign-role/`, { user_id: userId, role_id: roleId, project_id: projectId }, config)
    return {
        userId: data.user_id,
        projectId: data.project.id,
        projectName: data.project.name,
        roleId: data.role.id,
        roleName: data.role.name,
    };
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

// --- Thunks for Roles Resource ---
export const listRolesThunk = createAsyncThunk('roles/list', async (_, { getState, rejectWithValue }) => {
  try {
    const { userLogin: { userInfo } } = getState()
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
    const { data } = await axios.get(`${API_BASE}roles/`, config)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || err.message)
  }
})

// ===================================================================
// 🧠 بخش ۳: Slice Definitions (تمام اسلایس‌ها در اینجا هستند)
// ===================================================================

const userInfoFromStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null

// --- Slice for Login State ---
const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState: { userInfo: userInfoFromStorage },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('userInfo')
      state.userInfo = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true })
      .addCase(loginThunk.fulfilled, (state, action) => { state.loading = false; state.userInfo = action.payload })
      .addCase(loginThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(registerThunk.fulfilled, (state, action) => { state.userInfo = action.payload })
      .addCase(updateUserProfileThunk.fulfilled, (state, action) => { state.userInfo = action.payload })
  }
})

// --- Slice for Registration Process ---
const userRegisterSlice = createSlice({
    name: 'userRegister',
    initialState: {},
    extraReducers: (builder) => {
        builder
            .addCase(registerThunk.pending, (state) => { state.loading = true; })
            .addCase(registerThunk.fulfilled, (state) => { state.loading = false; state.success = true; })
            .addCase(registerThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

// --- Slice for User List (Admin) ---
const userListSlice = createSlice({
  name: 'userList',
  initialState: { users: [] },
  extraReducers: (builder) => {
    builder
      .addCase(listUsersThunk.pending, (state) => { state.loading = true })
      .addCase(listUsersThunk.fulfilled, (state, action) => { state.loading = false; state.users = action.payload })
      .addCase(listUsersThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(deleteUserThunk.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload)
      })
      .addCase(updateUserByAdminThunk.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) { state.users[index] = action.payload; }
      })
      .addCase(updateUserRoleThunk.fulfilled, (state, action) => {
        // این منطق پیچیده می‌تواند در کامپوننت مدیریت شود یا به همین شکل باقی بماند
      });
  }
})

// --- Slice for Deleting a User (Admin) ---
const userDeleteSlice = createSlice({
    name: 'userDelete',
    initialState: {},
    extraReducers: (builder) => {
        builder
            .addCase(deleteUserThunk.pending, (state) => { state.loading = true; })
            .addCase(deleteUserThunk.fulfilled, (state) => { state.loading = false; state.success = true; })
            .addCase(deleteUserThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

// --- Slice for User Details ---
const userDetailsSlice = createSlice({
    name: 'userDetails',
    initialState: { user: {} },
    reducers: { reset: (state) => ({ user: {} }) },
    extraReducers: (builder) => {
        builder
            .addCase(getUserDetailsThunk.pending, (state) => { state.loading = true; })
            .addCase(getUserDetailsThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
            .addCase(getUserDetailsThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

// --- Slice for Updating User Profile (by user) ---
const userUpdateProfileSlice = createSlice({
    name: 'userUpdateProfile',
    initialState: {},
    reducers: { reset: (state) => ({}) },
    extraReducers: (builder) => {
        builder
            .addCase(updateUserProfileThunk.pending, (state) => { state.loading = true; })
            .addCase(updateUserProfileThunk.fulfilled, (state) => { state.loading = false; state.success = true; })
            .addCase(updateUserProfileThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

// --- Slice for Updating User Role (Admin) ---
const userRoleSlice = createSlice({
    name: 'userRole',
    initialState: {},
    extraReducers: (builder) => {
        builder
            .addCase(updateUserRoleThunk.pending, (state) => { state.loading = true; })
            .addCase(updateUserRoleThunk.fulfilled, (state) => { state.loading = false; state.success = true; })
            .addCase(updateUserRoleThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

// --- Slice for Updating User by Admin ---
const userUpdateByAdminSlice = createSlice({
    name: 'userUpdateByAdmin',
    initialState: {},
    reducers: { reset: (state) => ({}) },
    extraReducers: (builder) => {
        builder
            .addCase(updateUserByAdminThunk.pending, (state) => { state.loading = true; })
            .addCase(updateUserByAdminThunk.fulfilled, (state) => { state.loading = false; state.success = true; })
            .addCase(updateUserByAdminThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

// --- Slice for Roles List ---
const roleListSlice = createSlice({
  name: 'roleList',
  initialState: { roles: [] },
  extraReducers: (builder) => {
    builder
      .addCase(listRolesThunk.pending, (state) => { state.loading = true })
      .addCase(listRolesThunk.fulfilled, (state, action) => { state.loading = false; state.roles = action.payload })
      .addCase(listRolesThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  }
})

// ===================================================================
// 🧠 بخش ۴: Exports (تمام Reducer ها و Action ها)
// ===================================================================

// --- Reducers ---
export const userLoginReducer = userLoginSlice.reducer
export const userRegisterReducer = userRegisterSlice.reducer
export const userListReducer = userListSlice.reducer
export const userDeleteReducer = userDeleteSlice.reducer
export const userDetailsReducer = userDetailsSlice.reducer
export const userUpdateProfileReducer = userUpdateProfileSlice.reducer
export const userRoleReducer = userRoleSlice.reducer
export const userUpdateByAdminReducer = userUpdateByAdminSlice.reducer
export const roleListReducer = roleListSlice.reducer

// --- Actions ---
export const { logout } = userLoginSlice.actions
export const { reset: resetUserDetails } = userDetailsSlice.actions
export const { reset: resetUserUpdateProfile } = userUpdateProfileSlice.actions
export const { reset: resetUserUpdateByAdmin } = userUpdateByAdminSlice.actions