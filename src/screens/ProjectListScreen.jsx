// src/screens/ProjectListScreen.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

function ProjectCard({ project }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
        <p className="text-gray-600 mt-2">{project.location_text}</p>
        <p className="text-sm text-gray-500 mt-1">مدیر پروژه: {project.project_manager_name}</p>
      </div>
      <Link
        // ✅ اصلاح این خط
        to={`/projects/${project.id}/reports`} // لینک به صفحه گزارش‌های این پروژه
        className="text-white bg-indigo-600 hover:bg-indigo-700 font-semibold mt-4 text-center py-2 px-4 rounded-md transition-colors"
      >
        مشاهده گزارش‌ها
      </Link>
    </div>
  );
}


function ProjectListScreen() {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projects);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 border-b-2 pb-2">
        لیست پروژه‌ها
      </h1>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectListScreen;