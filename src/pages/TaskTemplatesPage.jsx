import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchTaskTemplates, 
  deleteTaskTemplate, 
  updateTaskTemplate 
} from '../features/task/taskSlice';
import { 
  FaBolt, FaArrowRight, FaSearch, FaTimes, FaEdit, 
  FaTrash, FaSpinner, FaLayerGroup, FaLock, FaGlobe, 
  FaUserLock, FaSitemap, FaCheck, FaPlus, FaFileAlt, 
  FaCog, FaArrowLeft, FaCheckDouble
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const URGENCY_LABELS = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', CRITICAL: 'بحرانی' };
const URGENCY_COLORS = { 
  LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/30', 
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/30', 
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30', 
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30' 
};

const TaskTemplatesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { templates, loadingTemplates } = useSelector((state) => state.task);

  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeEditTab, setActiveEditTab] = useState('GENERAL'); // 'GENERAL' | 'WORKFLOW'
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // فرم مشخصات پایه
  const [formData, setFormData] = useState({
    template_name: '',
    is_global: false,
    title: '',
    urgency: 'MEDIUM',
    note: '',
  });

  // استیت مراحل گردش کار قالب
  const [editStages, setEditStages] = useState([]);

  useEffect(() => {
    dispatch(fetchTaskTemplates());
  }, [dispatch]);

  const filteredTemplates = useMemo(() => {
    return (templates || []).filter(t => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const name = (t.template_name || '').toLowerCase();
      const title = (t.template_data?.title || '').toLowerCase();
      return name.includes(q) || title.includes(q);
    });
  }, [templates, search]);

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    setActiveEditTab('GENERAL');
    setFormData({
      template_name: template.template_name || '',
      is_global: Boolean(template.is_global),
      title: template.template_data?.title || '',
      urgency: template.template_data?.urgency || 'MEDIUM',
      note: template.template_data?.note || '',
    });

    // استخراج مراحل گردش کار قالب
    const rawStages = template.template_data?.workflow_stages || [];
    if (rawStages.length > 0) {
      setEditStages(rawStages.map((s, idx) => ({
        id: s.id || `stg-${idx}-${Date.now()}`,
        step_index: idx + 1,
        stage_name: s.stage_name || s.name || `مرحله ${idx + 1}`,
        description: s.description || s.stage_description || s.desc || '',
        approval_rule: s.approval_rule || 'ANY_ASSIGNEE',
        approver_rule: s.approver_rule || 'ALL_APPROVERS',
        require_file: Boolean(s.require_file),
        assignee_ids: s.assignee_ids || s.assignees || [],
        intermediate_approvers: s.intermediate_approvers || []
      })));
    } else {
      setEditStages([{
        id: `stg-1-${Date.now()}`,
        step_index: 1,
        stage_name: 'مرحله ۱',
        description: '',
        approval_rule: 'ANY_ASSIGNEE',
        approver_rule: 'ALL_APPROVERS',
        require_file: false,
        assignee_ids: [],
        intermediate_approvers: []
      }]);
    }
  };

  const handleAddStage = () => {
    const nextIdx = editStages.length + 1;
    setEditStages(prev => [
      ...prev,
      {
        id: `stg-${nextIdx}-${Date.now()}`,
        step_index: nextIdx,
        stage_name: `مرحله ${nextIdx}`,
        description: '',
        approval_rule: 'ANY_ASSIGNEE',
        approver_rule: 'ALL_APPROVERS',
        require_file: false,
        assignee_ids: [],
        intermediate_approvers: []
      }
    ]);
  };

  const handleRemoveStage = (idx) => {
    if (editStages.length <= 1) {
      toast.error('حداقل یک مرحله در گردش کار الزامی است.');
      return;
    }
    setEditStages(prev => prev.filter((_, i) => i !== idx).map((stg, i) => ({ ...stg, step_index: i + 1 })));
  };

  const handleStageFieldChange = (idx, field, value) => {
    setEditStages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formData.template_name.trim()) {
      toast.error('نام قالب نمی‌تواند خالی باشد');
      return;
    }

    // اعتبارسنجی نام مراحل
    for (let i = 0; i < editStages.length; i++) {
      if (!editStages[i].stage_name.trim()) {
        toast.error(`نام مرحله ${i + 1} نمی‌تواند خالی باشد`);
        setActiveEditTab('WORKFLOW');
        return;
      }
    }

    setSaving(true);
    const updatedPayload = {
      template_name: formData.template_name.trim(),
      is_global: formData.is_global,
      template_data: {
        ...(editingTemplate.template_data || {}),
        title: formData.title.trim(),
        urgency: formData.urgency,
        note: formData.note.trim(),
        workflow_stages: editStages.map((s, idx) => ({
          step_index: idx + 1,
          stage_name: s.stage_name.trim(),
          description: s.description.trim(),
          approval_rule: s.approval_rule,
          approver_rule: s.approver_rule,
          require_file: s.require_file,
          assignee_ids: s.assignee_ids,
          intermediate_approvers: s.intermediate_approvers
        }))
      }
    };

    const res = await dispatch(updateTaskTemplate({
      templateId: editingTemplate.id,
      payload: updatedPayload
    }));

    setSaving(false);
    if (!res.error) {
      toast.success('قالب و گردش کار آن با موفقیت ذخیره شد');
      setEditingTemplate(null);
    } else {
      toast.error(res.payload || 'خطا در ویرایش قالب');
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`آیا از حذف قالب «${templateName}» اطمینان دارید؟`)) return;
    setDeletingId(templateId);
    const res = await dispatch(deleteTaskTemplate(templateId));
    setDeletingId(null);
    if (!res.error) {
      toast.success('قالب با موفقیت حذف شد');
    } else {
      toast.error(res.payload || 'خطا در حذف قالب');
    }
  };

  return (
    <div className={`min-h-screen py-4 sm:py-6 ${isDark ? 'text-white' : 'text-gray-900'}`} dir="rtl">
      <div className="container mx-auto px-2 sm:px-4 max-w-5xl">
        
        {/* هدر صفحه */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/tasks')}
              className={`p-2 rounded-xl border transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-gray-300 hover:text-white' 
                  : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
              title="بازگشت به ماموریت‌ها"
            >
              <FaArrowRight size={14} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FaBolt size={14} />
              </div>
              <h1 className="text-base sm:text-xl font-bold">مدیریت قالب‌ها و گردش کار</h1>
            </div>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all self-end sm:self-auto"
          >
            <FaBolt size={12} />
            <span>اجرای قالب در کارتابل</span>
          </button>
        </div>

        {/* جستجو */}
        <div className={`p-3 rounded-2xl border mb-5 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors ${
            isDark ? 'bg-slate-800/90 border-slate-700 focus-within:border-purple-500' : 'bg-gray-50 border-gray-300 focus-within:border-purple-500'
          }`}>
            <FaSearch className={`${isDark ? 'text-gray-400' : 'text-gray-500'} shrink-0`} size={12} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در نام قالب یا عنوان ماموریت..."
              className={`bg-transparent text-xs sm:text-sm flex-1 outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-200 p-0.5">
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        {/* لیست قالب‌ها */}
        {loadingTemplates ? (
          <div className="flex justify-center items-center py-24">
            <FaSpinner className="animate-spin text-purple-500 text-3xl" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <FaLayerGroup size={26} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <p className="text-sm font-bold text-gray-400">قالبی یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTemplates.map((template) => {
              const stagesList = template.template_data?.workflow_stages || [];
              const stagesCount = stagesList.length;
              const urgency = template.template_data?.urgency || 'MEDIUM';

              return (
                <div
                  key={template.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isDark 
                      ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-sm sm:text-base leading-tight ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {template.template_name}
                      </h3>
                      <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        template.is_global 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}>
                        {template.is_global ? <FaGlobe size={9} /> : <FaUserLock size={9} />}
                        <span>{template.is_global ? 'عمومی' : 'اختصاصی'}</span>
                      </span>
                    </div>

                    {template.template_data?.title && (
                      <p className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="text-gray-500 text-[10px]">عنوان پیش‌فرض:</span>
                        <strong className="truncate">{template.template_data.title}</strong>
                      </p>
                    )}

                    {template.template_data?.note && (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {template.template_data.note}
                      </p>
                    )}

                    {/* پیش‌نمایش مراحل گردش کار این قالب */}
                    {stagesCount > 0 && (
                      <div className={`p-2 rounded-xl border text-[11px] space-y-1 ${isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="font-bold text-purple-400 flex items-center gap-1 text-[10px] mb-1">
                          <FaSitemap size={10} />
                          <span>مسیر گردش کار ({stagesCount} مرحله):</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-[10px]">
                          {stagesList.map((stg, i) => (
                            <React.Fragment key={i}>
                              <span className={`px-2 py-0.5 rounded-md border font-medium truncate max-w-[120px] ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-white border-gray-200 text-gray-800'}`} title={stg.description || ''}>
                                {stg.stage_name || `مرحله ${i + 1}`}
                              </span>
                              {i < stagesCount - 1 && <FaArrowLeft size={8} className="text-purple-400 shrink-0" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${URGENCY_COLORS[urgency] || ''}`}>
                        فوریت: {URGENCY_LABELS[urgency] || urgency}
                      </span>
                    </div>
                  </div>

                  {/* دکمه‌های عملیات */}
                  <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                    <button
                      onClick={() => handleOpenEdit(template)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-300' 
                          : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                      }`}
                    >
                      <FaEdit size={11} />
                      <span>ویرایش مشخصات و گردش کار</span>
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.template_name)}
                      disabled={deletingId === template.id}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                        isDark 
                          ? 'bg-red-950/20 hover:bg-red-900/40 border-red-900/40 text-red-400' 
                          : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                      }`}
                    >
                      {deletingId === template.id ? <FaSpinner className="animate-spin" size={11} /> : <FaTrash size={11} />}
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* مودال جامع ویرایش قالب و گردش کار مراحل */}
      {editingTemplate && (
        <div 
          onClick={() => setEditingTemplate(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {/* هدر مودال */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-gray-200 dark:border-slate-800 shrink-0">
              <h3 className="font-bold text-xs sm:text-base flex items-center gap-2">
                <FaEdit className="text-purple-500" />
                <span>ویرایش قالب و گردش کار: <strong>{editingTemplate.template_name}</strong></span>
              </h3>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center border text-gray-400 hover:text-red-400 transition-colors"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {/* سوییچر تب‌های مودال */}
            <div className={`flex border-b shrink-0 px-4 pt-2 gap-2 ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-gray-200 bg-gray-50'}`}>
              <button
                type="button"
                onClick={() => setActiveEditTab('GENERAL')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold text-xs transition-colors ${
                  activeEditTab === 'GENERAL'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FaCog size={12} />
                <span>مشخصات پایه</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('WORKFLOW')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold text-xs transition-colors ${
                  activeEditTab === 'WORKFLOW'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FaSitemap size={12} />
                <span>مراحل گردش کار و شرح وظایف ({editStages.length})</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-500/30">
                
                {/* ── تب اول: مشخصات پایه ── */}
                {activeEditTab === 'GENERAL' && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div>
                      <label className="block font-bold mb-1">نام قالب <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={formData.template_name}
                        onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border outline-none text-xs sm:text-sm ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">عنوان پیش‌فرض ماموریت</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border outline-none text-xs sm:text-sm ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">فوریت پیش‌فرض</label>
                        <select
                          value={formData.urgency}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className={`w-full p-2.5 rounded-xl border outline-none text-xs ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="LOW">کم</option>
                          <option value="MEDIUM">متوسط</option>
                          <option value="HIGH">زیاد</option>
                          <option value="CRITICAL">بحرانی</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                          <input
                            type="checkbox"
                            checked={formData.is_global}
                            onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                            className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                          />
                          <span>قالب عمومی (برای همه پرسنل)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">توضیحات و دستورالعمل کلی ماموریت</label>
                      <textarea
                        rows={3}
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border outline-none resize-none text-xs leading-relaxed ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* ── تب دوم: مراحل و توضیحات گردش کار ── */}
                {activeEditTab === 'WORKFLOW' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-gray-400 font-bold text-[11px]">
                        تنظیم شرح و نحوه گردش مراحل ({editStages.length} مرحله)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddStage}
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 rounded-xl font-bold text-[11px] shadow-sm transition-all"
                      >
                        <FaPlus size={10} />
                        <span>افزودن مرحله جدید</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editStages.map((stage, idx) => (
                        <div 
                          key={stage.id || idx}
                          className={`p-3 sm:p-3.5 rounded-2xl border space-y-3 transition-all ${
                            isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* هدر کارت مرحله */}
                          <div className="flex items-center justify-between border-b pb-2 border-gray-200/50 dark:border-slate-700/50">
                            <span className="font-bold text-xs text-purple-400 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span>مرحله {idx + 1}</span>
                            </span>

                            {editStages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStage(idx)}
                                className="text-red-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                                title="حذف این مرحله"
                              >
                                <FaTrash size={12} />
                              </button>
                            )}
                          </div>

                          {/* فیلدهای تنظیم مرحله */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block font-bold mb-1 text-[11px]">نام مرحله <span className="text-red-400">*</span></label>
                              <input
                                type="text"
                                value={stage.stage_name}
                                onChange={(e) => handleStageFieldChange(idx, 'stage_name', e.target.value)}
                                placeholder="مثلاً: نقشه‌برداری اولیه"
                                className={`w-full p-2 rounded-xl border outline-none text-xs ${
                                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold mb-1 text-[11px]">قانون اقدام مجریان مرحله</label>
                              <select
                                value={stage.approval_rule}
                                onChange={(e) => handleStageFieldChange(idx, 'approval_rule', e.target.value)}
                                className={`w-full p-2 rounded-xl border outline-none text-xs ${
                                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              >
                                <option value="ANY_ASSIGNEE">اقدام یکی از مجریان کافیست</option>
                                <option value="ALL_ASSIGNEES">تکمیل توسط همه مجریان الزامی است</option>
                              </select>
                            </div>
                          </div>

                          {/* 🌟 فیلد توضیحات و دستورالعمل مرحله */}
                          <div>
                            <label className="block font-bold mb-1 text-[11px] text-purple-300 flex items-center gap-1">
                              <FaFileAlt size={10} />
                              <span>شرح و دستورالعمل اجرایی مرحله (توضیحات اختصاصی):</span>
                            </label>
                            <textarea
                              rows={2}
                              value={stage.description}
                              onChange={(e) => handleStageFieldChange(idx, 'description', e.target.value)}
                              placeholder="دستورالعمل، نکات مهم یا فرم‌هایی که مجری این مرحله باید رعایت کند..."
                              className={`w-full p-2.5 rounded-xl border outline-none resize-none text-xs leading-relaxed ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                            />
                          </div>

                          {/* تنظیمات بین مراحل و الزام آپلود */}
                          <div className={`p-2 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] ${
                            isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-gray-200'
                          }`}>
                            <div>
                              <label className="block font-bold mb-1 text-orange-400">تأییدیه بعد از این مرحله (بین مراحل):</label>
                              <select
                                value={stage.approver_rule}
                                onChange={(e) => handleStageFieldChange(idx, 'approver_rule', e.target.value)}
                                className={`w-full p-1.5 rounded-lg border outline-none text-[11px] ${
                                  isDark ? 'bg-slate-800 border-slate-700 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800'
                                }`}
                              >
                                <option value="ALL_APPROVERS">تایید همه ناظران الزامی است</option>
                                <option value="ANY_APPROVER">تایید یک نفر ناظر کافیست</option>
                              </select>
                            </div>

                            <div className="flex items-center pt-3 sm:pt-4">
                              <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={stage.require_file}
                                  onChange={(e) => handleStageFieldChange(idx, 'require_file', e.target.checked)}
                                  className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                                />
                                <span>الزام آپلود فایل ضمیمه در این مرحله</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* فوتر مودال */}
              <div className={`p-3.5 border-t flex items-center justify-between shrink-0 ${
                isDark ? 'border-slate-800 bg-slate-950/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className={`px-4 py-2 rounded-xl border font-bold text-xs ${
                    isDark ? 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  انصراف
                </button>

                <div className="flex items-center gap-2">
                  {activeEditTab === 'GENERAL' ? (
                    <button
                      type="button"
                      onClick={() => setActiveEditTab('WORKFLOW')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>مرحله بعد: تنظیم گردش کار</span>
                      <FaArrowLeft size={10} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveEditTab('GENERAL')}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-gray-300 font-bold text-xs transition-all"
                    >
                      <span>مشخصات پایه</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30 disabled:opacity-50 transition-all"
                  >
                    {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
                    <span>ذخیره نهایی قالب</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTemplatesPage;