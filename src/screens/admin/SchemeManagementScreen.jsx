// src/screens/admin/SchemeManagementScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getJobClasses, createJobClass, updateJobClass,
  getJobGroups, createJobGroup, updateJobGroup 
} from '../../features/admin/adminSchemeSlice';

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center backdrop-blur-sm">
    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-3"></div>
      <p className="text-gray-700 font-medium text-sm">در حال پردازش...</p>
    </div>
  </div>
);

const SchemeManagementScreen = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('classes');
  const { jobClasses, jobGroups, loading } = useSelector(state => state.adminScheme);

  // States for Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ code: '', title: '', default_group_number: '' });
  const [editingClassId, setEditingClassId] = useState(null);

  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // ✅ اصلاح شد: حذف فیلدهای سنوات از استیت
  const [groupForm, setGroupForm] = useState({ 
    year: 1404, 
    group_number: '', 
    base_monthly_wage: '', 
    base_daily_wage: '' 
  });
  const [editingGroupId, setEditingGroupId] = useState(null);

  useEffect(() => {
    dispatch(getJobClasses());
    dispatch(getJobGroups({ year: 1404 }));
  }, [dispatch]);

  const availableGroupNumbers = useMemo(() => {
    const groups = jobGroups.map(g => g.group_number);
    return [...new Set(groups)].sort((a, b) => a - b);
  }, [jobGroups]);

  // --- Handlers for Job Class ---
  const handleEditClass = (item) => {
    setClassForm(item);
    setEditingClassId(item.id);
    setShowClassModal(true);
  };
  
  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (editingClassId) {
      await dispatch(updateJobClass({ id: editingClassId, data: classForm }));
    } else {
      await dispatch(createJobClass(classForm));
    }
    setShowClassModal(false);
    setClassForm({ code: '', title: '', default_group_number: '' });
    setEditingClassId(null);
  };

  // --- Handlers for Job Group ---
  const handleEditGroup = (item) => {
    setGroupForm(item);
    setEditingGroupId(item.id);
    setShowGroupModal(true);
  };

  const handleWageChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...groupForm, [name]: value };

    if (value && !isNaN(value)) {
        const val = Number(value);
        // محاسبه خودکار مزد شغل (روزانه <-> ماهانه)
        if (name === 'base_monthly_wage') {
            newForm.base_daily_wage = Math.round(val / 30);
        } else if (name === 'base_daily_wage') {
            newForm.base_monthly_wage = val * 30;
        }
    }
    setGroupForm(newForm);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (editingGroupId) {
      await dispatch(updateJobGroup({ id: editingGroupId, data: groupForm }));
    } else {
      await dispatch(createJobGroup(groupForm));
    }
    setShowGroupModal(false);
    // ✅ ریست فرم بدون سنوات
    setGroupForm({ year: 1404, group_number: '', base_monthly_wage: '', base_daily_wage: '' });
    setEditingGroupId(null);
  };

  const inputClassName = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white";

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative">
      
      {loading && <LoadingOverlay />}

      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت جداول طرح طبقه‌بندی</h1>
          <div className="flex bg-white rounded-md shadow-sm">
            <button 
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${activeTab === 'classes' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              عناوین شغلی
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${activeTab === 'groups' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              گروه‌های شغلی و مزد
            </button>
          </div>
        </div>

        {/* --- Tab 1: Job Classes --- */}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700">لیست مشاغل (Job Classes)</h3>
              <button onClick={() => { setClassForm({}); setEditingClassId(null); setShowClassModal(true); }} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 shadow-sm transition-colors">
                + شغل جدید
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">کد شغل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عنوان شغل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">گروه پیش‌فرض</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobClasses.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.default_group_number ? `گروه ${item.default_group_number}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-medium">
                        <button onClick={() => handleEditClass(item)} className="text-indigo-600 hover:text-indigo-900 font-semibold">ویرایش</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab 2: Job Groups --- */}
        {activeTab === 'groups' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700">جدول مزد گروه‌ها (سال ۱۴۰۴)</h3>
              <button onClick={() => { setGroupForm({ year: 1404 }); setEditingGroupId(null); setShowGroupModal(true); }} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 shadow-sm transition-colors">
                + گروه جدید
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">گروه</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مزد روزانه</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مزد ماهانه (۳۰ روز)</th>
                    {/* ستون‌های سنوات حذف شدند */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobGroups.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.group_number}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                         {item.base_daily_wage ? Number(item.base_daily_wage).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900 font-bold">
                         {Number(item.base_monthly_wage).toLocaleString() + ' ریال'}
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-medium">
                        <button onClick={() => handleEditGroup(item)} className="text-indigo-600 hover:text-indigo-900 font-semibold">ویرایش</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === MODALS === */}
        
        {/* Modal: Job Class */}
        {showClassModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full animate-fadeIn">
              <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                {editingClassId ? 'ویرایش شغل' : 'تعریف شغل جدید'}
              </h3>
              <form onSubmit={handleSaveClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">کد شغل (طبق طرح)</label>
                  <input value={classForm.code || ''} onChange={e => setClassForm({...classForm, code: e.target.value})} className={`${inputClassName} text-left ltr`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">عنوان شغل</label>
                  <input value={classForm.title || ''} onChange={e => setClassForm({...classForm, title: e.target.value})} className={inputClassName} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">گروه شغلی پیش‌فرض</label>
                  <select value={classForm.default_group_number || ''} onChange={e => setClassForm({...classForm, default_group_number: e.target.value})} className={inputClassName}>
                    <option value="">-- انتخاب کنید --</option>
                    {availableGroupNumbers.map((num) => (
                      <option key={num} value={num}>گروه {num}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                  <button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">لغو</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow-sm">ذخیره</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Job Group */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full animate-fadeIn">
              <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                {editingGroupId ? 'ویرایش گروه' : 'تعریف گروه جدید'}
              </h3>
              <form onSubmit={handleSaveGroup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">سال</label>
                    <input type="number" name="year" value={groupForm.year || ''} onChange={e => setGroupForm({...groupForm, year: e.target.value})} className={`${inputClassName} text-center`} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">شماره گروه</label>
                    <input type="number" name="group_number" value={groupForm.group_number || ''} onChange={e => setGroupForm({...groupForm, group_number: e.target.value})} className={`${inputClassName} text-center`} required />
                  </div>
                </div>

                {/* بخش مزد شغل */}
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-2">مزد شغل (ریال)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] text-gray-600 mb-1">روزانه</label>
                            <input type="number" name="base_daily_wage" value={groupForm.base_daily_wage || ''} onChange={handleWageChange} className={`${inputClassName} text-left ltr`} placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-600 mb-1">ماهانه (۳۰ روز)</label>
                            <input type="number" name="base_monthly_wage" value={groupForm.base_monthly_wage || ''} onChange={handleWageChange} className={`${inputClassName} text-left ltr font-bold`} required placeholder="0" />
                        </div>
                    </div>
                </div>

                {/* ✅ فیلدهای سنوات حذف شدند چون به گروه ربطی ندارند */}

                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                  <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">لغو</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow-sm">ذخیره</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SchemeManagementScreen;