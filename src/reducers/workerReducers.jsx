// src/reducers/workerReducers.js
import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
} from '../constants/workerConstants';

const initialState = {
  loading: false,
  workers: [], // 🔑 مقدار اولیه حتما باید یک آرایه خالی باشه
  error: null,
};

export const workerListReducer = (state = initialState, action) => {
  switch (action.type) {
    case WORKER_LIST_REQUEST:
      return { ...state, loading: true, workers: [] }; // موقع لودینگ هم workers رو خالی کن

    case WORKER_LIST_SUCCESS:
      return { ...state, loading: false, workers: action.payload };

    case WORKER_LIST_FAIL:
      return { ...state, loading: false, error: action.payload, workers: [] }; // 🔑 در صورت خطا هم workers رو آرایه خالی بزار

    case WORKER_LOCATION_UPDATE:
      return {
        ...state,
        workers: state.workers.map((worker) =>
          worker.id === action.payload.worker_id
            ? { ...worker, latitude: action.payload.latitude, longitude: action.payload.longitude }
            : worker
        ),
      };

    default:
      return state;
  }
};