// src/components/admin/settings/PositionsSettings.jsx

import React, { useState, useMemo } from 'react';
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

  const levelNames = {
    0: '👑 مدیریت ارشد',
    1: '🎯 سرپرستی',
    2: '👔 مسئولین میانی',
    3: '👷 کارگران',
  };

  const reportTypeOptions = [
    { value: 'PROJECT_MANAGER', label: '👑 مدیر پروژه', icon: '👑' },
    { value: 'WORKSHOP_SUPERVISOR', label: '🎯 سرپرست', icon: '🎯' },
    { value: 'FOREMAN', label: '👔 سرکارگر', icon: '👔' },
    { value: 'WORKER', label: '👷 کارگر', icon: '👷' },
    { value: 'FACILITIES_STAFF', label: '🔧 تاسیسات', icon: '🔧' },
    { value: 'SECURITY_GUARD', label: '🛡️ نگهبان', icon: '🛡️' },
  ];

  // ✅ رنگ‌های پیشنهادی
  const suggestedColors = [
    { name: 'کارگران ساختمانی', color: '#FFA500' },  // نارنجی
    { name: 'تاسیسات', color: '#6B7280' },           // خاکستری
    { name: 'باغبان', color: '#10B981' },            // سبز
    { name: 'آبیار', color: '#3B82F6' },             // آبی
    { name: 'نگهبان', color: '#EF4444' },            // قرمز
    { name: 'نظافت', color: '#8B5CF6' },             // بنفش
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

  React.useEffect(() => {
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

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4">
          <h4 className="text-white font-bold text-lg mb-4">
            {editingId ? '✏️ ویرایش سمت' : '➕ ایجاد سمت جدید'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
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

            {/* Code */}
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

            {/* Hierarchy Level */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">سطح سلسله‌مراتب</label>
              <select
                value={formData.hierarchy_level}
                onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">0 - مدیریت ارشد</option>
                <option value="1">1 - سرپرستی</option>
                <option value="2">2 - مسئولین میانی</option>
                <option value="3">3 - کارگران</option>
              </select>
            </div>

            {/* Report Type */}
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

            {/* Parent Position */}
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

            {/* Color Picker */}
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
              
              {/* Suggested Colors */}
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

          {/* Description */}
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

          {/* Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.can_enter_boq_items}
              onChange={(e) => setFormData({ ...formData, can_enter_boq_items: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-300">✅ دسترسی ثبت فهرست‌بها</span>
          </label>

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

      {/* Hierarchy Tree */}
      <div className="space-y-6">
        {Object.keys(groupedPositions)
          .sort((a, b) => Number(a) - Number(b))
          .map((level) => (
            <div key={level} className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="mb-4 pb-3 border-b border-gray-700">
                <h4 className="text-white font-bold text-lg">
                  {levelNames[level] || `سطح ${level}`}
                </h4>
                <p className="text-gray-400 text-sm">
                  {groupedPositions[level].length} سمت
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedPositions[level].map((position) => (
                  <div
                    key={position.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* Color Indicator */}
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-600"
                          style={{ backgroundColor: position.color_hex }}
                          title={`رنگ: ${position.color_hex}`}
                        />
                        <div>
                          <h5 className="text-white font-bold text-lg">{position.title}</h5>
                          <p className="text-gray-400 text-sm font-mono">{position.code}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          position.report_type === 'PROJECT_MANAGER'
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-700'
                            : position.report_type === 'WORKSHOP_SUPERVISOR'
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                            : position.report_type === 'FOREMAN'
                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                            : position.report_type === 'WORKER'
                            ? 'bg-orange-900/30 text-orange-400 border border-orange-700'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {reportTypeOptions.find((o) => o.value === position.report_type)?.label}
                      </span>
                    </div>

                    {position.parent_position && (
                      <div className="text-gray-400 text-sm mb-2">
                        <span className="text-gray-500">گزارش به:</span>{' '}
                        <span className="text-blue-400">{position.parent_position_title}</span>
                      </div>
                    )}

                    {position.can_enter_boq_items && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <span className="text-green-400 text-xs font-bold">
                          ✅ دسترسی ثبت فهرست‌بها
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(position)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(position.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
