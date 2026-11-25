import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchFinancialRequests,
  fetchEquipmentRequests,
  fetchLeaveRequests,
  fetchLeaveTypes,
  fetchRequestsStats,
  updateFinancialStatus,
  updateEquipmentStatus,
  updateLeaveStatus,
  refreshRequestSmsStatus,
  resetUpdateStatus,
} from '../../features/admin/adminRequestSlice';
import {
  FaMoneyBillWave,
  FaTools,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaClock,
  FaChartLine,
  FaClipboardList,
  FaSearch,
  FaUserTie,
  FaSignature,
  FaCreditCard,
  FaCopy,
  FaWarehouse,
  FaSms,
  FaSyncAlt,
  FaProjectDiagram,
  FaExclamationTriangle,
  FaCheckDouble,
  FaFileSignature,
  FaBoxOpen,
  FaShoppingCart,
  FaExchangeAlt,
  FaPhoneAlt,
} from 'react-icons/fa';
import { formatJalaliDate } from '../../utils/dateUtils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';


const TAB_FILTERS = {
  financial: [
    { key: 'IN_PROGRESS', label: 'در جریان', statKey: 'in_progress' },
    { key: 'ALL', label: 'همه موارد', statKey: 'total' },
    { key: 'PENDING', label: 'در انتظار سرپرست', statKey: 'pending' },
    { key: 'SUPERVISOR_APPROVED', label: 'در انتظار هیئت مدیره', statKey: 'supervisor_approved' },
    { key: 'APPROVED_PENDING_SIGN', label: 'در انتظار امضا', statKey: 'approved_pending_sign' },
    { key: 'SIGNED', label: 'آماده پرداخت', statKey: 'signed' },
    { key: 'PAID', label: 'پرداخت شده', statKey: 'paid' },
    { key: 'REJECTED', label: 'رد شده', statKey: 'rejected' },
  ],
  equipment: [
    { key: 'IN_PROGRESS', label: 'در جریان', statKey: 'in_progress' },
    { key: 'ALL', label: 'همه موارد', statKey: 'total' },
    { key: 'PENDING', label: 'در انتظار بررسی', statKey: 'pending' },
    { key: 'AVAILABLE_IN_STORE', label: 'موجود در انبار', statKey: 'available_in_store' },
    { key: 'TRANSFER_REQUIRED', label: 'نیازمند حواله', statKey: 'transfer_required' },
    { key: 'PENDING_PURCHASE', label: 'در انتظار تایید خرید', statKey: 'pending_purchase' },
    { key: 'APPROVED_FOR_PURCHASE', label: 'تایید خرید', statKey: 'approved_for_purchase' },
    { key: 'DELIVERED', label: 'تحویل شده', statKey: 'delivered' },
    { key: 'REJECTED', label: 'رد شده', statKey: 'rejected' },
  ],
  leave: [
    { key: 'IN_PROGRESS', label: 'در جریان', statKey: 'in_progress' },
    { key: 'ALL', label: 'همه موارد', statKey: 'total' },
    { key: 'PENDING', label: 'در انتظار سرپرست', statKey: 'pending' },
    { key: 'SUPERVISOR_APPROVED', label: 'در انتظار هیئت مدیره', statKey: 'supervisor_approved' },
    { key: 'APPROVED_PENDING_SIGN', label: 'در انتظار امضا', statKey: 'approved_pending_sign' },
    { key: 'APPROVED', label: 'ثبت قطعی', statKey: 'approved' },
    { key: 'REJECTED', label: 'رد شده', statKey: 'rejected' },
  ],
};

const TERMINAL_STATUSES = ['PAID', 'DELIVERED', 'APPROVED', 'REJECTED'];

