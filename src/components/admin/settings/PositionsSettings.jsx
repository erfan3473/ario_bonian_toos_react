// src/components/admin/settings/PositionsSettings.jsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createPosition,
  updatePosition,
  deletePosition,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';

const PositionsSettings = () => {
  const dispatch = useDispatch();
  const { positions, updateStatus } = useSelector((state) => state.admin);
  
  const formRef = useRef(null); // ✅ ref برای فرم
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    hierarchy_level: 3,
    parent_position: null,
    report_type: 'WORKER',
    color_hex: '#3B82F6',
    can_enter_boq_items: false,
    description: '',
  });

  // ✅ اسکرول به فرم وقتی باز میشه
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [showForm]);

  // ✅ فیلتر با useMemo
  const filteredPositions = useMemo(() => {
    return positions.filter((pos) =>
      pos.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [positions, searchTerm]);

  // ✅ گروه‌بندی با useMemo
  const groupedPositions = useMemo(() => {
    return filteredPositions.reduce((acc, pos) => {
      const level = pos.hierarchy_level || 0;
      if (!acc[level]) acc[level] = [];
      acc[level].push(pos);
      return acc;
    }, {});
  }, [filteredPositions]);

  // ✅ تنظیمات هر سطح
  const levelConfig = {
    0: {
      name: '👑 مدیریت ارشد',
      icon: '👑',
      cardSize: 'xl',
      gradient: 'from-purple-900/80 via-purple-800/60 to-purple-900/40',
      borderColor: 'border-purple-500',
      glowColor: 'shadow-purple-500/50',
      textColor: 'text-purple-300',
      bgColor: 'bg-purple-900/30',
      width: 'max-w-md',
      scale: 'scale-110',
    },
    1: {
      name: '🎯 سرپرستی',
      icon: '🎯',
      cardSize: 'lg',
      gradient: 'from-blue-900/70 via-blue-800/50 to-blue-900/30',
      borderColor: 'border-blue-500',
      glowColor: 'shadow-blue-500/40',
      textColor: 'text-blue-300',
      bgColor: 'bg-blue-900/30',
      width: 'max-w-sm',
      scale: 'scale-105',
    },
    2: {
      name: '👔 مسئولین میانی',
      icon: '👔',
      cardSize: 'md',
      gradient: 'from-green-900/60 via-green-800/40 to-green-900/20',
      borderColor: 'border-green-500',
      glowColor: 'shadow-green-500/30',
      textColor: 'text-green-300',
      bgColor: 'bg-green-900/30',
      width: 'max-w-xs',
      scale: 'scale-100',
    },
    3: {
      name: '👷 کارگران',
      icon: '👷',
      cardSize: 'sm',
      gradient: 'from-orange-900/50 via-orange-800/30 to-orange-900/10',
      borderColor: 'border-orange-500',
      glowColor: 'shadow-orange-500/20',
      textColor: 'text-orange-300',
      bgColor: 'bg-orange-900/30',
      width: 'max-w-[280px]',
      scale: 'scale-95',
    },
  };

  const reportTypeOptions = [
    { value: 'PROJECT_MANAGER', label: '👑 مدیر پروژه', icon: '👑' },
    { value: 'WORKSHOP_SUPERVISOR', label: '🎯 سرپرست', icon: '🎯' },
    { value: 'FOREMAN', label: '👔 سرکارگر', icon: '👔' },
    { value: 'WORKER', label: '👷 کارگر', icon: '👷' },
    { value: 'FACILITIES_STAFF', label: '🔧 تاسیسات', icon: '🔧' },
    { value: 'SECURITY_GUARD', label: '🛡️ نگهبان', icon: '🛡️' },
  ];

  const suggestedColors = [
    { name: 'کارگران ساختمانی', color: '#FFA500' },
    { name: 'تاسیسات', color: '#6B7280' },
    { name: 'باغبان', color: '#10B981' },
    { name: 'آبیار', color: '#3B82F6' },
    { name: 'نگهبان', color: '#EF4444' },
    { name: 'نظافت', color: '#8B5CF6' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updatePosition({ id: editingId, data: formData }));
    } else {
      dispatch(createPosition(formData));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      hierarchy_level: 3,
      parent_position: null,
      report_type: 'WORKER',
      color_hex: '#3B82F6',
      can_enter_boq_items: false,
      description: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  // ✅ ویرایش با اسکرول
  const handleEdit = (position) => {
    setFormData({
      title: position.title,
      code: position.code,
      hierarchy_level: position.hierarchy_level || 3,
      parent_position: position.parent_position,
      report_type: position.report_type || 'WORKER',
      color_hex: position.color_hex || '#3B82F6',
      can_enter_boq_items: position.can_enter_boq_items || false,
      description: position.description || '',
    });
    setEditingId(position.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('آیا مطمئن هستید؟ این سمت غیرفعال خواهد شد.')) {
      dispatch(deletePosition(id));
    }
  };

  useEffect(() => {
    if (updateStatus.success) {
      resetForm();
      dispatch(resetUpdateStatus());
    }
  }, [updateStatus.success, dispatch]);

  // ✅ سایز کارت بر اساس سطح
  const getCardStyles = (level) => {
    const config = levelConfig[level] || levelConfig[3];
    return config;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-xl">🎯 سمت‌های سازمانی</h3>
          <p className="text-gray-400 text-sm mt-1">
            مدیریت سمت‌ها با رنگ‌بندی برای نقشه
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-bold"
        >
          {showForm ? '❌ لغو' : '➕ سمت جدید'}
        </button>
      </div>

      {/* Error Display */}
      {updateStatus.error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">❌ {updateStatus.error}</p>
        </div>
      )}

      {/* Form - با ref و scroll-mt */}
      {showForm && (
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4 scroll-mt-4"
        >
          <h4 className="text-white font-bold text-lg mb-4">
            {editingId ? '✏️ ویرایش سمت' : '➕ ایجاد سمت جدید'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-bold">عنوان سمت *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="کارگر ساختمانی"
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">کد سمت *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="CONSTRUCTION_WORKER"
                required
                disabled={!!editingId}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">سطح سلسله‌مراتب</label>
              <select
                value={formData.hierarchy_level}
                onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">0 - 👑 مدیریت ارشد</option>
                <option value="1">1 - 🎯 سرپرستی</option>
                <option value="2">2 - 👔 مسئولین میانی</option>
                <option value="3">3 - 👷 کارگران</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">نوع گزارش</label>
              <select
                value={formData.report_type}
                onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                {reportTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">سمت والد</label>
              <select
                value={formData.parent_position || ''}
                onChange={(e) => setFormData({ ...formData, parent_position: e.target.value || null })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">بدون والد</option>
                {positions
                  .filter((p) => p.id !== editingId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (سطح {p.hierarchy_level})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">رنگ برای نقشه</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  className="w-16 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  placeholder="#FFA500"
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedColors.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color_hex: item.color })}
                    className="px-2 py-1 rounded text-xs hover:scale-110 transition"
                    style={{ backgroundColor: item.color, color: '#fff' }}
                    title={item.name}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-bold">توضیحات</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="توضیحات تکمیلی..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.can_enter_boq_items}
              onChange={(e) => setFormData({ ...formData, can_enter_boq_items: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-300">✅ دسترسی ثبت فهرست‌بها</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={resetForm}
              disabled={updateStatus.loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={updateStatus.loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
            >
              {updateStatus.loading ? '⏳ در حال ذخیره...' : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="🔍 جستجو در سمت‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* 🏛️ هرم سازمانی */}
      <div className="relative">
        {/* عنوان هرم */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">🏛️ هرم سازمانی</h2>
          <p className="text-gray-400">ساختار سلسله مراتبی سمت‌ها</p>
        </div>

        {/* هرم */}
        <div className="relative flex flex-col items-center gap-0">
          {Object.keys(groupedPositions)
            .sort((a, b) => Number(a) - Number(b))
            .map((level, index, arr) => {
              const config = getCardStyles(level);
              const isLastLevel = index === arr.length - 1;
              
              return (
                <div key={level} className="relative w-full">
                  {/* خط اتصال به سطح بعدی */}
                  {!isLastLevel && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full z-10">
                      {/* خط عمودی */}
                      <div 
                        className={`w-1 h-12 bg-gradient-to-b ${config.gradient} mx-auto`}
                        style={{
                          boxShadow: `0 0 20px ${config.borderColor.replace('border-', '')}`,
                        }}
                      />
                      {/* فلش */}
                      <div className={`w-0 h-0 mx-auto
                        border-l-[12px] border-l-transparent
                        border-r-[12px] border-r-transparent
                        border-t-[16px] ${config.borderColor.replace('border', 'border-t')}`}
                      />
                    </div>
                  )}

                  {/* کانتینر سطح */}
                  <div 
                    className={`
                      relative py-8 px-4 rounded-3xl mb-4 transition-all duration-500
                      bg-gradient-to-b ${config.gradient}
                      border-2 ${config.borderColor}
                      shadow-2xl ${config.glowColor}
                    `}
                    style={{
                      marginLeft: `${level * 3}%`,
                      marginRight: `${level * 3}%`,
                    }}
                  >
                    {/* هدر سطح */}
                    <div className="text-center mb-6 relative">
                      {/* آیکون بزرگ */}
                      <div 
                        className={`
                          inline-flex items-center justify-center 
                          w-16 h-16 rounded-full mb-3
                          ${config.bgColor} border-2 ${config.borderColor}
                          shadow-lg ${config.glowColor}
                          animate-pulse
                        `}
                      >
                        <span className="text-4xl">{config.icon}</span>
                      </div>
                      
                      <h3 className={`text-2xl font-bold ${config.textColor}`}>
                        {config.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {groupedPositions[level].length} سمت در این سطح
                      </p>

                      {/* خط تزئینی */}
                      <div className={`w-32 h-1 mx-auto mt-4 rounded-full bg-gradient-to-r ${config.gradient}`} />
                    </div>

                    {/* کارت‌های سمت */}
                    <div className="flex flex-wrap justify-center gap-4">
                      {groupedPositions[level].map((position) => (
                        <div
                          key={position.id}
                          className={`
                            ${config.width} w-full
                            bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5
                            border-2 border-gray-700 hover:${config.borderColor}
                            transition-all duration-300 hover:scale-105
                            shadow-xl hover:shadow-2xl hover:${config.glowColor}
                            ${config.scale}
                          `}
                        >
                          {/* هدر کارت */}
                          <div className="flex items-center gap-3 mb-4">
                            {/* رنگ سمت */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                              style={{ 
                                backgroundColor: position.color_hex,
                                boxShadow: `0 0 20px ${position.color_hex}50`,
                              }}
                            >
                              {position.title?.[0]}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-white font-bold text-lg">{position.title}</h5>
                              <p className="text-gray-500 text-xs font-mono">{position.code}</p>
                            </div>
                          </div>

                          {/* نوع گزارش */}
                          <div className="mb-3">
                            <span
                              className={`
                                inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                                ${position.report_type === 'PROJECT_MANAGER'
                                  ? 'bg-purple-900/50 text-purple-300 border border-purple-600'
                                  : position.report_type === 'WORKSHOP_SUPERVISOR'
                                  ? 'bg-blue-900/50 text-blue-300 border border-blue-600'
                                  : position.report_type === 'FOREMAN'
                                  ? 'bg-green-900/50 text-green-300 border border-green-600'
                                  : position.report_type === 'WORKER'
                                  ? 'bg-orange-900/50 text-orange-300 border border-orange-600'
                                  : 'bg-gray-700 text-gray-300 border border-gray-600'
                                }
                              `}
                            >
                              {reportTypeOptions.find((o) => o.value === position.report_type)?.icon}
                              {reportTypeOptions.find((o) => o.value === position.report_type)?.label.replace(/^.+\s/, '')}
                            </span>
                          </div>

                          {/* گزارش به */}
                          {position.parent_position_title && (
                            <div className="text-sm mb-3 flex items-center gap-2">
                              <span className="text-gray-500">📊 گزارش به:</span>
                              <span className={config.textColor}>{position.parent_position_title}</span>
                            </div>
                          )}

                          {/* دسترسی فهرست‌بها */}
                          {position.can_enter_boq_items && (
                            <div className="bg-green-900/30 border border-green-700 rounded-lg px-3 py-2 mb-3">
                              <span className="text-green-400 text-xs font-bold">
                                ✅ دسترسی ثبت فهرست‌بها
                              </span>
                            </div>
                          )}

                          {/* دکمه‌ها */}
                          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
                            <button
                              onClick={() => handleEdit(position)}
                              className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                            >
                              ✏️ ویرایش
                            </button>
                            <button
                              onClick={() => handleDelete(position.id)}
                              className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* پایه هرم */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-full px-6 py-3">
            <span className="text-gray-400">📊 مجموع:</span>
            <span className="text-white font-bold text-xl">{filteredPositions.length}</span>
            <span className="text-gray-400">سمت سازمانی</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredPositions.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400 text-xl">سمتی یافت نشد</p>
        </div>
      )}
    </div>
  );
};

export default PositionsSettings;
