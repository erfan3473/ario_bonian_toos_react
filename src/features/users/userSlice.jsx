// src/features/users/userSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Base API urls
const API_BASE = 'http://127.0.0.1:8000/api/users/'

const ROLES_API = `${API_BASE}roles/` // ✅ اینطوری درست میشه

// -------------------- Async Thunks --------------------

// loginThunk expects an object: { username, password }
export const loginThunk = createAsyncThunk(
  'user/login',
  async ({ username, password }, thunkAPI) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } }
      const { data } = await axios.post(`${API_BASE}login/`, { username, password }, config)
      localStorage.setItem('userInfo', JSON.stringify(data))
      return data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// registerThunk: { username, password, password2 }
export const registerThunk = createAsyncThunk(
  'user/register',
  async ({ username, password, password2 }, thunkAPI) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } }
      const { data } = await axios.post(`${API_BASE}register/`, { username, password, password2 }, config)
      localStorage.setItem('userInfo', JSON.stringify(data))
      return data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// listUsersThunk (admin)
export const listUsersThunk = createAsyncThunk(
  'user/list',
  async (_, thunkAPI) => {
    try {
      const { userLogin: { userInfo } } = thunkAPI.getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token || ''}` } }
      const { data } = await axios.get(API_BASE, config)
      return data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// deleteUserThunk (admin)
export const deleteUserThunk = createAsyncThunk(
  'user/delete',
  async (id, thunkAPI) => {
    try {
      const { userLogin: { userInfo } } = thunkAPI.getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token || ''}` } }
      await axios.delete(`${API_BASE}delete/${id}/`, config)
      return id
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// getUserDetailsThunk (id or 'profile')
export const getUserDetailsThunk = createAsyncThunk(
  'user/details',
  async (id = 'profile', thunkAPI) => {
    try {
      const { userLogin: { userInfo } } = thunkAPI.getState()
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token || ''}`
        }
      }
      const endpoint = id === 'profile' ? 'profile/' : `${id}/`
      const { data } = await axios.get(`${API_BASE}${endpoint}`, config)
      return data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// updateUserProfileThunk
export const updateUserProfileThunk = createAsyncThunk(
  'user/updateProfile',
  async (userPayload, thunkAPI) => {
    try {
      const { userLogin: { userInfo } } = thunkAPI.getState()
      const stateConfig = { headers: { Authorization: `Bearer ${userInfo?.token || ''}` } }

      let body = userPayload
      if (!(userPayload instanceof FormData)) {
        if (userPayload?.image) {
          const fd = new FormData()
          for (const [k, v] of Object.entries(userPayload)) {
            if (v !== undefined && v !== null) {
              fd.append(k, v)
            }
          }
          body = fd
        } else {
          stateConfig.headers['Content-Type'] = 'application/json'
          body = userPayload
        }
      }

      const { data } = await axios.put(`${API_BASE}profile/update/`, body, stateConfig)
      localStorage.setItem('userInfo', JSON.stringify(data))
      return data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// updateUserRoleThunk (admin only)
export const updateUserRoleThunk = createAsyncThunk(
  'user/updateRole',
  async ({ userId, roleId, projectId }, thunkAPI) => {
    try {
      const { userLogin: { userInfo }, roleList, projectList } = thunkAPI.getState();
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token || ''}`,
        },
      };

      const { data } = await axios.post(
        `${API_BASE}assign-role/`,
        { user_id: userId, role_id: roleId, project_id: projectId },
        config
      );

      // role و project رو همینجا resolve می‌کنیم
      const role = roleList.roles.find(r => r.id === data.role);
      const project = projectList.projects?.find(p => p.id === data.project);

      return {
        userId: data.user,
        projectId: data.project,
        roleId: data.role,
        roleName: role ? role.name : 'N/A',
        projectName: project ? project.name : 'N/A',
      };

    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

// -------------------- New Thunks --------------------



// listRolesThunk
export const listRolesThunk = createAsyncThunk(
  'roles/list',
  async (_, thunkAPI) => {
    try {
      const { userLogin: { userInfo } } = thunkAPI.getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(ROLES_API, config)
      return data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// -------------------- Slices --------------------

// userLogin slice
const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState: {},
  reducers: {
    logoutState: () => ({})
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true })
      .addCase(loginThunk.fulfilled, (state, action) => { state.loading = false; state.userInfo = action.payload })
      .addCase(loginThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(updateUserProfileThunk.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
      })
  }
})

