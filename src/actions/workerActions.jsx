import axios from 'axios';
import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
  WORKER_CLEANUP_OLD,
} from '../constants/workerConstants';

// گرفتن لیست اولیه کارگرها از API REST
export const listWorkers = () => async (dispatch) => {
  try {
    dispatch({ type: WORKER_LIST_REQUEST });
    const { data } = await axios.get('http://127.0.0.1:8000/api/workers/'); // حتماً endpointتون workers/ باشه
    dispatch({ type: WORKER_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: WORKER_LIST_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

// اکشن برای آپدیت موقعیت مکانی از طریق WebSocket
export const updateWorkerLocation = (data) => (dispatch) => {
  dispatch({
    type: WORKER_LOCATION_UPDATE,
    payload: {
      ...data,
      lastUpdate: Date.now(),
    },
  });
};

// اکشن برای پاک‌سازی کارگران قدیمی (بیشتر از ۵ دقیقه آپدیت نشدن)
export const cleanupOldWorkers = () => (dispatch) => {
  dispatch({ type: WORKER_CLEANUP_OLD, payload: Date.now() });
};
