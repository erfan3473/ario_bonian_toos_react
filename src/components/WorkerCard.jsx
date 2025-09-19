// src/components/WorkerCard.jsx
import React from 'react';

const WorkerCard = ({ worker, highlight, onClick, lastSeen }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(worker.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-lg transition-shadow border cursor-pointer
        ${highlight ? 'ring-2 ring-green-400 shadow-lg' : 'hover:shadow-md'}
        ${worker.stale ? 'bg-gray-800 opacity-70' : 'bg-gray-900'} 
        border-gray-700`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${worker.stale ? 'bg-red-400' : 'bg-green-400'}`}></div>
            <h3 className="text-white font-semibold text-lg">{worker.name || '—'}</h3>
          </div>
          {worker.position && <span className="text-sm text-gray-400">{worker.position}</span>}
          <p className="text-xs text-gray-400">ID: {worker.id}</p>
        </div>
        <div className="text-right text-green-300 font-mono text-sm">
          <p>Lat: {worker.latitude != null ? worker.latitude.toFixed(4) : 'N/A'}</p>
          <p>Lng: {worker.longitude != null ? worker.longitude.toFixed(4) : 'N/A'}</p>
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <small className="text-xs text-gray-400">
          {worker.stale ? 'Offline' : `Last: ${lastSeen}`}
        </small>
        <div className="text-xs text-gray-500">{worker.age ? `${worker.age} yrs` : ''}</div>
      </div>
    </div>
  );
};

// این خط خیلی مهمه!
export default WorkerCard; // باید export default داشته باشه