import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/workers/workerSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ProjectListScreen = () => {
  const dispatch = useDispatch();
  
  const { 
    list: projects, 
    status, 
    error 
  } = useSelector((state) => state.workers.projects);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">مدیریت پروژه‌ها</h1>
        <Link 
          to="/admin/project/create" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          + تعریف پروژه جدید
        </Link>
      </div>

      {status === 'loading' ? (
        <Loader />
      ) : status === 'failed' ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${project.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {project.is_active ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mt-2 h-10 overflow-hidden text-ellipsis">
                 {project.location_text || 'موقعیت ثبت نشده'}
              </p>

              <div className="mt-6 flex gap-2">
                <Link
                  to={`/admin/projects/${project.id}/geofence`}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-center py-2 rounded-lg text-sm border border-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75v.75h-.75v-.75zm0 3h.75v.75h-.75v-.75zm0 3h.75v.75h-.75v-.75zm0 3h.75v.75h-.75v-.75z" />
                  </svg>
                  فنس‌کشی (Map)
                </Link>
                
                <button className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 border border-blue-500/30">
                   ویرایش
                </button>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-10">هیچ پروژه‌ای یافت نشد.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectListScreen;