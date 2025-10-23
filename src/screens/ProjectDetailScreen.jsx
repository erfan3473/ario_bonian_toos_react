import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPinIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/solid';

const API_BASE = 'http://127.0.0.1:8000/api/projects/';

const ProjectDetailScreen = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}${id}/`)
      .then((res) => {
        setProject(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">در حال بارگذاری...</div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-500/20 text-red-400 p-4 rounded-lg text-center">
        خطا در دریافت اطلاعات پروژه: {error}
      </div>
    );

  if (!project) return null;

  const imageUrl = project.portfolio_image
    ? `http://127.0.0.1:8000${project.portfolio_image}`
    : 'https://images.unsplash.com/photo-1542621334-a254cf47763b?...';

  return (
    <div className="container mx-auto px-4 py-8 text-gray-200">
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <img
          src={imageUrl}
          alt={project.name}
          className="w-full h-96 object-cover"
        />

        <div className="p-8">
          <h1 className="text-4xl font-extrabold text-teal-400 mb-4">
            {project.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 ml-2 text-gray-500" />
              {project.location_text}
            </div>

            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 ml-2 text-gray-500" />
              از {project.start_date} تا{' '}
              {project.end_date || 'در حال انجام'}
            </div>

            {project.project_manager_name && (
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 ml-2 text-gray-500" />
                مدیر: {project.project_manager_name}
              </div>
            )}
          </div>

          <div className="text-lg leading-relaxed">
            <p>کد مرکز هزینه: {project.cost_center?.code || '—'}</p>
            <p>بودجه کل: {project.total_budget || '—'}</p>
            <p>بودجه مصرف‌شده: {project.spent_budget || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailScreen;
