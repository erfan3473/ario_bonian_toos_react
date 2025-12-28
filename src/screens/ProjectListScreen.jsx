// src/screens/ProjectListScreen.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectSlice'; // ✅ تغییر
import Loader from '../components/Loader';
import Message from '../components/Message';

const ProjectListScreen = () => {
  const dispatch = useDispatch();
  
  // ✅ دریافت از projectSlice
  const { 
    list: projects, 
    loading, 
    error 
  } = useSelector((state) => state.projects);

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjects());
    }
  }, [dispatch, projects.length]);

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🏗️ مدیریت پروژه‌ها
        </h1>
        <Link 
          to="/admin/projects/create" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg transition flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          تعریف پروژه جدید
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:shadow-2xl hover:border-blue-500/50 transition-all group"
            >
              {/* هدر */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                    {project.name}
                  </h3>
                  {project.project_type && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded border border-purple-500/30">
                      {project.project_type}
                    </span>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${project.is_active ? 'bg-green-900/40 text-green-300 border border-green-500/40' : 'bg-red-900/40 text-red-300 border border-red-500/40'}`}>
                  {project.is_active ? '✓ فعال' : '✗ غیرفعال'}
                </span>
              </div>
              
              {/* توضیحات */}
              <p className="text-gray-400 text-sm mt-2 h-12 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                {project.description || project.location_text || 'بدون توضیحات'}
              </p>

              {/* جزئیات */}
              <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{project.location_text || 'نامشخص'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>{project.boundary_coordinates?.length > 0 ? 'فنس تعریف شده' : 'بدون فنس'}</span>
                </div>
              </div>

              {/* دکمه‌ها */}
              <div className="mt-5 flex gap-2">
                <Link
                  to={`/admin/projects/${project.id}/geofence`}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-center py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  فنس‌کشی
                </Link>
                
                 {/* ✅ دکمه ویرایش فعال شد */}
              <Link
                to={`/admin/projects/${project.id}/edit`}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-center text-sm transition"
              >
                ✏️ ویرایش
              </Link>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-bold">هیچ پروژه‌ای یافت نشد.</p>
              <p className="text-sm mt-1">برای شروع، یک پروژه جدید ایجاد کنید.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectListScreen;
