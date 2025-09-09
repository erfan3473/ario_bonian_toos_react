
// ===== FILE: src/components/WorkerCard.jsx =====
import React from 'react';

const WorkerCard = ({ worker, highlight, onClick, lastSeen }) => {
  return (
    <div
      onClick={() => onClick && onClick(worker)}
      className={`p-4 rounded-lg transition-shadow border ${
        highlight ? 'ring-2 ring-green-400 shadow-lg' : 'hover:shadow-md'
      } bg-gray-900 border-gray-700 cursor-pointer`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold text-lg">{worker.name || '—'}</h3>
            {worker.position && <span className="text-sm text-gray-400">{worker.position}</span>}
          </div>
          <p className="text-xs text-gray-400">ID: {worker.id}</p>
        </div>
        <div className="text-right text-green-300 font-mono text-sm">
          <p>Lat: {worker.latitude != null ? worker.latitude.toFixed(4) : 'N/A'}</p>
          <p>Lng: {worker.longitude != null ? worker.longitude.toFixed(4) : 'N/A'}</p>
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <small className="text-xs text-gray-400">Last: {lastSeen}</small>
        <div className="text-xs text-gray-500">{worker.age ? `${worker.age} yrs` : ''}</div>
      </div>
    </div>
  );
};

export default WorkerCard;