const RequestManagementScreen = () => {
  const dispatch = useDispatch();

  const {
    financial,
    equipment,
    leave,
    leaveTypes,
    stats,
    updating,
    refreshingSms,
    updateSuccess,
    updateError,
  } = useSelector((state) => state.adminRequests);

  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = ['financial', 'equipment', 'leave'].includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'financial';
  const targetRequestId = searchParams.get('requestId') ? Number(searchParams.get('requestId')) : null;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [filterStatus, setFilterStatus] = useState(targetRequestId ? 'ALL' : 'IN_PROGRESS');
  const [highlightedId, setHighlightedId] = useState(null);
  const handledDeepLinkRef = useRef(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [selectedFinancialType, setSelectedFinancialType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(fetchRequestsStats());
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  const loadTabData = () => {
    const isInProgress = filterStatus === 'IN_PROGRESS';
    const statusParam = filterStatus === 'ALL' || isInProgress ? null : filterStatus;

    if (activeTab === 'financial') {
      dispatch(
        fetchFinancialRequests({
          status: statusParam,
          inProgress: isInProgress,
          requestType: selectedFinancialType || null,
          search: debouncedSearch,
        })
      );
    } else if (activeTab === 'equipment') {
      dispatch(
        fetchEquipmentRequests({
          status: statusParam,
          inProgress: isInProgress,
          search: debouncedSearch,
        })
      );
    } else if (activeTab === 'leave') {
      dispatch(
        fetchLeaveRequests({
          status: statusParam,
          inProgress: isInProgress,
          leaveType: selectedLeaveType || null,
          search: debouncedSearch,
        })
      );
    }
  };

  useEffect(() => {
    loadTabData();
  }, [dispatch, activeTab, filterStatus, selectedLeaveType, selectedFinancialType, debouncedSearch]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success('وضعیت درخواست با موفقیت بروزرسانی شد');
      setShowModal(false);
      setSelectedRequestId(null);
      setNoteInput('');
      dispatch(resetUpdateStatus());
      loadTabData();
      dispatch(fetchRequestsStats());
    }
  }, [updateSuccess]);

  const currentData = useMemo(() => {
    if (activeTab === 'financial') return financial;
    if (activeTab === 'equipment') return equipment;
    return leave;
  }, [activeTab, financial, equipment, leave]);
  useEffect(() => {
    if (!targetRequestId || handledDeepLinkRef.current || currentData.loading) return;

    const found = currentData.data.find((item) => Number(item.id) === targetRequestId);
    if (!found) return;

    handledDeepLinkRef.current = true;
    setHighlightedId(found.id);
    handleOpenModal(found);
    setTimeout(() => {
      const el = document.getElementById(`request-card-${found.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 4500);

    return () => clearTimeout(clearTimer);
  }, [targetRequestId, currentData.loading, currentData.data]);
  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null;
    return currentData.data.find((item) => item.id === selectedRequestId) || null;
  }, [currentData.data, selectedRequestId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterStatus('IN_PROGRESS');
    setSelectedLeaveType('');
    setSelectedFinancialType('');
  };

  const handleOpenModal = (request) => {
    setSelectedRequestId(request.id);
    if (activeTab === 'financial') {
      setNoteInput(request.admin_note || '');
    } else {
      setNoteInput(request.rejection_reason || '');
    }
    setShowModal(true);
  };

  const handleStatusTransition = (nextStatus) => {
    if (!selectedRequest) return;

    if (nextStatus === 'REJECTED' && !noteInput.trim()) {
      toast.error('لطفاً علت رد درخواست را وارد نمایید');
      return;
    }

    if (activeTab === 'financial') {
      dispatch(
        updateFinancialStatus({
          id: selectedRequest.id,
          status: nextStatus,
          admin_note: noteInput,
        })
      );
    } else if (activeTab === 'equipment') {
      dispatch(
        updateEquipmentStatus({
          id: selectedRequest.id,
          status: nextStatus,
          rejection_reason: noteInput,
        })
      );
    } else if (activeTab === 'leave') {
      dispatch(
        updateLeaveStatus({
          id: selectedRequest.id,
          status: nextStatus,
          rejection_reason: noteInput,
        })
      );
    }
  };

  const handleRefreshSms = () => {
    if (!selectedRequest) return;
    const typeMap = {
      financial: 'FINANCIAL',
      equipment: 'EQUIPMENT',
      leave: 'LEAVE',
    };
    dispatch(
      refreshRequestSmsStatus({
        request_type: typeMap[activeTab],
        request_id: selectedRequest.id,
      })
    );
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '۰';
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status, statusDisplay) => {
    const styleMap = {
      PENDING: isDark
        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
        : 'bg-amber-50 text-amber-800 border border-amber-300',
      SUPERVISOR_APPROVED: isDark
        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
        : 'bg-sky-50 text-sky-800 border border-sky-300',
      APPROVED_PENDING_SIGN: isDark
        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
        : 'bg-purple-50 text-purple-800 border border-purple-300',
      SIGNED: isDark
        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40'
        : 'bg-indigo-50 text-indigo-800 border border-indigo-300',
      AVAILABLE_IN_STORE: isDark
        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40'
        : 'bg-teal-50 text-teal-800 border border-teal-300',
      TRANSFER_REQUIRED: isDark
        ? 'bg-orange-500/15 text-orange-300 border border-orange-500/40'
        : 'bg-orange-50 text-orange-800 border border-orange-300',
      PENDING_PURCHASE: isDark
        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
        : 'bg-amber-50 text-amber-800 border border-amber-300',
      APPROVED_FOR_PURCHASE: isDark
        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
        : 'bg-cyan-50 text-cyan-800 border border-cyan-300',
      APPROVED: isDark
        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
        : 'bg-emerald-50 text-emerald-800 border border-emerald-300',
      PAID: isDark
        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
        : 'bg-emerald-50 text-emerald-800 border border-emerald-300',
      DELIVERED: isDark
        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
        : 'bg-emerald-50 text-emerald-800 border border-emerald-300',
      REJECTED: isDark
        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
        : 'bg-rose-50 text-rose-800 border border-rose-300',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold tracking-tight inline-flex items-center gap-1.5 ${
          styleMap[status] || (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800')
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {statusDisplay || status}
      </span>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div
        className={`max-w-7xl mx-auto p-4 md:p-8 rounded-3xl border transition-all duration-300 ${
          isDark
            ? 'border-slate-800 bg-slate-900/90 shadow-2xl'
            : 'border-slate-200 bg-white shadow-xl'
        }`}
      >
        <div
          className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h1 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <FaClipboardList />
              </span>
              کارتابل مدیریت درخواست‌ها
            </h1>
            <p className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              بررسی چندمرحله‌ای، ثبت امضای فیزیکی، واریز مالی، استعلام انبار و پیگیری پیامک‌ها
            </p>
          </div>

          <button
            onClick={() => {
              loadTabData();
              dispatch(fetchRequestsStats());
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <FaSyncAlt /> بروزرسانی کارتابل
          </button>
        </div>

        {stats.data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<FaChartLine />}
              title="کل درخواست‌ها"
              value={formatNumber(stats.data.total_count || 0)}
              color="blue"
              isDark={isDark}
            />
            <StatCard
              icon={<FaClock />}
              title="در جریان و نیازمند اقدام"
              value={formatNumber(stats.data.in_progress_count || 0)}
              color="amber"
              pulse={(stats.data.in_progress_count || 0) > 0}
              isDark={isDark}
            />
            <StatCard
              icon={<FaCheckDouble />}
              title="تکمیل و نهایی شده"
              value={formatNumber(stats.data.completed_count || 0)}
              color="emerald"
              isDark={isDark}
            />
            <StatCard
              icon={<FaTimes />}
              title="رد شده"
              value={formatNumber(stats.data.rejected_count || 0)}
              color="rose"
              isDark={isDark}
            />
          </div>
        )}

        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 p-2 rounded-2xl border ${
            isDark ? 'bg-slate-800/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <TabButton
            active={activeTab === 'financial'}
            onClick={() => handleTabChange('financial')}
            icon={<FaMoneyBillWave />}
            label="درخواست‌های مالی"
            total={stats.data?.total_count_financial || 0}
            inProgress={stats.data?.financial?.in_progress || 0}
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'equipment'}
            onClick={() => handleTabChange('equipment')}
            icon={<FaTools />}
            label="درخواست‌های تجهیزات"
            total={stats.data?.total_count_equipment || 0}
            inProgress={stats.data?.equipment?.in_progress || 0}
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'leave'}
            onClick={() => handleTabChange('leave')}
            icon={<FaCalendarAlt />}
            label="درخواست‌های مرخصی"
            total={stats.data?.total_count_leave || 0}
            inProgress={stats.data?.leave?.in_progress || 0}
            isDark={isDark}
          />
        </div>

        <div
          className={`rounded-2xl p-4 mb-6 border flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center ${
            isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="relative flex-1 min-w-0">
            <FaSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'financial'
                  ? 'جستجو بر اساس نام کارمند، کد ملی، شماره تماس یا شرح درخواست...'
                  : activeTab === 'equipment'
                  ? 'جستجو بر اساس نام کالا، نام کارمند یا پروژه...'
                  : 'جستجو بر اساس نام کارمند، کد ملی یا دلیل مرخصی...'
              }
              className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {activeTab === 'leave' && (
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="">همه انواع مرخصی</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.category_display})
                </option>
              ))}
            </select>
          )}

          {activeTab === 'financial' && (
            <select
              value={selectedFinancialType}
              onChange={(e) => setSelectedFinancialType(e.target.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="">همه انواع مالی</option>
              <option value="LOAN">وام</option>
              <option value="ASSISTANCE">مساعده</option>
              <option value="ADVANCE">علی‌الحساب</option>
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          {TAB_FILTERS[activeTab].map((f) => {
            const countVal = stats.data?.[activeTab]?.[f.statKey];
            return (
              <FilterButton
                key={f.key}
                active={filterStatus === f.key}
                onClick={() => setFilterStatus(f.key)}
                label={f.label}
                count={countVal}
                isDark={isDark}
              />
            );
          })}
        </div>

        {currentData.loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              در حال دریافت اطلاعات...
            </p>
          </div>
        ) : currentData.error ? (
          <div className="bg-rose-500/10 border border-rose-500 rounded-2xl p-5 text-rose-500 font-bold text-center">
            {currentData.error}
          </div>
        ) : currentData.data.length === 0 ? (
          <div
            className={`text-center py-16 border-2 border-dashed rounded-3xl ${
              isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <p className={`text-lg font-black ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              هیچ درخواستی با این فیلتر یافت نشد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentData.data.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                type={activeTab}
                isHighlighted={highlightedId === request.id}
                onAction={() => handleOpenModal(request)}
                formatNumber={formatNumber}
                formatDateTime={formatDateTime}
                getStatusBadge={getStatusBadge}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        {showModal && selectedRequest && (
          <ActionModal
            request={selectedRequest}
            type={activeTab}
            noteInput={noteInput}
            setNoteInput={setNoteInput}
            onTransition={handleStatusTransition}
            onRefreshSms={handleRefreshSms}
            onClose={() => setShowModal(false)}
            loading={updating}
            refreshingSms={refreshingSms}
            error={updateError}
            formatNumber={formatNumber}
            formatDateTime={formatDateTime}
            getStatusBadge={getStatusBadge}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, pulse, isDark }) => {
  const palette = {
    blue: isDark
      ? 'border-blue-500/40 bg-slate-800/80 text-blue-400'
      : 'border-blue-200 bg-blue-50/60 text-blue-600',
    amber: isDark
      ? 'border-amber-500/40 bg-slate-800/80 text-amber-400'
      : 'border-amber-200 bg-amber-50/60 text-amber-600',
    emerald: isDark
      ? 'border-emerald-500/40 bg-slate-800/80 text-emerald-400'
      : 'border-emerald-200 bg-emerald-50/60 text-emerald-600',
    rose: isDark
      ? 'border-rose-500/40 bg-slate-800/80 text-rose-400'
      : 'border-rose-200 bg-rose-50/60 text-rose-600',
  };

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${palette[color]}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {value}
            </p>
            {pulse && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>}
          </div>
        </div>
        <div className="text-2xl sm:text-3xl opacity-85 shrink-0">{icon}</div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, total, inProgress, isDark }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
        : isDark
        ? 'text-slate-300 hover:text-white hover:bg-slate-800'
        : 'text-slate-700 hover:text-blue-600 hover:bg-white'
    }`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="text-base shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {inProgress > 0 && (
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
            active ? 'bg-amber-400 text-slate-950' : 'bg-amber-500/20 text-amber-500'
          }`}
        >
          {inProgress} فعال
        </span>
      )}
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-black ${
          active
            ? 'bg-white/20 text-white'
            : isDark
            ? 'bg-slate-700 text-slate-300'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        {total}
      </span>
    </div>
  </button>
);

const FilterButton = ({ active, onClick, label, count, isDark }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-2 rounded-xl font-bold text-xs tracking-tight transition-all inline-flex items-center gap-2 ${
      active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
        : isDark
        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
    }`}
  >
    <span>{label}</span>
    {typeof count === 'number' && (
      <span
        className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${
          active
            ? 'bg-white/20 text-white'
            : isDark
            ? 'bg-slate-700 text-slate-300'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const WorkflowStepper = ({ type, status, isDark }) => {
  if (status === 'REJECTED') {
    return (
      <div
        className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 ${
          isDark ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        <FaTimes /> پرونده در این مرحله رد و مختومه شده است
      </div>
    );
  }

  const stepsMap = {
    leave: [
      { key: 'PENDING', label: 'سرپرست' },
      { key: 'SUPERVISOR_APPROVED', label: 'هیئت مدیره' },
      { key: 'APPROVED_PENDING_SIGN', label: 'امضای فیزیکی' },
      { key: 'APPROVED', label: 'ثبت قطعی' },
    ],
    financial: [
      { key: 'PENDING', label: 'سرپرست' },
      { key: 'SUPERVISOR_APPROVED', label: 'هیئت مدیره' },
      { key: 'APPROVED_PENDING_SIGN', label: 'امضای اسناد' },
      { key: 'SIGNED', label: 'آماده پرداخت' },
      { key: 'PAID', label: 'واریز شد' },
    ],
    equipment: [
      { key: 'PENDING', label: 'بررسی انبار' },
      { key: 'PENDING_PURCHASE', label: 'تایید خرید' },
      { key: 'DELIVERED', label: 'تحویل کالا' },
    ],
  };

  let currentIdx = 0;
  if (type === 'leave') {
    const order = ['PENDING', 'SUPERVISOR_APPROVED', 'APPROVED_PENDING_SIGN', 'APPROVED'];
    currentIdx = Math.max(0, order.indexOf(status));
  } else if (type === 'financial') {
    const order = ['PENDING', 'SUPERVISOR_APPROVED', 'APPROVED_PENDING_SIGN', 'SIGNED', 'PAID'];
    currentIdx = Math.max(0, order.indexOf(status));
  } else if (type === 'equipment') {
    if (status === 'PENDING') currentIdx = 0;
    else if (['TRANSFER_REQUIRED', 'PENDING_PURCHASE', 'APPROVED_FOR_PURCHASE'].includes(status)) currentIdx = 1;
    else currentIdx = 2;
  }

  const steps = stepsMap[type] || [];

  return (
    <div className="flex items-center justify-between gap-1 pt-2">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx || TERMINAL_STATUSES.includes(status);
        const isCurrent = idx === currentIdx && !TERMINAL_STATUSES.includes(status);

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                    : isDark
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? <FaCheck className="text-[10px]" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-bold truncate max-w-[68px] ${
                  isCompleted
                    ? 'text-emerald-500'
                    : isCurrent
                    ? 'text-blue-500'
                    : isDark
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full mb-4 ${
                  idx < currentIdx ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const RequestCard = ({
  request,
  type,
  isHighlighted = false,
  onAction,
  formatNumber,
  formatDateTime,
  getStatusBadge,
  isDark,
}) => {
  const isTerminal = TERMINAL_STATUSES.includes(request.status);
  const empDetails = request.employee_details || {};

  const renderDomainContent = () => {
    if (type === 'financial') {
      const hasBank = Boolean(empDetails.shaba_number || empDetails.bank_account_number);
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
              <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                نوع درخواست
              </p>
              <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {request.type_display}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
              <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                مبلغ درخواستی
              </p>
              <p className="font-black text-sm text-blue-500">
                {formatNumber(request.amount)} ریال
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>وضعیت حساب بانکی:</span>
            {hasBank ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <FaCreditCard /> شبا / حساب ثبت شده
              </span>
            ) : (
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <FaExclamationTriangle /> فاقد شبا در پرونده
              </span>
            )}
          </div>

          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              شرح درخواست
            </p>
            <p className={`text-xs leading-relaxed line-clamp-2 break-words ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {request.reason || 'بدون توضیح'}
            </p>
          </div>
        </div>
      );
    }

    if (type === 'equipment') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className={`col-span-2 p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
              <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                کالای درخواستی
              </p>
              <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {request.item_name}
              </p>
              {request.catalog_item_title && (
                <p className="text-[11px] text-teal-500 font-bold mt-0.5 truncate">
                  کاتالوگ: {request.catalog_item_title}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
              <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                تعداد
              </p>
              <p className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatNumber(request.count)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs px-1">
            <FaProjectDiagram className="text-blue-500 shrink-0" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>پروژه:</span>
            <span className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {request.project_name || 'نامشخص'}
            </span>
          </div>

          {request.system_inventory_note && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                isDark
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-200'
                  : 'bg-teal-50 border-teal-200 text-teal-900'
              }`}
            >
              <FaWarehouse className="text-teal-500 mt-0.5 shrink-0" />
              <span className="leading-relaxed break-words line-clamp-2">{request.system_inventory_note}</span>
            </div>
          )}
        </div>
      );
    }

    const balance = request.leave_balance;
    const isInsufficient = balance && balance.remaining_days < request.total_days;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
            <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              نوع مرخصی
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: request.leave_type_color || '#3B82F6' }}
              />
              <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {request.leave_type_name}
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
            <p className={`text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              مدت و بازه
            </p>
            <p className="font-black text-sm text-blue-500">
              {formatNumber(request.total_days)} روز
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {formatJalaliDate(request.start_date)} تا {formatJalaliDate(request.end_date)}
            </p>
          </div>
        </div>

        {balance ? (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              isInsufficient
                ? isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
                : isDark
                ? 'bg-slate-900/50 border-slate-700 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span>مانده مرخصی سال {formatNumber(balance.year)}:</span>
            <span className="font-black">
              {formatNumber(balance.remaining_days)} روز از {formatNumber(balance.allocated_days)} روز
            </span>
          </div>
        ) : (
          <div className={`text-[11px] px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            سهمیه سالانه برای این نوع مرخصی تعریف نشده است
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id={`request-card-${request.id}`}
      className={`rounded-2xl p-5 transition-all duration-300 border flex flex-col justify-between ${
        isHighlighted
          ? isDark
            ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/70 shadow-xl shadow-amber-500/20 scale-[1.01]'
            : 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/80 shadow-xl shadow-amber-500/20 scale-[1.01]'
          : isDark
          ? 'bg-slate-800/80 border-slate-700/80 hover:border-blue-500/50'
          : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-dashed border-slate-500/25">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {request.employee_name || 'نامشخص'}
              </h3>
              {empDetails.position_name && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-md font-bold text-white"
                  style={{ backgroundColor: empDetails.position_color || '#3B82F6' }}
                >
                  {empDetails.position_name}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-3 text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>ثبت: {formatDateTime(request.created_at)}</span>
              {empDetails.phone_number && (
                <span className="inline-flex items-center gap-1" dir="ltr">
                  <FaPhoneAlt className="text-[9px]" /> {empDetails.phone_number}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">{getStatusBadge(request.status, request.status_display)}</div>
        </div>

        {renderDomainContent()}

        {(request.admin_note || request.rejection_reason) && (
          <div
            className={`rounded-xl p-3 mt-3 border-r-4 text-xs ${
              request.status === 'REJECTED'
                ? isDark
                  ? 'bg-rose-500/10 border-rose-500 text-rose-200'
                  : 'bg-rose-50 border-rose-500 text-rose-900'
                : isDark
                ? 'bg-blue-500/10 border-blue-500 text-blue-200'
                : 'bg-blue-50 border-blue-500 text-blue-900'
            }`}
          >
            <p className="font-bold mb-1">
              {request.status === 'REJECTED' ? 'علت رد درخواست:' : 'یادداشت مدیریت:'}
            </p>
            <p className="break-words whitespace-pre-wrap leading-relaxed">
              {request.admin_note || request.rejection_reason}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-500/15 space-y-3">
        <WorkflowStepper type={type} status={request.status} isDark={isDark} />

        <button
          onClick={onAction}
          className={`w-full font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
            isTerminal
              ? isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
          }`}
        >
          {isTerminal ? (
            <>
              <FaClipboardList /> مشاهده پرونده و سوابق
            </>
          ) : (
            <>
              <FaFileSignature /> بررسی و اقدام مرحله بعد
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ActionModal = ({
  request,
  type,
  noteInput,
  setNoteInput,
  onTransition,
  onRefreshSms,
  onClose,
  loading,
  refreshingSms,
  error,
  formatNumber,
  formatDateTime,
  getStatusBadge,
  isDark,
}) => {
  const empDetails = request.employee_details || {};
  const isTerminal = TERMINAL_STATUSES.includes(request.status);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} کپی شد`);
  };

  const renderActionButtons = () => {
    if (isTerminal) return null;

    if (type === 'leave') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {request.status === 'PENDING' && (
            <>
              <button
                onClick={() => onTransition('SUPERVISOR_APPROVED')}
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <FaUserTie /> تایید سرپرست (ارسال به هیئت مدیره)
              </button>
              <button
                onClick={() => onTransition('APPROVED_PENDING_SIGN')}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <FaSignature /> تایید هیئت مدیره و پیامک امضا
              </button>
            </>
          )}

          {request.status === 'SUPERVISOR_APPROVED' && (
            <button
              onClick={() => onTransition('APPROVED_PENDING_SIGN')}
              disabled={loading}
              className="sm:col-span-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaSignature /> تایید هیئت مدیره و ارسال پیامک دعوت به امضا
            </button>
          )}

          {request.status === 'APPROVED_PENDING_SIGN' && (
            <button
              onClick={() => onTransition('APPROVED')}
              disabled={loading}
              className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaCheckDouble /> ثبت امضای فیزیکی و تایید قطعی مرخصی
            </button>
          )}

          <button
            onClick={() => onTransition('REJECTED')}
            disabled={loading}
            className="sm:col-span-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            <FaTimes /> رد درخواست مرخصی
          </button>
        </div>
      );
    }

    if (type === 'financial') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {request.status === 'PENDING' && (
            <>
              <button
                onClick={() => onTransition('SUPERVISOR_APPROVED')}
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <FaUserTie /> تایید سرپرست (ارسال به هیئت مدیره)
              </button>
              <button
                onClick={() => onTransition('APPROVED_PENDING_SIGN')}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <FaSignature /> تایید هیئت مدیره و پیامک امضا
              </button>
            </>
          )}

          {request.status === 'SUPERVISOR_APPROVED' && (
            <button
              onClick={() => onTransition('APPROVED_PENDING_SIGN')}
              disabled={loading}
              className="sm:col-span-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaSignature /> تایید هیئت مدیره و ارسال پیامک امضای اسناد
            </button>
          )}

          {request.status === 'APPROVED_PENDING_SIGN' && (
            <button
              onClick={() => onTransition('SIGNED')}
              disabled={loading}
              className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaFileSignature /> ثبت امضای اسناد مالی (آماده پرداخت)
            </button>
          )}

          {request.status === 'SIGNED' && (
            <button
              onClick={() => onTransition('PAID')}
              disabled={loading}
              className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaCreditCard /> ثبت پرداخت و ارسال پیامک واریز
            </button>
          )}

          <button
            onClick={() => onTransition('REJECTED')}
            disabled={loading}
            className="sm:col-span-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            <FaTimes /> رد درخواست مالی
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {request.status !== 'APPROVED_FOR_PURCHASE' && (
          <>
            <button
              onClick={() => onTransition('AVAILABLE_IN_STORE')}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaWarehouse /> موجود در انبار کارگاه (پیامک تحویل)
            </button>
            <button
              onClick={() => onTransition('TRANSFER_REQUIRED')}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaExchangeAlt /> نیازمند حواله انتقال از انبار دیگر
            </button>
            <button
              onClick={() => onTransition('PENDING_PURCHASE')}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaShoppingCart /> کسری کارگاه (انتظار تایید خرید)
            </button>
            <button
              onClick={() => onTransition('APPROVED_FOR_PURCHASE')}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <FaCheck /> تایید جهت خرید
            </button>
          </>
        )}

        <button
          onClick={() => onTransition('DELIVERED')}
          disabled={loading}
          className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
        >
          <FaBoxOpen /> ثبت تحویل نهایی کالا به متقاضی
        </button>

        <button
          onClick={() => onTransition('REJECTED')}
          disabled={loading}
          className="sm:col-span-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
        >
          <FaTimes /> رد درخواست تجهیزات
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div
        className={`rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`flex items-center justify-between p-5 border-b shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <h2 className={`text-lg sm:text-xl font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              پرونده درخواست #{formatNumber(request.id)}
            </h2>
            {getStatusBadge(request.status, request.status_display)}
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600'
            }`}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 min-w-0">
          <div
            className={`rounded-2xl p-4 border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              مشخصات متقاضی و جزئیات درخواست
            </h3>

            <div className="space-y-1">
              <DetailRow label="نام و نام خانوادگی" value={request.employee_name || 'نامشخص'} isDark={isDark} />
              <DetailRow label="سمت سازمانی" value={empDetails.position_name || 'ثبت نشده'} isDark={isDark} />
              <DetailRow label="کد ملی / تماس" value={`${empDetails.code_meli || '-'} | ${empDetails.phone_number || '-'}`} isDark={isDark} />

              {type === 'financial' && (
                <>
                  <DetailRow label="نوع درخواست مالی" value={request.type_display} isDark={isDark} />
                  <DetailRow
                    label="مبلغ درخواستی"
                    value={`${formatNumber(request.amount)} ریال`}
                    isDark={isDark}
                    highlight
                  />
                  <DetailRow label="دلیل درخواست" value={request.reason || 'ندارد'} isDark={isDark} />
                </>
              )}

              {type === 'equipment' && (
                <>
                  <DetailRow label="کالای درخواستی" value={request.item_name} isDark={isDark} highlight />
                  {request.catalog_item_title && (
                    <DetailRow label="کالای متناظر در کاتالوگ" value={request.catalog_item_title} isDark={isDark} />
                  )}
                  <DetailRow label="تعداد درخواستی" value={formatNumber(request.count)} isDark={isDark} />
                  <DetailRow label="پروژه" value={request.project_name || 'نامشخص'} isDark={isDark} />
                  <DetailRow label="توضیحات متقاضی" value={request.description || 'ندارد'} isDark={isDark} />
                </>
              )}

              {type === 'leave' && (
                <>
                  <DetailRow label="نوع مرخصی" value={request.leave_type_name} isDark={isDark} highlight />
                  <DetailRow
                    label="بازه زمانی"
                    value={`از ${formatJalaliDate(request.start_date)} تا ${formatJalaliDate(request.end_date)} (${formatNumber(request.total_days)} روز)`}
                    isDark={isDark}
                  />
                  <DetailRow label="دلیل مرخصی" value={request.reason || 'ندارد'} isDark={isDark} />
                </>
              )}

              <DetailRow label="زمان ثبت اولیه" value={formatDateTime(request.created_at)} isDark={isDark} />
            </div>
          </div>

          {type === 'financial' && (
            <div
              className={`rounded-2xl p-4 border ${
                isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
              }`}
            >
              <h3 className={`text-xs font-black mb-3 flex items-center gap-2 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                <FaCreditCard /> اطلاعات بانکی جهت واریز وجه
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-slate-900/80' : 'bg-white'}`}>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">شماره شبا (IBAN)</p>
                    <p className={`text-xs font-black truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`} dir="ltr">
                      {empDetails.shaba_number || 'ثبت نشده'}
                    </p>
                  </div>
                  {empDetails.shaba_number && (
                    <button
                      onClick={() => copyToClipboard(empDetails.shaba_number, 'شماره شبا')}
                      className="p-2 rounded-lg bg-blue-600/15 text-blue-500 hover:bg-blue-600 hover:text-white transition-colors shrink-0"
                    >
                      <FaCopy />
                    </button>
                  )}
                </div>

                <div className={`p-3 rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-slate-900/80' : 'bg-white'}`}>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">شماره حساب بانکی</p>
                    <p className={`text-xs font-black truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`} dir="ltr">
                      {empDetails.bank_account_number || 'ثبت نشده'}
                    </p>
                  </div>
                  {empDetails.bank_account_number && (
                    <button
                      onClick={() => copyToClipboard(empDetails.bank_account_number, 'شماره حساب')}
                      className="p-2 rounded-lg bg-blue-600/15 text-blue-500 hover:bg-blue-600 hover:text-white transition-colors shrink-0"
                    >
                      <FaCopy />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {type === 'leave' && (
            <div
              className={`rounded-2xl p-4 border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <h3 className={`text-xs font-black mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                وضعیت سهمیه و مانده مرخصی سالانه
              </h3>
              {request.leave_balance ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <p className="text-[11px] text-slate-400">سال</p>
                    <p className={`font-black text-sm mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatNumber(request.leave_balance.year)}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <p className="text-[11px] text-slate-400">سهمیه کل</p>
                    <p className={`font-black text-sm mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatNumber(request.leave_balance.allocated_days)} روز
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <p className="text-[11px] text-slate-400">مصرف‌شده</p>
                    <p className="font-black text-sm mt-0.5 text-amber-500">
                      {formatNumber(request.leave_balance.used_days)} روز
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <p className="text-[11px] text-slate-400">مانده فعلی</p>
                    <p
                      className={`font-black text-sm mt-0.5 ${
                        request.leave_balance.remaining_days < request.total_days
                          ? 'text-rose-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {formatNumber(request.leave_balance.remaining_days)} روز
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">رکورد مانده مرخصی برای این کارمند و نوع مرخصی یافت نشد.</p>
              )}
            </div>
          )}

          {type === 'equipment' && request.system_inventory_note && (
            <div
              className={`rounded-2xl p-4 border ${
                isDark ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-200'
              }`}
            >
              <h3 className={`text-xs font-black mb-1.5 flex items-center gap-2 ${isDark ? 'text-teal-300' : 'text-teal-800'}`}>
                <FaWarehouse /> نتیجه استعلام خودکار سیستم از انبار
              </h3>
              <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>
                {request.system_inventory_note}
              </p>
            </div>
          )}

          {(request.supervisor_approver_name ||
            request.board_approver_name ||
            request.signed_at ||
            request.paid_at ||
            request.approved_by_name) && (
            <div
              className={`rounded-2xl p-4 border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <h3 className={`text-xs font-black mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                تاریخچه تاییدات و امضا
              </h3>
              <div className="space-y-1">
                {request.supervisor_approver_name && (
                  <DetailRow label="تاییدکننده سرپرست" value={request.supervisor_approver_name} isDark={isDark} />
                )}
                {request.board_approver_name && (
                  <DetailRow label="تاییدکننده هیئت مدیره" value={request.board_approver_name} isDark={isDark} />
                )}
                {request.approved_by_name && (
                  <DetailRow label="تاییدکننده خرید / تحویل" value={request.approved_by_name} isDark={isDark} />
                )}
                {request.signed_at && (
                  <DetailRow
                    label="ثبت امضای فیزیکی"
                    value={`${request.signed_registered_by_name || '-'} (${formatDateTime(request.signed_at)})`}
                    isDark={isDark}
                  />
                )}
                {request.paid_at && (
                  <DetailRow
                    label="ثبت پرداخت و واریز"
                    value={`${request.paid_by_name || '-'} (${formatDateTime(request.paid_at)})`}
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          )}

          <div
            className={`rounded-2xl p-4 border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className={`text-xs font-black flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <FaSms className="text-blue-500 text-base" /> لاگ پیامک‌های ارسالی ({request.sms_logs?.length || 0})
              </h3>
              {request.sms_logs && request.sms_logs.length > 0 && (
                <button
                  onClick={onRefreshSms}
                  disabled={refreshingSms}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600/15 text-blue-500 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FaSyncAlt className={refreshingSms ? 'animate-spin' : ''} /> استعلام وضعیت تحویل
                </button>
              )}
            </div>

            {request.sms_logs && request.sms_logs.length > 0 ? (
              <div className="space-y-2">
                {request.sms_logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {log.recipient_name} ({log.phone})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        پترن: {log.pattern_body_id || '-'} | ارسال: {formatDateTime(log.created_at)}
                        {log.checked_at ? ` | استعلام: ${formatDateTime(log.checked_at)}` : ''}
                      </p>
                      {log.error && <p className="text-[11px] text-rose-500 mt-1">{log.error}</p>}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 self-start sm:self-center ${
                        log.delivery_status === 'DELIVERED'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : log.delivery_status === 'FAILED'
                          ? 'bg-rose-500/15 text-rose-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {log.delivery_status_display}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">هنوز پیامکی برای این درخواست ثبت نشده است.</p>
            )}
          </div>

          {!isTerminal && (
            <div>
              <label className={`block font-bold mb-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {type === 'financial'
                  ? 'یادداشت مدیریت / توضیحات واریز یا علت رد'
                  : 'علت رد درخواست (در صورت رد کردن الزامی است)'}
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows="3"
                placeholder={
                  type === 'financial'
                    ? 'یادداشت مدیریتی، شماره پیگیری واریز یا علت رد را وارد کنید...'
                    : 'در صورت رد درخواست، دلیل آن را برای کارمند بنویسید...'
                }
                className={`w-full rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                  isDark
                    ? 'bg-slate-800 text-white border-slate-700'
                    : 'bg-white text-slate-900 border-slate-300'
                }`}
              />
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500 rounded-xl p-3 text-rose-500 font-bold text-xs">
              {error}
            </div>
          )}
        </div>

        {!isTerminal && (
          <div
            className={`p-5 border-t shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'
            }`}
          >
            {renderActionButtons()}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, isDark, highlight }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-start sm:justify-between py-2 border-b last:border-0 border-dashed gap-1 sm:gap-4 ${
      isDark ? 'border-slate-700/70' : 'border-slate-200'
    }`}
  >
    <span className={`text-xs font-bold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      {label}:
    </span>
    <span
      className={`text-xs sm:text-sm font-black break-words whitespace-pre-wrap sm:text-left min-w-0 ${
        highlight ? 'text-blue-500' : isDark ? 'text-white' : 'text-slate-900'
      }`}
    >
      {value}
    </span>
  </div>
);

export default RequestManagementScreen;