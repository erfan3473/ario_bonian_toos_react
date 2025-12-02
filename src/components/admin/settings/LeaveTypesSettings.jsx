// src/components/admin/settings/LeaveTypesSettings.jsx

import React, { useState, useEffect, useMemo } from 'react'; // ✅ اضافه کردن useMemo
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
    is_paid: true,
  });

  // ✅ گروه‌بندی با useMemo - فقط وقتی leaveTypes تغییر کنه
  const groupedLeaveTypes = useMemo(() => {
    return leaveTypes.reduce((acc, lt) => {
      const cat = lt.category || 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(lt);
      return acc;
    }, {});
  }, [leaveTypes]);

  const categoryNames = {
    PAID: '💰 مرخصی با حقوق',
    UNPAID: '🚫 مرخصی بدون حقوق',
    SICK: '🏥 مرخصی استعلاجی',
    MATERNITY: '👶 مرخصی زایمان',
    SPECIAL: '⭐ مرخصی استثنایی',
    OTHER: '📋 سایر',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      dispatch(updateLeaveType({ id: editingId, data: formData }));
    } else {
      dispatch(createLeaveType(formData));
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
      is_paid: true,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (leaveType) => {
    setFormData(leaveType);
    setEditingId(leaveType.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('آیا مطمئن هستید؟ این نوع مرخصی غیرفعال خواهد شد.')) {
      dispatch(deleteLeaveType(id));
    }
  };

  useEffect(() => {
    if (updateStatus.success) {
      resetForm();
      dispatch(resetUpdateStatus());
    }
  }, [updateStatus.success, dispatch]);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">🏖️ انواع مرخصی</h2>
          <p className="text-gray-400 text-sm">مدیریت انواع مرخصی و تنظیمات مربوطه</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition"
        >
          {showForm ? '✖️ انصراف' : '➕ افزودن نوع مرخصی'}
        </button>
      </div>

      {/* Form - بقیه کد مثل قبل */}
      {showForm && (
        <div className="bg-gray-700 rounded-lg p-6 mb-6 border border-gray-600">
          {/* فرم کامل... */}
        </div>
      )}

      {/* List */}
      <div className="space-y-6">
        {Object.keys(groupedLeaveTypes).map((category) => (
          <div key={category}>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              {categoryNames[category] || category}
              <span className="text-sm text-gray-500">
                ({groupedLeaveTypes[category].length})
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedLeaveTypes[category].map((leaveType) => (
                <div
                  key={leaveType.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition"
                >
                  {/* کارت مرخصی... */}
                </div>
              ))}
            </div>
          </div>
        ))}

        {leaveTypes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🏖️</div>
            <p>هیچ نوع مرخصی تعریف نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveTypesSettings;
