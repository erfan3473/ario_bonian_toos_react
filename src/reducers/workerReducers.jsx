import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
  WORKER_CLEANUP_OLD,
} from '../constants/workerConstants';

const MAX_IDLE_MS = 5 * 60 * 1000; // ۵ دقیقه

export const workerListReducer = (state = { workers: [] }, action) => {
  switch (action.type) {
    case WORKER_LIST_REQUEST:
      return { loading: true, workers: [] };

    case WORKER_LIST_SUCCESS:
      return {
        loading: false,
        workers: action.payload.map((w) => ({
          id: w.id,
          name: w.name,
          age: w.age,
          position: w.position,
          code_meli: w.code_meli,
          user: w.user,
          latitude: w.last_location ? w.last_location.latitude : null,
          longitude: w.last_location ? w.last_location.longitude : null,
          accuracy: w.last_location ? w.last_location.accuracy : null,
          speed: w.last_location ? w.last_location.speed : null,
          lastUpdate: w.last_location
            ? new Date(w.last_location.timestamp).getTime()
            : null,
        })),
      };

    case WORKER_LIST_FAIL:
      return { loading: false, error: action.payload };

    case WORKER_LOCATION_UPDATE: {
      const updated = action.payload;
      const exists = state.workers.find((w) => w.id === updated.worker_id);

      let newWorkers;
      if (exists) {
        newWorkers = state.workers.map((w) =>
          w.id === updated.worker_id
            ? {
                ...w,
                latitude: updated.latitude,
                longitude: updated.longitude,
                accuracy: updated.accuracy,
                speed: updated.speed,
                lastUpdate: updated.lastUpdate,
              }
            : w
        );
      } else {
        newWorkers = [
          ...state.workers,
          {
            id: updated.worker_id,
            name: updated.name || 'ناشناس',
            latitude: updated.latitude,
            longitude: updated.longitude,
            accuracy: updated.accuracy,
            speed: updated.speed,
            lastUpdate: updated.lastUpdate,
          },
        ];
      }

      return { ...state, workers: newWorkers };
    }

    case WORKER_CLEANUP_OLD: {
      const cutoff = action.payload - MAX_IDLE_MS;
      const newWorkers = state.workers.filter(
        (w) => (w.lastUpdate || 0) >= cutoff
      );
      return { ...state, workers: newWorkers };
    }

    default:
      return state;
  }
};
