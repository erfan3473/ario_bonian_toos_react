// src/screens/admin/BoqManagementScreen.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import { fetchBoqCatalog } from '../../features/reports/reportSlice';
import JalaliDatePicker from '../../components/JalaliDatePicker';
import {
  ArrowRightIcon,
  BanknotesIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TableCellsIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { fetchProjects } from '../../features/projects/projectSlice';
import ProjectCoefficientsTab from '../../components/reports/ProjectCoefficientsTab';
import { CalculatorIcon } from '@heroicons/react/24/outline'; // به لیست آیکون‌های heroicons اضافه شود
const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const toEnglishDigits = (value) =>
  String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const formatRial = (val) => {
  const num = Number(val || 0);
  const formatted = toPersianDigits(Math.abs(num).toLocaleString('en-US'));
  return num < 0 ? `${formatted}-` : formatted;
};

const DISCIPLINE_OPTIONS = [
  { value: 'ABNIYE', label: 'ابنیه' },
  { value: 'ROAD', label: 'راه و ترابری' },
  { value: 'ELECTRICAL', label: 'تاسیسات برقی' },
  { value: 'MECHANICAL', label: 'تاسیسات مکانیکی' },
  { value: 'WATER', label: 'آب و فاضلاب' },
];

const UNIT_OPTIONS = [
  { value: 'M', label: 'متر' },
  { value: 'M2', label: 'متر مربع' },
  { value: 'M3', label: 'متر مکعب' },
  { value: 'KG', label: 'کیلوگرم' },
  { value: 'TON', label: 'تن' },
  { value: 'PCS', label: 'عدد' },
  { value: 'BAG', label: 'کیسه' },
  { value: 'NUM', label: 'دستگاه' },
  { value: 'LUMP', label: 'مقطوع' },
  { value: 'TON_KM', label: 'تن - کیلومتر' },
  { value: 'TREE', label: 'اصله' },
  { value: 'PCT', label: 'درصد' },
  { value: 'DM3', label: 'دسی‌متر مکعب' },
  { value: 'MOLD', label: 'قالب' },
  { value: 'TON_NM', label: 'تن - مایل دریایی' },
  { value: 'M3_KM', label: 'مترمکعب - کیلومتر' },
  { value: 'LEAF', label: 'لنگه' },
  { value: 'STRAND', label: 'رشته' },
  { value: 'M2_MON', label: 'مترمربع - ماه' },
  { value: 'OTHER', label: 'سایر' },
  { value: 'WATT', label: 'وات' },
  { value: 'SET', label: 'مجموعه' },
  { value: 'PAIR', label: 'زوج' },
];

const PAGE_SIZE = 50;

const BoqManagementScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { priceLists, boqCategories } = useSelector((state) => state.reports);

  const [activeTab, setActiveTab] = useState('ITEMS'); // ITEMS | PRICE_LISTS | CATEGORIES
  const [saving, setSaving] = useState(false);

  // ─── استیت‌های دفترچه آیتم‌ها (سمت سرور) ───
  const [items, setItems] = useState([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { list: projectsList } = useSelector((state) => state.projects);
  
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterPriceList, setFilterPriceList] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // درخت فصل‌ها (سایدبار دفترچه)
  const [chapterSearch, setChapterSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});

  // فرم افزودن/ویرایش آیتم BOQ
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState({
    price_list: '',
    category: '',
    code: '',
    title: '',
    unit: 'M2',
    unit_price: '',
    description: '',
    is_active: true,
  });

  // فرم فهرست بهای پایه
  const [editingPlId, setEditingPlId] = useState(null);
  const [plForm, setPlForm] = useState({
    title: '',
    year: 1404,
    discipline: 'ABNIYE',
    region: '',
    effective_from: '',
    is_active: true,
  });

  // فرم دسته‌بندی
  const [editingCatId, setEditingCatId] = useState(null);
  const [catForm, setCatForm] = useState({ code: '', title: '', parent: '' });

  // بارگذاری فهرست‌های پایه و دسته‌بندی‌ها
  useEffect(() => {
    dispatch(fetchBoqCatalog());
    dispatch(fetchProjects());
  }, [dispatch]);

  // باز کردن پیش‌فرض دسته‌های ریشه در درخت دفترچه
  useEffect(() => {
    if (!boqCategories?.length) return;
    setExpandedNodes((prev) => {
      const next = { ...prev };
      boqCategories.forEach((c) => {
        if (!c.parent && next[c.id] === undefined) {
          next[c.id] = true;
        }
      });
      return next;
    });
  }, [boqCategories]);

  // Debounce سرچ آیتم‌ها (۳۰۰ میلی‌ثانیه)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(toEnglishDigits(searchInput.trim()));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // واکشی صفحه‌بندی‌شده آیتم‌ها از سرور
  const fetchServerItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterPriceList) params.price_list = filterPriceList;
      if (filterCategory) params.category = filterCategory;

      const { data } = await axiosInstance.get('/reports/boq-items/', { params });
      if (Array.isArray(data)) {
        setItems(data);
        setTotalItemsCount(data.length);
      } else {
        setItems(data?.results || []);
        setTotalItemsCount(data?.count || 0);
      }
    } catch (err) {
      toast.error('خطا در دریافت آیتم‌های فهرست بها');
    } finally {
      setItemsLoading(false);
    }
  }, [page, debouncedSearch, filterPriceList, filterCategory]);

  useEffect(() => {
    if (activeTab === 'ITEMS') {
      fetchServerItems();
    }
  }, [activeTab, fetchServerItems]);

  // ساخت درخت ریشه‌بندی و فصل‌بندی از boqCategories
  const categoryTree = useMemo(() => {
    const list = boqCategories || [];
    const byId = new Map();
    list.forEach((c) => byId.set(c.id, { ...c, children: [] }));

    const roots = [];
    byId.forEach((node) => {
      if (node.parent && byId.has(node.parent)) {
        byId.get(node.parent).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), 'en'));
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }, [boqCategories]);

  // فیلتر درخت فصل‌ها بر اساس جستجوی سایدبار
  const filteredTree = useMemo(() => {
    const q = toEnglishDigits(chapterSearch.trim()).toLowerCase();
    if (!q) return categoryTree;

    const filterNodes = (nodes) => {
      const result = [];
      for (const n of nodes) {
        const matchedChildren = filterNodes(n.children || []);
        const selfMatch =
          String(n.code || '').toLowerCase().includes(q) ||
          String(n.title || '').toLowerCase().includes(q);
        if (selfMatch || matchedChildren.length > 0) {
          result.push({ ...n, children: matchedChildren });
        }
      }
      return result;
    };
    return filterNodes(categoryTree);
  }, [categoryTree, chapterSearch]);

  const selectedCategoryObj = useMemo(
    () => (boqCategories || []).find((c) => String(c.id) === String(filterCategory)),
    [boqCategories, filterCategory]
  );

  const totalPages = Math.max(1, Math.ceil(totalItemsCount / PAGE_SIZE));

  const extractErr = (err) => {
    const d = err?.response?.data;
    if (!d) return 'خطا در ارتباط با سرور';
    if (typeof d === 'string') return d;
    if (d.detail || d.error) return d.detail || d.error;
    return Object.values(d).flat().join(' | ');
  };

  // ─── عملیات آیتم‌ها ───
  const resetItemForm = () => {
    setEditingItemId(null);
    setShowItemForm(false);
    setItemForm({
      price_list: filterPriceList || '',
      category: filterCategory || '',
      code: '',
      title: '',
      unit: 'M2',
      unit_price: '',
      description: '',
      is_active: true,
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...itemForm,
        price_list: Number(itemForm.price_list),
        category: Number(itemForm.category),
        unit_price: Number(itemForm.unit_price || 0),
      };
      if (editingItemId) {
        await axiosInstance.patch(`/reports/boq-items/${editingItemId}/`, payload);
        toast.success('آیتم فهرست بها ویرایش شد.');
      } else {
        await axiosInstance.post('/reports/boq-items/', payload);
        toast.success('آیتم جدید اضافه شد.');
      }
      resetItemForm();
      fetchServerItems();
    } catch (err) {
      toast.error(extractErr(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`حذف آیتم «${item.code} - ${item.title}»؟`)) return;
    try {
      await axiosInstance.delete(`/reports/boq-items/${item.id}/`);
      toast.success('آیتم حذف شد.');
      fetchServerItems();
    } catch (err) {
      toast.error(extractErr(err));
    }
  };

  // ─── عملیات فهرست بهای پایه ───
  const resetPlForm = () => {
    setEditingPlId(null);
    setPlForm({ title: '', year: 1404, discipline: 'ABNIYE', region: '', effective_from: '', is_active: true });
  };

  const handleSavePriceList = async (e) => {
    e.preventDefault();
    if (!plForm.effective_from) return toast.error('تاریخ شروع اعتبار الزامی است.');
    setSaving(true);
    try {
      const payload = { ...plForm, year: Number(plForm.year) };
      if (editingPlId) {
        await axiosInstance.patch(`/reports/price-lists/${editingPlId}/`, payload);
        toast.success('فهرست بها ویرایش شد.');
      } else {
        await axiosInstance.post('/reports/price-lists/', payload);
        toast.success('فهرست بهای جدید ثبت شد.');
      }
      resetPlForm();
      dispatch(fetchBoqCatalog());
    } catch (err) {
      toast.error(extractErr(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriceList = async (pl) => {
    if (!window.confirm(`حذف فهرست بهای «${pl.title}»؟`)) return;
    try {
      await axiosInstance.delete(`/reports/price-lists/${pl.id}/`);
      toast.success('فهرست بها حذف شد.');
      dispatch(fetchBoqCatalog());
    } catch (err) {
      toast.error(extractErr(err));
    }
  };

  // ─── عملیات دسته‌بندی‌ها ───
  const resetCatForm = () => {
    setEditingCatId(null);
    setCatForm({ code: '', title: '', parent: '' });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: catForm.code.trim(),
        title: catForm.title.trim(),
        parent: catForm.parent ? Number(catForm.parent) : null,
      };
      if (editingCatId) {
        await axiosInstance.patch(`/reports/boq-categories/${editingCatId}/`, payload);
        toast.success('دسته‌بندی ویرایش شد.');
      } else {
        await axiosInstance.post('/reports/boq-categories/', payload);
        toast.success('دسته‌بندی جدید ثبت شد.');
      }
      resetCatForm();
      dispatch(fetchBoqCatalog());
    } catch (err) {
      toast.error(extractErr(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`حذف دسته‌بندی «${cat.code} - ${cat.title}»؟`)) return;
    try {
      await axiosInstance.delete(`/reports/boq-categories/${cat.id}/`);
      toast.success('دسته‌بندی حذف شد.');
      dispatch(fetchBoqCatalog());
    } catch (err) {
      toast.error(extractErr(err));
    }
  };

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTreeNodes = (nodes, depth = 0) =>
    nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = chapterSearch.trim() ? true : Boolean(expandedNodes[node.id]);
      const isSelected = String(filterCategory) === String(node.id);

      return (
        <div key={node.id}>
          <div
            style={{ paddingRight: `${depth * 14 + 8}px` }}
            className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-[2px] cursor-pointer text-xs transition-colors ${
              isSelected
                ? isDark
                  ? 'bg-sky-400/20 text-sky-300 font-bold border-s-2 border-s-sky-400'
                  : 'bg-sky-100 text-sky-900 font-bold border-s-2 border-s-sky-600'
                : isDark
                ? 'text-slate-300 hover:bg-tactical-hover'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => {
              if (hasChildren) {
                toggleNode(node.id);
              }
              setFilterCategory(String(node.id));
              setPage(1);
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="p-0.5 shrink-0 opacity-70 hover:opacity-100"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {hasChildren ? (
              isExpanded ? (
                <FolderOpenIcon className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              ) : (
                <FolderIcon className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              )
            ) : (
              <BookOpenIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'opacity-60'}`} />
            )}

            <span className="truncate flex-1" title={`${node.code} - ${node.title}`}>
              {node.title}
            </span>
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-0.5">{renderTreeNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-white';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputClass = `w-full h-9 px-3 text-xs rounded-[2px] border focus:outline-none ${
    isDark
      ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
      : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
  }`;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark
          ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
          : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
      }`}
      dir="rtl"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
        {/* هدر */}
        <div className={`rounded-[2px] border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${surfacePanel} ${borderHairline}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[2px] border flex items-center justify-center ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-600/35 text-emerald-700'
              }`}
            >
              <BookOpenIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base sm:text-xl font-bold ${textPrimary}`}>
                دفترچه و بانک فهرست بها (BOQ)
              </h1>
              <p className={`text-xs mt-0.5 ${textSecondary}`}>
                مرور فصل‌بندی‌شده، جستجوی سریع ردیف‌ها و مدیریت فهرست‌های بهای پایه
              </p>
            </div>
          </div>

          <Link
            to="/admin/daily-summary"
            className={`h-9 px-3.5 rounded-[2px] border inline-flex items-center gap-1.5 text-xs font-semibold ${
              isDark
                ? 'bg-tactical-surface2 border-slate-400/20 text-slate-200 hover:bg-tactical-hover'
                : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowRightIcon className="w-4 h-4" />
            <span>بازگشت به گزارش‌های روزانه</span>
          </Link>
        </div>

        {/* تب‌ها */}
        <div className={`rounded-[2px] border p-2 flex flex-wrap items-center justify-between gap-2 ${surfacePanel} ${borderHairline}`}>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ITEMS', label: `دفترچه آیتم‌ها (${toPersianDigits(totalItemsCount)})`, icon: BookOpenIcon },
              { id: 'PRICE_LISTS', label: `فهرست‌های پایه (${toPersianDigits(priceLists.length)})`, icon: BanknotesIcon },
              { id: 'CATEGORIES', label: `دسته‌بندی‌ها (${toPersianDigits(boqCategories.length)})`, icon: FolderIcon },
              { id: 'COEFFICIENTS', label: 'ضرایب پروژه و ماشین‌حساب', icon: CalculatorIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-8 px-3.5 rounded-[2px] border inline-flex items-center gap-1.5 text-xs font-bold tabular-nums transition-colors ${
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-sky-400 border-sky-400 text-slate-950'
                        : 'bg-sky-600 border-sky-700 text-white'
                      : isDark
                      ? 'bg-tactical-canvas border-slate-400/15 text-slate-300 hover:bg-tactical-hover'
                      : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'ITEMS' && (
            <button
              type="button"
              onClick={() => {
                if (showItemForm) {
                  resetItemForm();
                } else {
                  setItemForm((prev) => ({
                    ...prev,
                    price_list: filterPriceList || prev.price_list,
                    category: filterCategory || prev.category,
                  }));
                  setShowItemForm(true);
                }
              }}
              className={`h-8 px-3.5 rounded-[2px] text-xs font-bold inline-flex items-center gap-1.5 ${
                showItemForm
                  ? 'bg-red-500/15 border border-red-500/40 text-red-400'
                  : isDark
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {showItemForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
              <span>{showItemForm ? 'بستن فرم' : 'افزودن آیتم جدید'}</span>
            </button>
          )}
        </div>

        {/* ═══ تب ۱: دفترچه آیتم‌های فهرست بها ═══ */}
        {activeTab === 'ITEMS' && (
          <div className="space-y-4">
            {/* فرم بازشونده افزودن/ویرایش آیتم */}
            {showItemForm && (
              <form onSubmit={handleSaveItem} className={`rounded-[2px] border p-4 space-y-3 ${surfacePanel} ${borderHairline}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xs sm:text-sm font-bold ${textPrimary}`}>
                    {editingItemId ? 'ویرایش آیتم فهرست بها' : 'افزودن آیتم جدید به فهرست بها'}
                  </h2>
                  <button type="button" onClick={resetItemForm} className="text-xs text-red-400 inline-flex items-center gap-1">
                    <XMarkIcon className="w-4 h-4" /> انصراف
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                  <select required value={itemForm.price_list} onChange={(e) => setItemForm({ ...itemForm, price_list: e.target.value })} className={inputClass}>
                    <option value="">فهرست بهای پایه *</option>
                    {priceLists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.title} ({toPersianDigits(pl.year)})
                      </option>
                    ))}
                  </select>

                  <select required value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className={inputClass}>
                    <option value="">فصل / دسته‌بندی *</option>
                    {boqCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                  </select>

                  <input required placeholder="کد آیتم (مثلاً 010101) *" value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} className={inputClass} />
                  <input required placeholder="شرح آیتم *" value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} className={`${inputClass} lg:col-span-2`} />

                  <select value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className={inputClass}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        واحد: {u.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="بهای واحد (ریال - منفی برای کسربها)"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                    className={`${inputClass} tabular-nums`}
                  />
                  <input placeholder="توضیحات (اختیاری)" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className={`${inputClass} sm:col-span-2 lg:col-span-4`} />

                  <button
                    type="submit"
                    disabled={saving}
                    className={`h-9 px-4 rounded-[2px] text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                      isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>{editingItemId ? 'ذخیره ویرایش' : 'ثبت آیتم'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* چیدمان دو ستونه دفترچه: سمت راست فصل‌بندی، سمت چپ ردیف‌ها */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* ستون راست: درخت فصل‌بندی و ریشه‌بندی */}
              <aside className={`lg:col-span-4 xl:col-span-3 rounded-[2px] border overflow-hidden lg:sticky lg:top-4 ${surfacePanel} ${borderHairline}`}>
                <div className={`p-3 border-b space-y-2 ${borderHairline} ${surfaceHeader}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${textPrimary}`}>
                      <FolderIcon className="w-4 h-4 text-amber-400" />
                      فهرست فصل‌ها و ریشه‌ها
                    </span>
                    {filterCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCategory('');
                          setPage(1);
                        }}
                        className="text-[11px] text-sky-400 hover:underline"
                      >
                        نمایش همه
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      placeholder="جستجوی فصل (مثلاً بتن، تخریب)..."
                      className={`${inputClass} h-8 pe-7 text-[11px]`}
                    />
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="p-2 max-h-[65vh] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => {
                      setFilterCategory('');
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-[2px] cursor-pointer text-xs transition-colors ${
                      !filterCategory
                        ? isDark
                          ? 'bg-sky-400/20 text-sky-300 font-bold border-s-2 border-s-sky-400'
                          : 'bg-sky-100 text-sky-900 font-bold border-s-2 border-s-sky-600'
                        : isDark
                        ? 'text-slate-300 hover:bg-tactical-hover'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <TableCellsIcon className="w-4 h-4 shrink-0" />
                    <span>همه فصل‌ها (کل دفترچه)</span>
                  </div>

                  {filteredTree.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-500">فصلی یافت نشد.</div>
                  ) : (
                    renderTreeNodes(filteredTree, 0)
                  )}
                </div>
              </aside>

              {/* ستون چپ: سرچ و جدول ردیف‌های دفترچه */}
              <div className={`lg:col-span-8 xl:col-span-9 rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}>
                {/* نوار جستجو و فیلتر فهرست پایه */}
                <div className={`p-3 border-b space-y-2.5 ${borderHairline} ${surfaceHeader}`}>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[220px]">
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="جستجوی سریع کد ۶ رقمی (مثلاً 080105) یا شرح ردیف..."
                        className={`${inputClass} pe-8`}
                      />
                      <MagnifyingGlassIcon className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <select
                      value={filterPriceList}
                      onChange={(e) => {
                        setFilterPriceList(e.target.value);
                        setPage(1);
                      }}
                      className={`${inputClass} w-auto min-w-[170px]`}
                    >
                      <option value="">همه فهرست‌های پایه</option>
                      {priceLists.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.title} ({toPersianDigits(pl.year)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* نمایش مسیر فصل انتخاب‌شده (Breadcrumb) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${textSecondary}`}>
                      <span className="font-bold">فصل جاری:</span>
                      <span className={isDark ? 'text-sky-300 font-bold' : 'text-sky-700 font-bold'}>
                        {selectedCategoryObj ? `${selectedCategoryObj.code} — ${selectedCategoryObj.title}` : 'کل دفترچه'}
                      </span>
                    </div>
                    <span className={`tabular-nums ${textSecondary}`}>
                      نتیجه: <strong>{toPersianDigits(totalItemsCount)}</strong> ردیف
                    </span>
                  </div>
                </div>

                {/* جدول ردیف‌ها */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                      <tr>
                        <th className="px-3 py-2.5 w-24">شماره</th>
                        <th className="px-3 py-2.5">شرح ردیف</th>
                        <th className="px-3 py-2.5 text-center w-24">واحد</th>
                        <th className="px-3 py-2.5 text-center w-32">بهای واحد (ریال)</th>
                        <th className="px-3 py-2.5 text-center w-20">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-400/10' : 'divide-slate-200'}`}>
                      {itemsLoading ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400">
                            در حال بارگذاری ردیف‌های فهرست بها...
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400">
                            ردیفی مطابق فیلتر یا جستجو یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        items.map((it) => {
                          const priceNum = Number(it.unit_price || 0);
                          return (
                            <tr key={it.id} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                              <td className="px-3 py-2.5 font-mono font-bold text-sky-400 whitespace-nowrap align-top">
                                {it.code}
                              </td>
                              <td className={`px-3 py-2.5 leading-6 ${textPrimary}`}>
                                <div className="font-medium">{it.title}</div>
                                <div className={`text-[10px] mt-0.5 ${textSecondary}`}>
                                  {it.category_title}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap align-top">
                                <span
                                  className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold ${
                                    isDark
                                      ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                                      : 'bg-slate-100 border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {it.unit_display}
                                </span>
                              </td>
                              <td
                                className={`px-3 py-2.5 text-center font-bold tabular-nums whitespace-nowrap align-top ${
                                  priceNum < 0
                                    ? isDark
                                      ? 'text-amber-400'
                                      : 'text-amber-700'
                                    : priceNum === 0
                                    ? textSecondary
                                    : isDark
                                    ? 'text-emerald-400'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {priceNum === 0 ? 'ستاره‌دار / صفر' : formatRial(priceNum)}
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap align-top">
                                <div className="inline-flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItemId(it.id);
                                      setItemForm({
                                        price_list: String(it.price_list),
                                        category: String(it.category),
                                        code: it.code,
                                        title: it.title,
                                        unit: it.unit,
                                        unit_price: String(it.unit_price),
                                        description: it.description || '',
                                        is_active: it.is_active,
                                      });
                                      setShowItemForm(true);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-1 rounded-[2px] border border-slate-400/20 text-sky-400 hover:bg-sky-400/15"
                                    title="ویرایش"
                                  >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(it)}
                                    className="p-1 rounded-[2px] border border-slate-400/20 text-red-400 hover:bg-red-500/15"
                                    title="حذف"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* نوار صفحه‌بندی */}
                {totalPages > 1 && (
                  <div className={`px-3.5 py-2.5 border-t flex items-center justify-between gap-2 text-xs ${borderHairline} ${surfaceHeader}`}>
                    <span className={`tabular-nums ${textSecondary}`}>
                      صفحه <strong>{toPersianDigits(page)}</strong> از <strong>{toPersianDigits(totalPages)}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={page <= 1 || itemsLoading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={`h-8 px-3 rounded-[2px] border inline-flex items-center gap-1 disabled:opacity-40 ${
                          isDark
                            ? 'bg-tactical-canvas border-slate-400/20 text-slate-200 hover:bg-tactical-hover'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                        <span>قبلی</span>
                      </button>
                      <button
                        type="button"
                        disabled={page >= totalPages || itemsLoading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={`h-8 px-3 rounded-[2px] border inline-flex items-center gap-1 disabled:opacity-40 ${
                          isDark
                            ? 'bg-tactical-canvas border-slate-400/20 text-slate-200 hover:bg-tactical-hover'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>بعدی</span>
                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ تب ۲: فهرست‌های بهای پایه ═══ */}
        {activeTab === 'PRICE_LISTS' && (
          <div className="space-y-4">
            <form onSubmit={handleSavePriceList} className={`rounded-[2px] border p-4 space-y-3 ${surfacePanel} ${borderHairline}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xs sm:text-sm font-bold ${textPrimary}`}>
                  {editingPlId ? 'ویرایش فهرست بهای پایه' : 'تعریف فهرست بهای پایه جدید'}
                </h2>
                {editingPlId && (
                  <button type="button" onClick={resetPlForm} className="text-xs text-red-400">
                    انصراف
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end">
                <input required placeholder="عنوان (مثلاً فهرست بهای ابنیه ۱۴۰۴)" value={plForm.title} onChange={(e) => setPlForm({ ...plForm, title: e.target.value })} className={`${inputClass} lg:col-span-2`} />
                <input required type="number" placeholder="سال" value={plForm.year} onChange={(e) => setPlForm({ ...plForm, year: e.target.value })} className={`${inputClass} tabular-nums`} />
                <select value={plForm.discipline} onChange={(e) => setPlForm({ ...plForm, discipline: e.target.value })} className={inputClass}>
                  {DISCIPLINE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <JalaliDatePicker
                  name="effective_from"
                  label="شروع اعتبار *"
                  value={plForm.effective_from}
                  onChange={(e) => setPlForm({ ...plForm, effective_from: e.target.value || '' })}
                  modal
                />
                <button
                  type="submit"
                  disabled={saving}
                  className={`h-9 px-4 rounded-[2px] text-xs font-bold ${isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
                >
                  {editingPlId ? 'ذخیره ویرایش' : 'ثبت فهرست'}
                </button>
              </div>
            </form>

            <div className={`rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}>
              <table className="w-full text-right text-xs border-collapse">
                <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                  <tr>
                    <th className="px-3.5 py-2.5">عنوان</th>
                    <th className="px-3.5 py-2.5 text-center">سال</th>
                    <th className="px-3.5 py-2.5">رشته</th>
                    <th className="px-3.5 py-2.5 text-center">شروع اعتبار</th>
                    <th className="px-3.5 py-2.5 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-400/10' : 'divide-slate-200'}`}>
                  {priceLists.map((pl) => (
                    <tr key={pl.id} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                      <td className={`px-3.5 py-2.5 font-bold ${textPrimary}`}>{pl.title}</td>
                      <td className="px-3.5 py-2.5 text-center tabular-nums">{toPersianDigits(pl.year)}</td>
                      <td className="px-3.5 py-2.5">{pl.discipline_display}</td>
                      <td className="px-3.5 py-2.5 text-center font-mono">{pl.effective_from}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlId(pl.id);
                              setPlForm({
                                title: pl.title,
                                year: pl.year,
                                discipline: pl.discipline,
                                region: pl.region || '',
                                effective_from: pl.effective_from || '',
                                is_active: pl.is_active,
                              });
                            }}
                            className="p-1 rounded-[2px] border border-slate-400/20 text-sky-400"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePriceList(pl)}
                            className="p-1 rounded-[2px] border border-slate-400/20 text-red-400"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ تب ۳: دسته‌بندی‌های فهرست بها ═══ */}
        {activeTab === 'CATEGORIES' && (
          <div className="space-y-4">
            <form onSubmit={handleSaveCategory} className={`rounded-[2px] border p-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end ${surfacePanel} ${borderHairline}`}>
              <input required placeholder="کد دسته (مثلاً ABNIYE-01)" value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} className={inputClass} />
              <input required placeholder="عنوان دسته‌بندی" value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} className={inputClass} />
              <select value={catForm.parent} onChange={(e) => setCatForm({ ...catForm, parent: e.target.value })} className={inputClass}>
                <option value="">بدون دسته والد</option>
                {boqCategories
                  .filter((c) => c.id !== editingCatId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
              </select>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 h-9 px-4 rounded-[2px] text-xs font-bold ${isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
                >
                  {editingCatId ? 'ذخیره ویرایش' : 'افزودن دسته'}
                </button>
                {editingCatId && (
                  <button type="button" onClick={resetCatForm} className="h-9 px-2.5 rounded-[2px] border border-red-500/40 text-red-400 text-xs">
                    لغو
                  </button>
                )}
              </div>
            </form>

            <div className={`rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}>
              <table className="w-full text-right text-xs border-collapse">
                <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                  <tr>
                    <th className="px-3.5 py-2.5">کد</th>
                    <th className="px-3.5 py-2.5">عنوان دسته‌بندی</th>
                    <th className="px-3.5 py-2.5">کد والد</th>
                    <th className="px-3.5 py-2.5 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-400/10' : 'divide-slate-200'}`}>
                  {boqCategories.map((cat) => (
                    <tr key={cat.id} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-sky-400">{cat.code}</td>
                      <td className={`px-3.5 py-2.5 font-bold ${textPrimary}`}>{cat.title}</td>
                      <td className={`px-3.5 py-2.5 font-mono ${textSecondary}`}>{cat.parent_code || '---'}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setCatForm({ code: cat.code, title: cat.title, parent: cat.parent ? String(cat.parent) : '' });
                            }}
                            className="p-1 rounded-[2px] border border-slate-400/20 text-sky-400"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1 rounded-[2px] border border-slate-400/20 text-red-400"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ═══ تب ۴: ضرایب پروژه و ماشین‌حساب صورت‌وضعیت ═══ */}
        {activeTab === 'COEFFICIENTS' && (
          <ProjectCoefficientsTab projects={projectsList || []} isDark={isDark} />
        )}
      </div>
    </div>
  );
};

export default BoqManagementScreen;