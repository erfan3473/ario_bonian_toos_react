// src/features/users/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 🔐 Async Thunks
// ═══════════════════════════════════════════════════════════

// 1️⃣ لاگین با شماره موبایل
export const loginWithPhone = createAsyncThunk(
  'user/loginWithPhone',
  async ({ phone_number, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/auth/login/', {
        phone_number,
        password,
      });

      if (!data.access) {
        throw new Error('توکن دسترسی (access) در پاسخ بک‌اند نبود.');
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message;
      return rejectWithValue(message);
    }
  }
);

// 2️⃣ گرفتن پروفایل کاربر لاگین‌شده
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/users/profile/');
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);

// 3️⃣ آپدیت پروفایل کاربر
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      const { data } = await axiosInstance.put('/users/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!data.access) {
        console.warn('⚠️ سرور access برنگردوند، ولی پروفایل آپدیت شد.');
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message;
      return rejectWithValue(message);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slices
// ═══════════════════════════════════════════════════════════

// 4️⃣ Login Slice
const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState: {
    loading: false,
    userInfo: localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.loading = false;
      state.userInfo = null;
      state.error = null;
      localStorage.removeItem('userInfo');
    },
  },
  extraReducers: (builder) => {
    builder
      // لاگین
      .addCase(loginWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
        state.error = null;
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'خطا در ورود';
      })
      // آپدیت پروفایل
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.userInfo = action.payload;
        state.error = null;
      });
  },
});

export const { logout } = userLoginSlice.actions;
export const userLoginReducer = userLoginSlice.reducer;

// 5️⃣ User Details Slice
const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState: {
    loading: false,
    user: {},
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'خطا در دریافت پروفایل';
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const userDetailsReducer = userDetailsSlice.reducer;

// 6️⃣ User Update Profile Slice
const userUpdateProfileSlice = createSlice({
  name: 'userUpdateProfile',
  initialState: {
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    resetUpdateProfile: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || 'خطا در آپدیت پروفایل';
      });
  },
});

export const { resetUpdateProfile } = userUpdateProfileSlice.actions;
export const userUpdateProfileReducer = userUpdateProfileSlice.reducer;

// ═══════════════════════════════════════════════════════════
// 🗑️ Deprecated (فعلاً نگه می‌داریم برای سازگاری)
// ═══════════════════════════════════════════════════════════
export const userRegisterReducer = (state = {}, action) => state;
export const userListReducer = (state = { users: [] }, action) => state;
export const userDeleteReducer = (state = {}, action) => state;
export const userRoleReducer = (state = {}, action) => state;
export const userUpdateByAdminReducer = (state = {}, action) => state;
