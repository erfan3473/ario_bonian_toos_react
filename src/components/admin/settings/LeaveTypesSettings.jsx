import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from '../../../features/admin/dropdownsSlice';

const LeaveTypesSettings = () => {
  const dispatch = useDispatch();
  const { leaveTypes, updateStatus } = useSelector((state) => state.admin.dropdowns);
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const formRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    key: '', name: '', category: 'PAID', description: '',
    max_days_per_year: 0, requires_approval: true, requires_document: false, color_hex: '#3B82F6',
  });

  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  const filteredLeaveTypes = useMemo(() => {
    return (leaveTypes || []).filter((lt) =>
      lt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lt.key?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaveTypes, searchTerm]);

  const groupedLeaveTypes = useMemo(() => {
    return filteredLeaveTypes.reduce((acc, lt) => {
      const cat = lt.category || 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(lt);
      return acc;
    }, {});
  }, [filteredLeaveTypes]);

  // تنظیم رنگ‌ها به صورت داینامیک بر اساس تم
  const categoryConfig = {
    PAID: {
      name: '💰 مرخصی با حقوق', icon: '💰',
      gradient: isDark ? 'from-green-900/40 to-green-800/10' : 'from-green-50 to-white',
      borderColor: isDark ? 'border-green-700/50' : 'border-green-200',
      textColor: isDark ? 'text-green-400' : 'text-green-700',
    },
    UNPAID: {
      name: '🚫 مرخصی بدون حقوق', icon: '🚫',
      gradient: isDark ? 'from-red-900/40 to-red-800/10' : 'from-red-50 to-white',
      borderColor: isDark ? 'border-red-700/50' : 'border-red-200',
      textColor: isDark ? 'text-red-400' : 'text-red-700',
    },
    SICK: {
      name: '🏥 مرخصی استعلاجی', icon: '🏥',
      gradient: isDark ? 'from-blue-900/40 to-blue-800/10' : 'from-blue-50 to-white',
      borderColor: isDark ? 'border-blue-700/50' : 'border-blue-200',
      textColor: isDark ? 'text-blue-400' : 'text-blue-700',
    },
    MATERNITY: {
      name: '👶 مرخصی زایمان', icon: '👶',
      gradient: isDark ? 'from-pink-900/40 to-pink-800/10' : 'from-pink-50 to-white',
      borderColor: isDark ? 'border-pink-700/50' : 'border-pink-200',
      textColor: isDark ? 'text-pink-400' : 'text-pink-700',
    },
    SPECIAL: {
      name: '⭐ مرخصی استثنایی', icon: '⭐',
      gradient: isDark ? 'from-yellow-900/40 to-yellow-800/10' : 'from-yellow-50 to-white',
      borderColor: isDark ? 'border-yellow-700/50' : 'border-yellow-200',
      textColor: isDark ? 'text-yellow-400' : 'text-yellow-700',
    },
    OTHER: {
      name: '📋 سایر', icon: '📋',
      gradient: isDark ? 'from-gray-800/60 to-gray-700/30' : 'from-gray-100 to-white',
      borderColor: isDark ? 'border-gray-600' : 'border-gray-200',
      textColor: isDark ? 'text-gray-400' : 'text-gray-600',
    },
  };

  const suggestedColors = [
    { name: 'سبز', color: '#10B981' }, { name: 'آبی', color: '#3B82F6' },
    { name: 'قرمز', color: '#EF4444' }, { name: 'نارنجی', color: '#F59E0B' },
    { name: 'بنفش', color: '#8B5CF6' }, { name: 'صورتی', color: '#EC4899' },
    { name: 'فیروزه‌ای', color: '#14B8A6' }, { name: 'خاکستری', color: '#6B7280' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData, max_days_per_year: parseInt(formData.max_days_per_year) || 0 };
    if (editingId) dispatch(updateLeaveType({ id: editingId, data: submitData }));
    else dispatch(createLeaveType(submitData));
  };

  const resetForm = () => {
    setFormData({ key: '', name: '', category: 'PAID', description: '', max_days_per_year: 0, requires_approval: true, requires_document: false, color_hex: '#3B82F6' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (leaveType) => {
    setFormData({
      key: leaveType.key || '', name: leaveType.name || '', category: leaveType.category || 'PAID',
      description: leaveType.description || '', max_days_per_year: leaveType.max_days_per_year || 0,
      requires_approval: leaveType.requires_approval ?? true, requires_document: leaveType.requires_document ?? false,
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

  const generateKey = (name) => name.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name, key: editingId ? prev.key : generateKey(name) }));
  };

  useEffect(() => {
    if (updateStatus?.success) resetForm();
  }, [updateStatus?.success]);

  const inputClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'}`;
  const labelClass = `block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-dashed border-gray-500/30">
        <div>
          <h3 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>🏖️ انواع مرخصی</h3>
          <p className={`text-sm mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>مدیریت انواع مرخصی و تنظیمات مربوطه</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 rounded-xl font-bold transition shadow-sm ${
            showForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {showForm ? '❌ لغو' : '➕ نوع مرخصی جدید'}
        </button>
      </div>

      {updateStatus?.error && (
        <div className={`rounded-xl p-4 border font-bold flex items-center gap-2 ${isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-300 text-red-700'}`}>
          <span>❌</span> {updateStatus.error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className={`rounded-2xl p-6 border shadow-sm space-y-6 transition-colors scroll-mt-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className={`font-black text-lg pb-3 border-b ${isDark ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>
            {editingId ? '✏️ ویرایش نوع مرخصی' : '➕ ایجاد نوع مرخصی جدید'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>نام مرخصی <span className="text-red-500">*</span></label>
              <input type="text" value={formData.name} onChange={handleNameChange} placeholder="مرخصی استحقاقی" required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>کلید یکتا <span className="text-red-500">*</span></label>
              <input type="text" value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })} placeholder="ANNUAL_LEAVE" required disabled={!!editingId} className={`${inputClass} disabled:opacity-50 font-mono`} dir="ltr" />
              <p className={`text-[10px] mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>فقط حروف انگلیسی، اعداد و _ مجاز است</p>
            </div>

            <div>
              <label className={labelClass}>دسته‌بندی</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputClass}>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.name.replace(/^.+\s/, '')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>حداکثر روز در سال</label>
              <input type="number" min="0" max="365" value={formData.max_days_per_year} onChange={(e) => setFormData({ ...formData, max_days_per_year: parseInt(e.target.value) || 0 })} className={inputClass} />
              <p className={`text-[10px] mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>0 = بدون محدودیت</p>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>رنگ نمایش</label>
              <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                <input type="color" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} className={`w-14 h-12 rounded-xl cursor-pointer border-2 p-1 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`} />
                <input type="text" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} placeholder="#3B82F6" className={`${inputClass} sm:w-32 font-mono`} dir="ltr" />
                <div className="flex flex-wrap gap-2 mr-2">
                  {suggestedColors.map((item) => (
                    <button key={item.color} type="button" onClick={() => setFormData({ ...formData, color_hex: item.color })} className="w-8 h-8 rounded-lg hover:scale-110 transition shadow-sm border-2 border-transparent focus:border-white" style={{ backgroundColor: item.color }} title={item.name} />
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>توضیحات</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" placeholder="توضیحات تکمیلی درباره این نوع مرخصی..." className={`${inputClass} resize-none`} />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={formData.requires_approval} onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })} className={`w-5 h-5 rounded cursor-pointer transition-colors focus:ring-green-500 text-green-600 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`} />
              <span className={`font-bold text-sm transition-colors ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>✅ نیاز به تایید مدیر</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={formData.requires_document} onChange={(e) => setFormData({ ...formData, requires_document: e.target.checked })} className={`w-5 h-5 rounded cursor-pointer transition-colors focus:ring-green-500 text-green-600 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`} />
              <span className={`font-bold text-sm transition-colors ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>📄 نیاز به مدرک/گواهی</span>
            </label>
          </div>

          <div className={`rounded-xl p-4 border transition-colors ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>پیش‌نمایش:</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: formData.color_hex }}>
                {formData.name?.[0] || '?'}
              </div>
              <div>
                <p className={`font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{formData.name || 'نام مرخصی'}</p>
                <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {categoryConfig[formData.category]?.name} • حداکثر {formData.max_days_per_year || '∞'} روز
                </p>
              </div>
            </div>
          </div>

          <div className={`flex justify-end gap-3 pt-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button type="button" onClick={resetForm} disabled={updateStatus?.loading} className={`px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>انصراف</button>
            <button type="submit" disabled={updateStatus?.loading} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl font-bold transition disabled:opacity-50 shadow-md flex items-center justify-center min-w-[140px]">
              {updateStatus?.loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
        <input type="text" placeholder="جستجو در انواع مرخصی..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pr-10 pl-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 text-center border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{(leaveTypes || []).length}</p>
          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>کل انواع مرخصی</p>
        </div>
        <div className={`rounded-xl p-4 text-center border shadow-sm ${isDark ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-3xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>{(leaveTypes || []).filter((l) => l.category === 'PAID').length}</p>
          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>با حقوق</p>
        </div>
        <div className={`rounded-xl p-4 text-center border shadow-sm ${isDark ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-3xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>{(leaveTypes || []).filter((l) => l.category === 'UNPAID').length}</p>
          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>بدون حقوق</p>
        </div>
        <div className={`rounded-xl p-4 text-center border shadow-sm ${isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{(leaveTypes || []).filter((l) => l.category === 'SICK').length}</p>
          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>استعلاجی</p>
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-6">
        {Object.entries(categoryConfig).map(([catKey, config]) => {
          const items = groupedLeaveTypes[catKey];
          if (!items || items.length === 0) return null;

          return (
            <div key={catKey} className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 border ${config.borderColor} shadow-sm`}>
              <div className={`flex items-center justify-between mb-5 pb-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-300/50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl drop-shadow-sm">{config.icon}</span>
                  <div>
                    <h4 className={`font-black text-lg ${config.textColor}`}>{config.name}</h4>
                    <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{items.length} نوع مرخصی</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((leaveType) => (
                  <div key={leaveType.id} className={`rounded-xl p-5 border transition-all hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-gray-800/90 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'}`}>
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0" style={{ backgroundColor: leaveType.color_hex, boxShadow: `0 4px 10px ${leaveType.color_hex}40` }}>
                        {leaveType.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h5 className={`font-black text-lg truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{leaveType.name}</h5>
                        <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{leaveType.key}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>حداکثر در سال:</span>
                        <span className={`font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{leaveType.max_days_per_year > 0 ? `${leaveType.max_days_per_year} روز` : '∞ نامحدود'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {leaveType.requires_approval && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm ${isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>✅ نیاز به تایید</span>
                        )}
                        {leaveType.requires_document && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm ${isDark ? 'bg-purple-900/30 text-purple-400 border-purple-700/50' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>📄 نیاز به مدرک</span>
                        )}
                      </div>
                    </div>

                    {leaveType.description && (
                      <div className={`rounded-lg p-3 mb-5 ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                        <p className="text-xs font-medium leading-relaxed line-clamp-2">{leaveType.description}</p>
                      </div>
                    )}

                    <div className={`flex gap-2 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <button onClick={() => handleEdit(leaveType)} className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>✏️ ویرایش</button>
                      <button onClick={() => handleDelete(leaveType.id, leaveType.name)} className="bg-red-600/90 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-sm">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredLeaveTypes.length === 0 && (
        <div className={`rounded-2xl p-12 text-center border-2 border-dashed ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
          <div className="text-6xl mb-4 opacity-50">🏖️</div>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ نوع مرخصی تعریف نشده'}</p>
        </div>
      )}

      <div className={`rounded-xl p-6 border flex items-start gap-3 ${isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
        <span className="text-2xl mt-0.5 opacity-80">ℹ️</span>
        <div>
          <h4 className={`font-black mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>راهنما</h4>
          <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-blue-200' : 'text-blue-900/80'}`}>
            انواع مرخصی برای مدیریت درخواست‌های مرخصی کارکنان استفاده می‌شود. هر نوع مرخصی می‌تواند سقف روزانه، نیاز به تایید مدیر و نیاز به مدرک داشته باشد. رنگ انتخابی در تقویم و گزارش‌ها نمایش داده می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypesSettings;