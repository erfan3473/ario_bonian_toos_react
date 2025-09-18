import {
  WORKER_LIST_REQUEST,
  WORKER_LIST_SUCCESS,
  WORKER_LIST_FAIL,
  WORKER_LOCATION_UPDATE,
  WORKER_CLEANUP_OLD,
} from '../constants/workerConstants';
const MAX_IDLE_MS = 5 * 60 * 1000; // ۵ دقیقه

const initialState = {
  loading: false,
  error: null,
  allWorkers: {},            // همه کارگرها با key=id
  onlineWorkerIds: [],       // ✅ آرایه از IDها به جای Set
};

export const workerListReducer = (state = initialState, action) => {
  switch (action.type) {
    case WORKER_LIST_REQUEST:
      return { ...state, loading: true };

    case WORKER_LIST_SUCCESS: {
      const workersMap = {};
      const onlineIds = [];

      action.payload.forEach((w) => {
        const lastUpdate = w.last_location
          ? new Date(w.last_location.timestamp).getTime()
          : null;

        workersMap[w.id] = {
          id: w.id,
          name: w.name,
          age: w.age,
          position: w.position,
          code_meli: w.code_meli,
          user: w.user,
          latitude: w.last_location?.latitude ?? null,
          longitude: w.last_location?.longitude ?? null,
          accuracy: w.last_location?.accuracy ?? null,
          speed: w.last_location?.speed ?? null,
          lastUpdate,
        };

        if (lastUpdate && Date.now() - lastUpdate < MAX_IDLE_MS) {
          onlineIds.push(w.id);
        }
      });

      return {
        ...state,
        loading: false,
        allWorkers: workersMap,
        onlineWorkerIds: onlineIds,
      };
    }

    case WORKER_LIST_FAIL:
      return { ...state, loading: false, error: action.payload };

    case WORKER_LOCATION_UPDATE: {
      const updated = action.payload;
      const workerId = updated.id;

      const newAllWorkers = { ...state.allWorkers };
      const newOnlineSet = new Set(state.onlineWorkerIds);

      newAllWorkers[workerId] = {
        ...(newAllWorkers[workerId] || {}),
        id: updated.id,
        name: updated.name,
        age: updated.age,
        position: updated.position,
        latitude: updated.last_location?.latitude ?? null,
        longitude: updated.last_location?.longitude ?? null,
        accuracy: updated.last_location?.accuracy ?? null,
        speed: updated.last_location?.speed ?? null,
        lastUpdate: updated.last_location
          ? new Date(updated.last_location.timestamp).getTime()
          : Date.now(),
      };

      newOnlineSet.add(workerId);

      return {
        ...state,
        allWorkers: newAllWorkers,
        onlineWorkerIds: Array.from(newOnlineSet), // ✅ ذخیره به صورت آرایه
      };
    }

    case WORKER_CLEANUP_OLD: {
      const cutoff = action.payload - MAX_IDLE_MS;
      const newOnlineIds = state.onlineWorkerIds.filter((workerId) => {
        const worker = state.allWorkers[workerId];
        return worker && (worker.lastUpdate || 0) >= cutoff;
      });

      return { ...state, onlineWorkerIds: newOnlineIds };
    }

    default:
      return state;
  }
};
