// ===== FILE: src/reducers/workerReducers.js =====
import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
  WORKER_CLEANUP_OLD,
} from '../constants/workerConstants';

const initialState = {
  loading: false,
  workers: [],
  error: null,
};

export const workerListReducer = (state = initialState, action) => {
  switch (action.type) {
    case WORKER_LIST_REQUEST:
      return { ...state, loading: true }; // بهبود: workers رو خالی نکن

    case WORKER_LIST_SUCCESS:
      return { ...state, loading: false, workers: action.payload };

    case WORKER_LIST_FAIL:
      return { ...state, loading: false, error: action.payload };

    case WORKER_LOCATION_UPDATE: {
      const { worker_id, name, position, latitude, longitude, lastUpdate } =
        action.payload;

      const exists = state.workers.some((w) => w.id === worker_id);

      if (!exists) {
        const newWorker = {
          id: worker_id,
          name: name || `Worker ${worker_id}`,
          position: position || '',
          latitude,
          longitude,
          lastUpdate,
        };
        return { ...state, workers: [newWorker, ...state.workers] };
      }

      return {
        ...state,
        workers: state.workers.map((worker) =>
          worker.id === worker_id
            ? { ...worker, latitude, longitude, lastUpdate }
            : worker
        ),
      };
    }

    case WORKER_CLEANUP_OLD: {
      const now = action.payload;
      const fiveMinutes = 5 * 60 * 1000;

      return {
        ...state,
        workers: state.workers.filter(
          (worker) => now - (worker.lastUpdate || 0) < fiveMinutes
        ),
      };
    }

    default:
      return state;
  }
};
