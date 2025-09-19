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
  allWorkers: {},
  onlineWorkerIds: [],
};

export const workerListReducer = (state = initialState, action) => {
  switch (action.type) {
    case WORKER_LIST_REQUEST:
      return { ...state, loading: true };

    // reducers/workerReducer.js
case WORKER_LIST_SUCCESS: {
  const workersMap = {};
  const onlineIds = [];

  action.payload.forEach((w) => {
    const lastUpdate = w.last_location
      ? new Date(w.last_location.timestamp).getTime()
      : null;

    const isOnline = w.isOnline || (lastUpdate && Date.now() - lastUpdate < MAX_IDLE_MS);

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
      stale: !isOnline, // استفاده از وضعیت آنلاین از API
    };

    if (isOnline) {
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
      const u = action.payload;
      const workerId = u.id;

      const lastUpdate = u.last_location
        ? new Date(u.last_location.timestamp).getTime()
        : u.timestamp ? new Date(u.timestamp).getTime() : Date.now();

      const latitude = u.last_location?.latitude ?? u.latitude ?? null;
      const longitude = u.last_location?.longitude ?? u.longitude ?? null;

      const newAllWorkers = { ...state.allWorkers };
      const newOnlineIds = [...state.onlineWorkerIds];

      // اگر کارگر جدید است، به لیست آنلاین اضافه کن
      if (!newOnlineIds.includes(workerId)) {
        newOnlineIds.push(workerId);
      }

      newAllWorkers[workerId] = {
        ...(newAllWorkers[workerId] || {}),
        id: u.id,
        name: u.name,
        age: u.age,
        position: u.position,
        latitude,
        longitude,
        accuracy: u.last_location?.accuracy ?? u.accuracy ?? null,
        speed: u.last_location?.speed ?? u.speed ?? null,
        lastUpdate,
        stale: false,
      };

      return {
        ...state,
        allWorkers: newAllWorkers,
        onlineWorkerIds: newOnlineIds,
      };
    }

    case WORKER_CLEANUP_OLD: {
      const cutoff = action.payload - MAX_IDLE_MS;
      const newAllWorkers = { ...state.allWorkers };
      const newOnlineIds = [];

      Object.keys(newAllWorkers).forEach((id) => {
        const w = newAllWorkers[id];
        const isStale = (w.lastUpdate || 0) < cutoff;
        
        newAllWorkers[id] = {
          ...w,
          stale: isStale,
        };
        
        if (!isStale) {
          newOnlineIds.push(id);
        }
      });

      return { 
        ...state, 
        allWorkers: newAllWorkers, 
        onlineWorkerIds: newOnlineIds 
      };
    }

    default:
      return state;
  }
};