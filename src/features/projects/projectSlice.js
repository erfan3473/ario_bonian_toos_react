// src/features/projects/projectSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk برای گرفتن لیست پروژه‌ها از API
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { getState }) => { // آرگومان اول لازم نیست پس _ میذاریم
    try {
      // اینجا هم می‌تونید توکن رو برای درخواست‌های نیازمند احراز هویت اضافه کنید
      // const { user: { userInfo } } = getState();
      // const config = {
      //   headers: {
      //     'Content-type': 'application/json',
      //     Authorization: `Bearer ${userInfo.token}`,
      //   },
      // };
      const { data } = await axios.get('http://127.0.0.1:8000/api/projects/');
      return data;
    } catch (error) {
      throw error.response && error.response.data.detail
        ? error.response.data.detail
        : error.message;
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default projectSlice.reducer;