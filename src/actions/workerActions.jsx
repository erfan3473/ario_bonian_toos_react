import axios from 'axios';
import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
} from '../constants/workerConstants';

// اکشن برای دریافت لیست اولیه کارگران از API
export const listWorkers = () => async (dispatch) => {
  try {
    dispatch({ type: WORKER_LIST_REQUEST });

    // TODO: اگر API شما نیاز به توکن دارد، باید هدر Authorization را اضافه کنید
    const { data } = await axios.get('http://127.0.0.1:8000/api/workers/');

    dispatch({
      type: WORKER_LIST_SUCCESS,
      payload: data,
    });
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
// این اکشن به صورت همزمان (sync) است چون داده را مستقیم از سوکت می‌گیرد
export const updateWorkerLocation = (data) => (dispatch) => {
  dispatch({
    type: WORKER_LOCATION_UPDATE,
    payload: data,
  });
};
