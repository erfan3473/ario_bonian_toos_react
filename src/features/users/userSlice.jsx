// src/features/users/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ─── helper: توکن قدیمی رو حفظ میکنه ───
function mergeWithStoredTokens(newData) {
  const prev = JSON.parse(localStorage.getItem('userInfo') || '{}');
  return { ...prev, ...newData };
}

// ─── Thunks ───

export const loginWithPhone = createAsyncThunk(
  'user/loginWithPhone',
  async ({ phone_number, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/auth/login/', { phone_number, password });
      if (!data.access) throw new Error('توکن دسترسی در پاسخ نبود.');
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message
      );
    }
  }
);

export const requestPasswordResetOtp = createAsyncThunk(
  'user/requestPasswordResetOtp',
  async ({ phone_number }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/auth/password/request-otp/', { phone_number });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const verifyPasswordResetOtp = createAsyncThunk(
  'user/verifyPasswordResetOtp',
  async ({ phone_number, otp_code, new_password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/auth/password/verify-otp/', {
        phone_number, otp_code, new_password,
      });
      const userData = data.data;
      if (!userData?.access) throw new Error('توکن دسترسی در پاسخ نبود.');
      localStorage.setItem('userInfo', JSON.stringify(userData));
      return userData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/users/profile/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// نام + عکس — بدون توکن جدید
export const updateUserBasicProfile = createAsyncThunk(
  'user/updateUserBasicProfile',
  async ({ first_name, last_name, image, remove_image }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (first_name !== undefined) formData.append('first_name', first_name);
      if (last_name !== undefined)  formData.append('last_name', last_name);
      if (remove_image)             formData.append('remove_image', 'true');
      else if (image)               formData.append('image', image);

      const { data } = await axiosInstance.put('/users/profile/basic/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const merged = mergeWithStoredTokens(data);
      localStorage.setItem('userInfo', JSON.stringify(merged));
      return merged;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);


// کد ملی، شبا، حساب — بدون توکن جدید
export const updateUserFinancialProfile = createAsyncThunk(
  'user/updateUserFinancialProfile',
  async ({ code_meli, shaba_number, bank_account_number }, { rejectWithValue }) => {
    try {
      const payload = {};
      if (code_meli !== undefined)           payload.code_meli = code_meli;
      if (shaba_number !== undefined)        payload.shaba_number = shaba_number;
      if (bank_account_number !== undefined) payload.bank_account_number = bank_account_number;

      const { data } = await axiosInstance.put('/users/profile/financial/', payload);

      const merged = mergeWithStoredTokens(data);
      localStorage.setItem('userInfo', JSON.stringify(merged));
      return merged;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// تغییر رمز — توکن جدید صادر میشه
export const changeUserPassword = createAsyncThunk(
  'user/changeUserPassword',
  async ({ old_password, new_password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put('/users/profile/password/', {
        old_password, new_password,
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// legacy wrapper — جاهای قدیمی که updateUserProfile صدا میزدن نشکنن
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      const { image, password, old_password, ...rest } = profileData;
      if (Object.keys(rest).length > 0 || image) {
        await dispatch(updateUserBasicProfile({ ...rest, image })).unwrap();
      }
      if (password && old_password) {
        await dispatch(changeUserPassword({ old_password, new_password: password })).unwrap();
      }
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ─── Login Slice ───
const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState: {
    loading: false,
    userInfo: localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null,
    error: null,
    forgotPasswordLoading: false,
    forgotPasswordError: null,
    forgotPasswordStep: 1,
  },
  reducers: {
    logout: (state) => {
      state.loading = false;
      state.userInfo = null;
      state.error = null;
      localStorage.removeItem('userInfo');
    },
    resetForgotPasswordState: (state) => {
      state.forgotPasswordLoading = false;
      state.forgotPasswordError = null;
      state.forgotPasswordStep = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithPhone.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loginWithPhone.fulfilled, (state, action) => { state.loading = false; state.userInfo = action.payload; })
      .addCase(loginWithPhone.rejected,  (state, action) => { state.loading = false; state.error = action.payload || 'خطا در ورود'; })

      .addCase(requestPasswordResetOtp.pending,   (state) => { state.forgotPasswordLoading = true; state.forgotPasswordError = null; })
      .addCase(requestPasswordResetOtp.fulfilled, (state) => { state.forgotPasswordLoading = false; state.forgotPasswordStep = 2; })
      .addCase(requestPasswordResetOtp.rejected,  (state, action) => { state.forgotPasswordLoading = false; state.forgotPasswordError = action.payload || 'خطا در ارسال کد'; })

      .addCase(verifyPasswordResetOtp.pending,   (state) => { state.forgotPasswordLoading = true; state.forgotPasswordError = null; })
      .addCase(verifyPasswordResetOtp.fulfilled, (state, action) => { state.forgotPasswordLoading = false; state.userInfo = action.payload; state.forgotPasswordStep = 1; })
      .addCase(verifyPasswordResetOtp.rejected,  (state, action) => { state.forgotPasswordLoading = false; state.forgotPasswordError = action.payload || 'کد نامعتبر'; })

      .addCase(updateUserBasicProfile.fulfilled,     (state, action) => { state.userInfo = action.payload; })
      .addCase(updateUserFinancialProfile.fulfilled, (state, action) => { state.userInfo = action.payload; })
      .addCase(changeUserPassword.fulfilled,         (state, action) => { state.userInfo = action.payload; })
      .addCase(updateUserProfile.fulfilled,          (state, action) => { state.userInfo = action.payload; });
  },
});

export const { logout, resetForgotPasswordState } = userLoginSlice.actions;
export const userLoginReducer = userLoginSlice.reducer;

// ─── userDetails Slice ───
const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState: { loading: false, user: {}, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserProfile.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchUserProfile.rejected,  (state, action) => { state.loading = false; state.error = action.payload || 'خطا'; })
      .addCase(updateUserBasicProfile.fulfilled,     (state, action) => { state.user = action.payload; })
      .addCase(updateUserFinancialProfile.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(changeUserPassword.fulfilled,         (state, action) => { state.user = action.payload; });
  },
});
export const userDetailsReducer = userDetailsSlice.reducer;

// ─── userUpdateProfile Slice ───
const userUpdateProfileSlice = createSlice({
  name: 'userUpdateProfile',
  initialState: { loading: false, success: false, error: null },
  reducers: {
    resetUpdateProfile: (state) => { state.loading = false; state.success = false; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserBasicProfile.pending,     (state) => { state.loading = true; state.success = false; state.error = null; })
      .addCase(updateUserBasicProfile.fulfilled,   (state) => { state.loading = false; state.success = true; })
      .addCase(updateUserBasicProfile.rejected,    (state, action) => { state.loading = false; state.error = action.payload || 'خطا'; })

      .addCase(updateUserFinancialProfile.pending,   (state) => { state.loading = true; state.success = false; state.error = null; })
      .addCase(updateUserFinancialProfile.fulfilled, (state) => { state.loading = false; state.success = true; })
      .addCase(updateUserFinancialProfile.rejected,  (state, action) => { state.loading = false; state.error = action.payload || 'خطا'; })

      .addCase(changeUserPassword.pending,   (state) => { state.loading = true; state.success = false; state.error = null; })
      .addCase(changeUserPassword.fulfilled, (state) => { state.loading = false; state.success = true; })
      .addCase(changeUserPassword.rejected,  (state, action) => { state.loading = false; state.error = action.payload || 'خطا'; });
  },
});
export const { resetUpdateProfile } = userUpdateProfileSlice.actions;
export const userUpdateProfileReducer = userUpdateProfileSlice.reducer;

// legacy — بدون تغییر
export const userRegisterReducer       = (state = {}, action) => state;
export const userListReducer           = (state = { users: [] }, action) => state;
export const userDeleteReducer         = (state = {}, action) => state;
export const userRoleReducer           = (state = {}, action) => state;
export const userUpdateByAdminReducer  = (state = {}, action) => state;
