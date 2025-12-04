// src/components/admin/settings/LeaveTypesSettings.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';

const LeaveTypesSettings = () => {
  const dispatch = useDispatch();
  const { leaveTypes, updateStatus } = useSelector((state) => state.admin);

  const formRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    category: 'PAID',
    description: '',
    max_days_per_year: 0,
    requires_approval: true,
    requires_document: false,
    color_hex: '#3B82F6',
  });

  // ✅ اسکرول به فرم
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  // ✅ فیلتر با useMemo
  const filteredLeaveTypes = useMemo(() => {
    return leaveTypes.filter((lt) =>
      lt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lt.key?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaveTypes, searchTerm]);

  // ✅ گروه‌بندی با useMemo
  const groupedLeaveTypes = useMemo(() => {
    return filteredLeaveTypes.reduce((acc, lt) => {
      const cat = lt.category || 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(lt);
      return acc;
    }, {});
  }, [filteredLeaveTypes]);

  // ✅ تنظیمات دسته‌بندی‌ها
  const categoryConfig = {
    PAID: {
      name: '💰 مرخصی با حقوق',
      icon: '💰',
      gradient: 'from-green-900/60 to-green-800/30',
      borderColor: 'border-green-600',
      textColor: 'text-green-400',
      bgBadge: 'bg-green-900/50',
    },
    UNPAID: {
      name: '🚫 مرخصی بدون حقوق',
      icon: '🚫',
      gradient: 'from-red-900/60 to-red-800/30',
      borderColor: 'border-red-600',
      textColor: 'text-red-400',
      bgBadge: 'bg-red-900/50',
    },
    SICK: {
      name: '🏥 مرخصی استعلاجی',
      icon: '🏥',
      gradient: 'from-blue-900/60 to-blue-800/30',
      borderColor: 'border-blue-600',
      textColor: 'text-blue-400',
      bgBadge: 'bg-blue-900/50',
    },
    MATERNITY: {
      name: '👶 مرخصی زایمان',
      icon: '👶',
      gradient: 'from-pink-900/60 to-pink-800/30',
      borderColor: 'border-pink-600',
      textColor: 'text-pink-400',
      bgBadge: 'bg-pink-900/50',
    },
    SPECIAL: {
      name: '⭐ مرخصی استثنایی',
      icon: '⭐',
      gradient: 'from-yellow-900/60 to-yellow-800/30',
      borderColor: 'border-yellow-600',
      textColor: 'text-yellow-400',
      bgBadge: 'bg-yellow-900/50',
    },
    OTHER: {
      name: '📋 سایر',
      icon: '📋',
      gradient: 'from-gray-800/60 to-gray-700/30',
      borderColor: 'border-gray-600',
      textColor: 'text-gray-400',
      bgBadge: 'bg-gray-700/50',
    },
  };

  // ✅ رنگ‌های پیشنهادی
  const suggestedColors = [
    { name: 'سبز', color: '#10B981' },
    { name: 'آبی', color: '#3B82F6' },
    { name: 'قرمز', color: '#EF4444' },
    { name: 'نارنجی', color: '#F59E0B' },
    { name: 'بنفش', color: '#8B5CF6' },
    { name: 'صورتی', color: '#EC4899' },
    { name: 'فیروزه‌ای', color: '#14B8A6' },
    { name: 'خاکستری', color: '#6B7280' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      max_days_per_year: parseInt(formData.max_days_per_year) || 0,
    };

    if (editingId) {
      dispatch(updateLeaveType({ id: editingId, data: submitData }));
    } else {
      dispatch(createLeaveType(submitData));
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      name: '',
      category: 'PAID',
      description: '',
      max_days_per_year: 0,
      requires_approval: true,
      requires_document: false,
      color_hex: '#3B82F6',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (leaveType) => {
    setFormData({
      key: leaveType.key || '',
      name: leaveType.name || '',
      category: leaveType.category || 'PAID',
      description: leaveType.description || '',
      max_days_per_year: leaveType.max_days_per_year || 0,
      requires_approval: leaveType.requires_approval ?? true,
      requires_document: leaveType.requires_document ?? false,
      color_hex: leaveType.color_hex || '#3B82F6',
    });
    setEditingId(leaveType.id);
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`آیا از غیرفعال کردن "${name}" مطمئن هستید؟`)) {
      dispatch(deleteLeaveType(id));
    }
  };

  // ✅ تولید خودکار key از name
  const generateKey = (name) => {
    return name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      // فقط اگه در حالت ایجاد هستیم key رو auto-generate کن
      key: editingId ? prev.key : generateKey(name),
    }));
  };

  useEffect(() => {
    if (updateStatus.success) {
      resetForm();
      dispatch(resetUpdateStatus());
    }
  }, [updateStatus.success, dispatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-xl">🏖️ انواع مرخصی</h3>
          <p className="text-gray-400 text-sm mt-1">
            مدیریت انواع مرخصی و تنظیمات مربوطه
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition"
        >
          {showForm ? '❌ لغو' : '➕ نوع مرخصی جدید'}
        </button>
      </div>

      {/* Error Display */}
      {updateStatus.error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">❌ {updateStatus.error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4 scroll-mt-4"
        >
          <h4 className="text-white font-bold text-lg mb-4">
            {editingId ? '✏️ ویرایش نوع مرخصی' : '➕ ایجاد نوع مرخصی جدید'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                نام مرخصی *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="مرخصی استحقاقی"
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            {/* Key */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                کلید یکتا *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value.toUpperCase() })
                }
                placeholder="ANNUAL_LEAVE"
                required
                disabled={!!editingId}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono disabled:opacity-50"
              />
              <p className="text-gray-500 text-xs mt-1">
                فقط حروف انگلیسی، اعداد و _ مجاز است
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                دسته‌بندی
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.name.replace(/^.+\s/, '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Days */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                حداکثر روز در سال
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.max_days_per_year}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_days_per_year: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-1">
                0 = بدون محدودیت
              </p>
            </div>

            {/* Color Picker */}
            <div className="md:col-span-2">
              <label className="block text-gray-300 mb-2 font-bold">
                رنگ نمایش
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.color_hex}
                  onChange={(e) =>
                    setFormData({ ...formData, color_hex: e.target.value })
                  }
                  className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-600"
                />
                <input
                  type="text"
                  value={formData.color_hex}
                  onChange={(e) =>
                    setFormData({ ...formData, color_hex: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="w-32 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 font-mono"
                />
                <div className="flex flex-wrap gap-2">
                  {suggestedColors.map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color_hex: item.color })
                      }
                      className="w-8 h-8 rounded-lg hover:scale-110 transition border-2 border-gray-600 hover:border-white"
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-gray-300 mb-2 font-bold">
                توضیحات
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="2"
                placeholder="توضیحات تکمیلی درباره این نوع مرخصی..."
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.requires_approval}
                onChange={(e) =>
                  setFormData({ ...formData, requires_approval: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-300 group-hover:text-white transition">
                ✅ نیاز به تایید مدیر
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.requires_document}
                onChange={(e) =>
                  setFormData({ ...formData, requires_document: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-300 group-hover:text-white transition">
                📄 نیاز به مدرک/گواهی
              </span>
            </label>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-3">پیش‌نمایش:</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: formData.color_hex }}
              >
                {formData.name?.[0] || '?'}
              </div>
              <div>
                <p className="text-white font-bold">{formData.name || 'نام مرخصی'}</p>
                <p className="text-gray-400 text-sm">
                  {categoryConfig[formData.category]?.name} • حداکثر{' '}
                  {formData.max_days_per_year || '∞'} روز
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
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
              {updateStatus.loading
                ? '⏳ در حال ذخیره...'
                : editingId
                ? '💾 ذخیره تغییرات'
                : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="🔍 جستجو در انواع مرخصی..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{leaveTypes.length}</p>
          <p className="text-gray-400 text-sm">کل انواع مرخصی</p>
        </div>
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-400">
            {leaveTypes.filter((l) => l.category === 'PAID').length}
          </p>
          <p className="text-gray-400 text-sm">با حقوق</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-400">
            {leaveTypes.filter((l) => l.category === 'UNPAID').length}
          </p>
          <p className="text-gray-400 text-sm">بدون حقوق</p>
        </div>
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">
            {leaveTypes.filter((l) => l.category === 'SICK').length}
          </p>
          <p className="text-gray-400 text-sm">استعلاجی</p>
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-6">
        {Object.entries(categoryConfig).map(([catKey, config]) => {
          const items = groupedLeaveTypes[catKey];
          if (!items || items.length === 0) return null;

          return (
            <div
              key={catKey}
              className={`bg-gradient-to-br ${config.gradient} rounded-xl p-6 border ${config.borderColor}`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h4 className={`font-bold text-lg ${config.textColor}`}>
                      {config.name}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {items.length} نوع مرخصی
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((leaveType) => (
                  <div
                    key={leaveType.id}
                    className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-gray-500 transition-all hover:scale-[1.02]"
                  >
                    {/* Card Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{
                          backgroundColor: leaveType.color_hex,
                          boxShadow: `0 0 15px ${leaveType.color_hex}40`,
                        }}
                      >
                        {leaveType.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white font-bold text-lg truncate">
                          {leaveType.name}
                        </h5>
                        <p className="text-gray-500 text-xs font-mono">
                          {leaveType.key}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">حداکثر روز:</span>
                        <span className="text-white font-bold">
                          {leaveType.max_days_per_year > 0
                            ? `${leaveType.max_days_per_year} روز`
                            : '∞ بدون محدودیت'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {leaveType.requires_approval && (
                          <span className="inline-flex items-center gap-1 bg-yellow-900/30 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-700">
                            ✅ نیاز به تایید
                          </span>
                        )}
                        {leaveType.requires_document && (
                          <span className="inline-flex items-center gap-1 bg-purple-900/30 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-700">
                            📄 نیاز به مدرک
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {leaveType.description && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {leaveType.description}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={() => handleEdit(leaveType)}
                        className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition hover:scale-105"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(leaveType.id, leaveType.name)}
                        className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition hover:scale-105"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLeaveTypes.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">🏖️</div>
          <p className="text-gray-400 text-xl mb-2">
            {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ نوع مرخصی تعریف نشده'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm
              ? 'عبارت جستجو را تغییر دهید'
              : 'برای شروع یک نوع مرخصی جدید ایجاد کنید'}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
        <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
          <span>ℹ️</span> راهنما
        </h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          انواع مرخصی برای مدیریت درخواست‌های مرخصی کارکنان استفاده می‌شود.
          هر نوع مرخصی می‌تواند سقف روزانه، نیاز به تایید مدیر و نیاز به مدرک داشته باشد.
          رنگ انتخابی در تقویم و گزارش‌ها نمایش داده می‌شود.
        </p>
      </div>
    </div>
  );
};

export default LeaveTypesSettings;
