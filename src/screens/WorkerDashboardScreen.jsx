import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listWorkers, updateWorkerLocation } from '../actions/workerActions';
import Loader from '../components/Loader';
import Message from '../components/Message';

const WorkerDashboardScreen = () => {
  const dispatch = useDispatch();

  // گرفتن استیت از Redux store
  const workerList = useSelector((state) => state.workerList);
  const { loading, error, workers } = workerList;

  useEffect(() => {
    // 1. دریافت لیست اولیه کارگران
    dispatch(listWorkers());

    // 2. برقراری ارتباط با WebSocket
    // توجه: آدرس را با آدرس سرور بک‌اند خود جایگزین کنید
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/admin/dashboard/');

    socket.onopen = () => {
      console.log('WebSocket Connection Established for Admin Dashboard.');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket data received:', data);

      // 3. اگر پیام معتبر است، اکشن آپدیت را dispatch کن
      if (data.worker_id) {
        dispatch(updateWorkerLocation(data));
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Connection Closed.');
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    // 4. بستن اتصال در زمان خروج از کامپوننت
    return () => {
      socket.close();
    };
  }, [dispatch]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Workers Live Dashboard</h1>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="bg-gray-800 shadow-md rounded-lg p-6">
          <ul className="divide-y divide-gray-700">
            {workers && workers.length > 0 ? (
              workers.map((worker) => (
                <li key={worker.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-white">{worker.name}</p>
                      <p className="text-sm text-gray-400">{worker.position}</p>
                    </div>
                    <div className="text-right text-green-400 font-mono text-sm">
                      <p>Lat: {worker.latitude?.toFixed(4) || 'N/A'}</p>
                      <p>Lng: {worker.longitude?.toFixed(4) || 'N/A'}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-center text-gray-400">No workers found.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboardScreen;