// userRegister slice
const userRegisterSlice = createSlice({
  name: 'userRegister',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => { state.loading = true })
      .addCase(registerThunk.fulfilled, (state, action) => { state.loading = false; state.userInfo = action.payload })
      .addCase(registerThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  }
})

// userList slice
const userListSlice = createSlice({
  name: 'userList',
  initialState: { users: [] },
  reducers: {
    reset: () => ({ users: [] })
  },
  extraReducers: (builder) => {
    builder
      .addCase(listUsersThunk.pending, (state) => { state.loading = true })
      .addCase(listUsersThunk.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload
      })
      .addCase(listUsersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // 👇 این بخش مهم اضافه میشود
      .addCase(updateUserRoleThunk.fulfilled, (state, action) => {
  const { userId, projectId, roleId, roleName, projectName } = action.payload
  const userIndex = state.users.findIndex(u => u.id === userId)

  if (userIndex !== -1) {
    const membershipIndex = state.users[userIndex].project_memberships
      .findIndex(m => m.project_id === projectId)

    const newMembership = {
      project_id: projectId,
      project_name: projectName,
      role_id: roleId,
      role_name: roleName,
    }

    if (membershipIndex !== -1) {
      state.users[userIndex].project_memberships[membershipIndex] = newMembership
    } else {
      state.users[userIndex].project_memberships.push(newMembership)
    }
  }
})

  }
})
// userDelete slice
const userDeleteSlice = createSlice({
  name: 'userDelete',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(deleteUserThunk.pending, (state) => { state.loading = true })
      .addCase(deleteUserThunk.fulfilled, (state) => { state.loading = false; state.success = true })
      .addCase(deleteUserThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  }
})

// userDetails slice
const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState: { user: {} },
  reducers: {
    resetDetails: () => ({ user: {} })
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserDetailsThunk.pending, (state) => { state.loading = true })
      .addCase(getUserDetailsThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload })
      .addCase(getUserDetailsThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  }
})

// userUpdateProfile slice
const userUpdateProfileSlice = createSlice({
  name: 'userUpdateProfile',
  initialState: {},
  reducers: {
    resetUpdateProfile: () => ({})
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserProfileThunk.pending, (state) => { state.loading = true })
      .addCase(updateUserProfileThunk.fulfilled, (state, action) => { state.loading = false; state.success = true; state.userInfo = action.payload })
      .addCase(updateUserProfileThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  }
})

// userRole slice
const userRoleSlice = createSlice({
  name: 'userRole',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateUserRoleThunk.pending, (state) => { state.loading = true })
      .addCase(updateUserRoleThunk.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.updatedUser = action.payload
      })
      .addCase(updateUserRoleThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})



// roleList slice
const roleListSlice = createSlice({
  name: 'roleList',
  initialState: { roles: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listRolesThunk.pending, (state) => { state.loading = true })
      .addCase(listRolesThunk.fulfilled, (state, action) => { state.loading = false; state.roles = action.payload })
      .addCase(listRolesThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  }
})

// -------------------- Exports --------------------

export const userLoginReducer = userLoginSlice.reducer
export const userRegisterReducer = userRegisterSlice.reducer
export const userListReducer = userListSlice.reducer
export const userDeleteReducer = userDeleteSlice.reducer
export const userDetailsReducer = userDetailsSlice.reducer
export const userUpdateProfileReducer = userUpdateProfileSlice.reducer
export const userRoleReducer = userRoleSlice.reducer

export const roleListReducer = roleListSlice.reducer

// Convenience wrappers
export const login = (username, password) => (dispatch) => dispatch(loginThunk({ username, password }))
export const register = (username, password, password2) => (dispatch) => dispatch(registerThunk({ username, password, password2 }))
export const listUsers = () => (dispatch) => dispatch(listUsersThunk())
export const deleteUser = (id) => (dispatch) => dispatch(deleteUserThunk(id))
export const getUserDetails = (id = 'profile') => (dispatch) => dispatch(getUserDetailsThunk(id))
export const updateUserProfile = (user) => (dispatch) => dispatch(updateUserProfileThunk(user))
export const updateUserRole = ({ userId, roleId, projectId }) => (dispatch) => dispatch(updateUserRoleThunk({ userId, roleId, projectId }))

export const listRoles = () => (dispatch) => dispatch(listRolesThunk())

// logout
export const logout = () => (dispatch) => {
  localStorage.removeItem('userInfo')
  dispatch(userLoginSlice.actions.logoutState())
  dispatch(userListSlice.actions.reset())
}
