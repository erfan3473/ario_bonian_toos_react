
// ===== FILE: src/reducers/workerReducers.js =====
import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
} from '../constants/workerConstants';

const initialState = {
  loading: false,
  workers: [],
  error: null,
};

export const workerListReducer = (state = initialState, action) => {
  switch (action.type) {
    case WORKER_LIST_REQUEST:
      return { ...state, loading: true, workers: [] };

    case WORKER_LIST_SUCCESS:
      return { ...state, loading: false, workers: action.payload };

    case WORKER_LIST_FAIL:
      return { ...state, loading: false, error: action.payload, workers: [] };

    case WORKER_LOCATION_UPDATE: {
      const payload = action.payload;
      const workerId = payload.worker_id;

      // اگر کارگر در لیست نیست، آن را اضافه کن (useful for late joins)
      const exists = state.workers.some((w) => w.id === workerId);

      if (!exists) {
        const newWorker = {
          id: payload.worker_id,
          name: payload.name || `Worker ${payload.worker_id}`,
          position: payload.position || '',
          latitude: payload.latitude,
          longitude: payload.longitude,
        };
        return { ...state, workers: [newWorker, ...state.workers] };
      }

      return {
        ...state,
        workers: state.workers.map((worker) =>
          worker.id === workerId
            ? { ...worker, latitude: payload.latitude, longitude: payload.longitude }
            : worker
        ),
      };
    }

    default:
      return state;
  }
};