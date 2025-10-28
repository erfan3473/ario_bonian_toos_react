import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listPublicProjectsThunk } from '../features/projects/projectListSlice';
import ProjectCard from '../components/ProjectCard';
// ✅ اصلاح ایمپورت آیکون برای نسخه 2
import { CubeTransparentIcon } from '@heroicons/react/24/outline';

const PortfolioScreen = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projectList);

  useEffect(() => {
    dispatch(listPublicProjectsThunk());
  }, [dispatch]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-white mb-4">پروژه‌های ما</h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          نگاهی به برخی از پیمان‌ها و پروژه‌های موفقی که با افتخار به پایان رسانده‌ایم.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          {/* آیکون نسخه جدید با انیمیشن */}
          <CubeTransparentIcon className="h-16 w-16 text-teal-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg text-center">
          خطا در بارگذاری پروژه‌ها: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioScreen;
