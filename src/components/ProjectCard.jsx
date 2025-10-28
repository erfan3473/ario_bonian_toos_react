import React from 'react';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
const defaultImage =
  'https://images.unsplash.com/photo-1542621334-a254cf47763b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80';

const ProjectCard = ({ project }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'نامشخص';
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out group">
      <img
        src={
          project.portfolio_image
            ? `http://127.0.0.1:8000${project.portfolio_image}`
            : defaultImage
        }
        alt={project.name}
        className="w-full h-48 object-cover"
      />

      <div className="p-6">
        <h3 className="text-2xl font-bold text-teal-400 mb-2 group-hover:text-teal-300 transition-colors">
          {project.name}
        </h3>

        <div className="flex items-center text-gray-400 mb-4">
          <MapPinIcon className="h-5 w-5 ml-2 text-gray-500" />
          <span>{project.location_text}</span>
        </div>

        <div className="flex items-center text-gray-400 mb-4">
          <CalendarIcon className="h-5 w-5 ml-2 text-gray-500" />
          <span>
            {formatDate(project.start_date)} -{' '}
            {project.end_date ? formatDate(project.end_date) : 'در حال انجام'}
          </span>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              project.is_active
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {project.is_active ? 'فعال' : 'خاتمه یافته'}
          </span>
          <Link
  to={`/projects/${project.id}`}
  className="text-teal-400 hover:text-teal-200 font-semibold transition-colors"
>
  جزئیات بیشتر &rarr;
</Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
