import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FaCog, FaSync } from 'react-icons/fa';

import { fetchDropdowns } from '../../features/admin/dropdownsSlice';
import { fetchProjects } from '../../features/projects/projectSlice';

import EmploymentTypesSettings from '../../components/admin/settings/EmploymentTypesSettings';
import PositionsSettings from '../../components/admin/settings/PositionsSettings';
import SkillLevelsSettings from '../../components/admin/settings/SkillLevelsSettings';
import LeaveTypesSettings from '../../components/admin/settings/LeaveTypesSettings';
import ReminderSettings from '../../components/admin/settings/ReminderSettings'; 

const SettingsScreen = () => {
  const dispatch = useDispatch();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'employment-types';
  
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const { loading: dropdownsLoading, error: dropdownsError } = useSelector(
    (state) => state.admin.dropdowns || {}
  );
  const projectsLoading = useSelector((state) => state.projects?.loading);

  const tabs = [
    { id: 'employment-types', label: 'انواع حقوق و پرداخت', icon: '👔' },
    { id: 'positions', label: 'سمت‌های سازمانی', icon: '🎯' },
    { id: 'skill-levels', label: 'سطوح مهارت', icon: '⭐' },
    { id: 'leave-types', label: 'انواع مرخصی', icon: '🏖️' },
    { id: 'reminders', label: 'یادآوری پیامک', icon: '🔔' },
  ];

  useEffect(() => {
    dispatch(fetchDropdowns());
    dispatch(fetchProjects());
  }, [dispatch]);

  const isLoading = dropdownsLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  if (dropdownsError) {
    return (
      <div className={`min-h-[80vh] flex items-center justify-center p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-xl w-full">
          <div className={`rounded-2xl p-8 text-center border-2 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'}`}>
            <div className="text-6xl mb-4">❌</div>
            <p className={`text-xl font-bold mb-6 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{dropdownsError}</p>
            <button
              onClick={() => dispatch(fetchDropdowns())}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2 mx-auto"
            >
              <FaSync /> تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[85vh] p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`container mx-auto max-w-7xl rounded-2xl border-2 transition-all duration-300 shadow-xl ${
        isDark ? 'border-blue-700 bg-gray-800/50' : 'border-blue-600 bg-white'
      }`}>
        
        {/* هدر */}
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 sm:p-8 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center md:text-right mb-2 md:mb-0">
            <h1 className={`text-2xl md:text-3xl font-black flex items-center justify-center md:justify-start gap-3 mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <span className="text-blue-500 text-3xl"><FaCog /></span> تنظیمات سیستم
            </h1>
            <p className={`font-medium text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              مدیریت تنظیمات پایه و زیرساخت‌های سیستم مدیریت پروژه
            </p>
          </div>
        </div>

        {/* تب‌ها */}
        <div className={`p-4 sm:p-6 border-b overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex flex-nowrap md:flex-wrap gap-2 md:gap-3 min-w-max md:min-w-0 pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark 
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-transparent' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <span className="text-lg opacity-80">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* محتوای تب */}
        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'employment-types' && <EmploymentTypesSettings />}
          {activeTab === 'positions' && <PositionsSettings />}
          {activeTab === 'skill-levels' && <SkillLevelsSettings />}
          {activeTab === 'leave-types' && <LeaveTypesSettings />}
          {activeTab === 'reminders' && <ReminderSettings />}
        </div>

        {/* فوتر */}
        <div className={`p-4 sm:p-6 border-t text-center text-sm font-bold flex items-center justify-center gap-2 ${
          isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
        }`}>
          <span className="text-yellow-500 text-lg">💡</span> 
          نکته: تغییرات در این بخش بر روی کل سیستم تأثیرگذار است و در لحظه اعمال می‌شود.
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;