import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ProjectListScreen = () => {
  const dispatch = useDispatch();
  
  const { 
    list: projects, 
    loading, 
    error 
  } = useSelector((state) => state.projects);

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjects());
    }
  }, [dispatch, projects.length]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`container mx-auto p-4 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
        isDark ? 'border-blue-700 bg-gray-800/50 shadow-2xl' : 'border-blue-600 bg-white shadow-lg'
      }`}>
        
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl md:text-3xl font-black flex items-center gap-3 mb-4 sm:mb-0 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <span className="text-blue-500 text-3xl">🏗️</span> مدیریت پروژه‌ها
          </h1>
          <Link 
            to="/admin/projects/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            تعریف پروژه جدید
          </Link>
        </div>

        {loading ? (
          <div className="py-10"><Loader /></div>
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className={`rounded-xl border p-5 transition-all duration-300 group ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold transition-colors ${isDark ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-700'}`}>
                      {project.name}
                    </h3>
                    {project.project_type && (
                      <span className={`inline-block mt-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md border ${
                        isDark
                          ? 'bg-purple-900/40 text-purple-300 border-purple-500/30'
                          : 'bg-purple-100 text-purple-700 border-purple-300'
                      }`}>
                        {project.project_type}
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    project.is_active 
                      ? isDark 
                        ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/40' 
                        : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : isDark 
                        ? 'bg-rose-900/40 text-rose-400 border-rose-500/40'
                        : 'bg-rose-100 text-rose-700 border-rose-300'
                  }`}>
                    {project.is_active ? '✓ فعال' : '✗ غیرفعال'}
                  </span>
                </div>
                
                <p className={`text-sm mt-3 h-12 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {project.description || project.location_text || 'بدون توضیحات'}
                </p>

                <div className={`mt-5 pt-4 border-t grid grid-cols-2 gap-3 text-xs font-medium ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{project.location_text || 'نامشخص'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>{project.boundary_coordinates?.length > 0 ? 'فنس تعریف شده' : 'بدون فنس'}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    to={`/admin/projects/${project.id}/geofence`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-center py-2.5 rounded-lg text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    فنس‌کشی
                  </Link>
                  
                  <Link
                    to={`/admin/projects/${project.id}/edit`}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-center text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    ✏️ ویرایش
                  </Link>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className={`col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl ${isDark ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-300'}`}>
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
    </div>
  );
};

export default ProjectListScreen;