// src/screens/admin/SettingsScreen.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDropdowns } from '../../features/admin/adminSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import EmploymentTypesSettings from '../../components/admin/settings/EmploymentTypesSettings';
import PositionsSettings from '../../components/admin/settings/PositionsSettings';
import SkillLevelsSettings from '../../components/admin/settings/SkillLevelsSettings';
import LeaveTypesSettings from '../../components/admin/settings/LeaveTypesSettings';

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('employment-types');
  
  const { dropdownsLoading, dropdownsError } = useSelector((state) => state.admin);
  const projectsLoading = useSelector((state) => state.projects.loading);

  const tabs = [
    { id: 'employment-types', label: 'انواع حقوق و پرداخت', icon: '👔' },
    { id: 'positions', label: 'سمت‌های سازمانی', icon: '🎯' },
    { id: 'skill-levels', label: 'سطوح مهارت', icon: '⭐' },
    { id: 'leave-types', label: 'انواع مرخصی', icon: '🏖️' },
    { id: 'system', label: 'تنظیمات سیستم', icon: '⚙️' },
  ];

  useEffect(() => {
    dispatch(fetchDropdowns());
    dispatch(fetchProjects());
  }, [dispatch]);

  const isLoading = dropdownsLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-white text-xl">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  if (dropdownsError) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-red-400 text-xl mb-4">{dropdownsError}</p>
            <button
              onClick={() => dispatch(fetchDropdowns())}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition"
            >
              🔄 تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ⚙️ تنظیمات سیستم
          </h1>
          <p className="text-gray-400">
            مدیریت تنظیمات پایه و زیرساخت‌های سیستم مدیریت پروژه
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 mb-6 p-2">
          {/* 👇 تغییر اصلی اینجاست: justify-center اضافه شد */}
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
          <div className="p-6">
            {activeTab === 'employment-types' && <EmploymentTypesSettings />}
            {activeTab === 'positions' && <PositionsSettings />}
            {activeTab === 'skill-levels' && <SkillLevelsSettings />}
            {activeTab === 'leave-types' && <LeaveTypesSettings />}
            
            {activeTab === 'system' && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚙️</div>
                <p className="text-gray-400 text-xl mb-2">تنظیمات پیشرفته سیستم</p>
                <p className="text-gray-500">🚧 این بخش در دست توسعه است</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>💡 نکته: تغییرات در این بخش بر روی کل سیستم تأثیرگذار است</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;