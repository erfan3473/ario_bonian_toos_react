// src/features/users/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

/*
  این فایل الان ۳ کار اصلی می‌کنه:

  1) لاگین با شماره موبایل (loginWithPhone)
  2) گرفتن پروفایل کاربر لاگین‌شده (fetchUserProfile)
  3) آپدیت پروفایل کاربر (updateUserProfile)
     و بعد از آپدیت، userInfo + localStorage را آپدیت می‌کنیم
*/

// =====================
// ۱) Login با شماره موبایل
// =====================

export const loginWithPhone = createAsyncThunk(
  'user/loginWithPhone',
  async ({ phone_number, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/users/login/', {
        phone_number,
        password,
      });

      // مهم: حتماً access داشته باشیم
      if (!data.access) {
        throw new Error('توکن دسترسی (access) در پاسخ بک‌اند نبود.');
      }

      // ذخیره تو localStorage
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

// =====================
// ۲) GET /users/profile/  → گرفتن پروفایل
// =====================

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/users/profile/');
      return data; // همون UserSerializer
    } catch (error) {
      const message =
        error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);

// =====================
// ۳) PUT /users/profile/  → آپدیت پروفایل
//    (انتظار داریم بک‌اند access + refresh هم برگردونه)
// =====================

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      /*
        profileData می‌تونه چیزی شبیه این باشه:
        {
          first_name,
          last_name,
          username,
          phone_number,
          password?,  // اختیاری
          image?,     // File (اختیاری)
        }

        چون image داریم، بهتره همیشه multipart/form-data بفرستیم.
      */
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

      // اینجا انتظار داریم بک‌اند چیزی مثل زیر برگردونه:
      // { id, username, ..., profile: {...}, access, refresh }
      if (!data.access) {
        console.warn('⚠️ سرور access برنگردوند، ولی پروفایل آپدیت شد.');
      }

      // توکن و یوزر جدید را ذخیره کنیم
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

// =====================
// ۴) Login Slice
// =====================

const initialLoginState = {
  loading: false,
  userInfo:
    localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null,
  error: null,
};

const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState: initialLoginState,
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

      // 🔑 مهم: وقتی پروفایل را آپدیت می‌کنیم، userInfo را هم به‌روز کنیم
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.userInfo = action.payload;
        state.error = null;
      });
  },
});

export const { logout } = userLoginSlice.actions;
export const userLoginReducer = userLoginSlice.reducer;

// =====================
// ۵) userDetails: گرفتن پروفایل برای ProfileScreen
// =====================

const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState: { loading: false, user: {}, error: null },
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

      // اگر خواستی، می‌تونی بعد از آپدیت پروفایل اینجا userDetails.user را هم به‌روز کنی:
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const userDetailsReducer = userDetailsSlice.reducer;

// =====================
// ۶) userUpdateProfile: فقط برای state فرم آپدیت
// =====================

const userUpdateProfileSlice = createSlice({
  name: 'userUpdateProfile',
  initialState: { loading: false, success: false, error: null },
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
      .addCase(updateUserProfile.fulfilled, (state, action) => {
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

// =====================
// ۷) بقیه‌ی Reducerها (اسکلت خالی فعلاً)
// =====================

// ثبت نام – بعداً کاملش می‌کنیم
export const userRegisterReducer = (state = {}, action) => state;

// لیست کاربران – بعداً کاملش می‌کنیم
export const userListReducer = (state = { users: [] }, action) => state;

// حذف کاربر – بعداً
export const userDeleteReducer = (state = {}, action) => state;

// نقش‌ها – بعداً
export const userRoleReducer = (state = {}, action) => state;

// آپدیت توسط ادمین – بعداً
export const userUpdateByAdminReducer = (state = {}, action) => state;
