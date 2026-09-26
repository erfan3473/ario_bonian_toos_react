// src/screens/admin/RequestManagementScreen.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFinancialRequests,
  fetchEquipmentRequests,
  fetchLeaveRequests,
  fetchRequestsStats,
  updateFinancialStatus,
  updateEquipmentStatus,
  updateLeaveStatus,
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
  FaClipboardList
} from 'react-icons/fa';

import { formatJalaliDate } from '../../utils/dateUtils';

const RequestManagementScreen = () => {
  const dispatch = useDispatch();
  
  const { financial, equipment, leave, stats, updating, updateSuccess, updateError } = 
    useSelector((state) => state.adminRequests);

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const [activeTab, setActiveTab] = useState('financial');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // ═══════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════
  
  useEffect(() => {
    dispatch(fetchRequestsStats());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'financial') {
      dispatch(fetchFinancialRequests({ status: filterStatus }));
    } else if (activeTab === 'equipment') {
      dispatch(fetchEquipmentRequests({ status: filterStatus }));
    } else if (activeTab === 'leave') {
      dispatch(fetchLeaveRequests({ status: filterStatus }));
    }
  }, [dispatch, activeTab, filterStatus]);

  useEffect(() => {
    if (updateSuccess) {
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNote('');
      dispatch(resetUpdateStatus());
      
      if (activeTab === 'financial') {
        dispatch(fetchFinancialRequests({ status: filterStatus }));
      } else if (activeTab === 'equipment') {
        dispatch(fetchEquipmentRequests({ status: filterStatus }));
      } else if (activeTab === 'leave') {
        dispatch(fetchLeaveRequests({ status: filterStatus }));
      }
      
      dispatch(fetchRequestsStats());
    }
  }, [updateSuccess, dispatch, activeTab, filterStatus]);

  // ═══════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════
  
  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setAdminNote('');
    setShowModal(true);
  };

  const handleApproveReject = (status) => {
    if (!selectedRequest) return;

    const payload = {
      id: selectedRequest.id,
      status,
      admin_note: adminNote,
    };

    if (activeTab === 'financial') {
      dispatch(updateFinancialStatus(payload));
    } else if (activeTab === 'equipment') {
      dispatch(updateEquipmentStatus(payload));
    } else if (activeTab === 'leave') {
      dispatch(updateLeaveStatus(payload));
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Render Helpers
  // ═══════════════════════════════════════════════════════════
  
  const getStatusBadge = (status) => {
    const styles = {
      PENDING: isDark ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      APPROVED: isDark ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-green-100 text-green-700 border border-green-300',
      REJECTED: isDark ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-red-100 text-red-700 border border-red-300',
    };
    
    const labels = {
      PENDING: '⏳ در انتظار',
      APPROVED: '✅ تایید شده',
      REJECTED: '❌ رد شده',
    };

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  // ═══════════════════════════════════════════════════════════
  // Current Data
  // ═══════════════════════════════════════════════════════════
  
  const getCurrentData = () => {
    if (activeTab === 'financial') return financial;
    if (activeTab === 'equipment') return equipment;
    if (activeTab === 'leave') return leave;
    return { loading: false, data: [], error: null };
  };

  const currentData = getCurrentData();

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`container mx-auto p-4 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
        isDark ? 'border-blue-700 bg-gray-800/50 shadow-2xl' : 'border-blue-600 bg-white shadow-lg'
      }`}>
        
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <span className="text-blue-500 text-3xl"><FaClipboardList /></span> مدیریت درخواست‌ها
          </h1>
          <p className={`mt-2 sm:mt-0 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            تایید و رد درخواست‌های کارکنان
          </p>
        </div>

        {/* Stats Cards */}
        {stats.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FaChartLine />} title="کل درخواست‌ها" value={stats.data.total_count || 0} color="blue" isDark={isDark} />
            <StatCard icon={<FaClock />} title="در انتظار" value={stats.data.pending_count || 0} color="yellow" isDark={isDark} />
            <StatCard icon={<FaCheck />} title="تایید شده" value={stats.data.approved_count || 0} color="green" isDark={isDark} />
            <StatCard icon={<FaTimes />} title="رد شده" value={stats.data.rejected_count || 0} color="red" isDark={isDark} />
          </div>
        )}

        {/* Tabs */}
        <div className={`flex flex-wrap justify-center gap-2 mb-6 p-1.5 rounded-xl border ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <TabButton
            active={activeTab === 'financial'}
            onClick={() => setActiveTab('financial')}
            icon={<FaMoneyBillWave />}
            value={stats.data?.total_count_financial || 0}
            label="مالی"
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'equipment'}
            onClick={() => setActiveTab('equipment')}
            icon={<FaTools />}
            label="تجهیزات"
            value={stats.data?.total_count_equipment || 0}
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'leave'}
            onClick={() => setActiveTab('leave')}
            icon={<FaCalendarAlt />}
            value={stats.data?.total_count_leave || 0}
            label="مرخصی"
            isDark={isDark}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <FilterButton active={filterStatus === null} onClick={() => setFilterStatus(null)} label="همه موارد" isDark={isDark} />
          <FilterButton active={filterStatus === 'PENDING'} onClick={() => setFilterStatus('PENDING')} label="در انتظار" isDark={isDark} />
          <FilterButton active={filterStatus === 'APPROVED'} onClick={() => setFilterStatus('APPROVED')} label="تایید شده" isDark={isDark} />
          <FilterButton active={filterStatus === 'REJECTED'} onClick={() => setFilterStatus('REJECTED')} label="رد شده" isDark={isDark} />
        </div>

        {/* Content */}
        {currentData.loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>در حال دریافت اطلاعات...</p>
          </div>
        ) : currentData.error ? (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-500 font-bold text-center">
            {currentData.error}
          </div>
        ) : currentData.data.length === 0 ? (
          <div className={`text-center py-16 border-2 border-dashed rounded-2xl ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
            <span className={`text-5xl mb-4 block ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>📭</span>
            <p className={`text-lg font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>هیچ درخواستی در این بخش یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentData.data.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                type={activeTab}
                onAction={() => handleOpenModal(request)}
                formatNumber={formatNumber}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && selectedRequest && (
          <ActionModal
            request={selectedRequest}
            type={activeTab}
            adminNote={adminNote}
            setAdminNote={setAdminNote}
            onApprove={() => handleApproveReject('APPROVED')}
            onReject={() => handleApproveReject('REJECTED')}
            onClose={() => setShowModal(false)}
            loading={updating}
            error={updateError}
            formatNumber={formatNumber}
            formatDate={formatDate}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════

const StatCard = ({ icon, title, value, color, isDark }) => {
  const darkColors = {
    yellow: 'border-yellow-500 text-yellow-400 bg-gray-800',
    green: 'border-green-500 text-green-400 bg-gray-800',
    red: 'border-red-500 text-red-400 bg-gray-800',
    blue: 'border-blue-500 text-blue-400 bg-gray-800',
  };
  
  const lightColors = {
    yellow: 'border-yellow-500 text-yellow-600 bg-white',
    green: 'border-green-500 text-green-600 bg-white',
    red: 'border-red-500 text-red-600 bg-white',
    blue: 'border-blue-500 text-blue-600 bg-white',
  };

  const selectedColors = isDark ? darkColors[color] : lightColors[color];

  return (
    <div className={`border-r-4 rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${selectedColors} ${isDark ? 'border-y border-l border-gray-700' : 'border-y border-l border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
        </div>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, value, isDark }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold tracking-tight transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : isDark
          ? 'text-gray-400 hover:text-white hover:bg-gray-700'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
    }`}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
    <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
      active 
        ? 'bg-white/20 text-white' 
        : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'
    }`}>
      {value}
    </span>
  </button>
);

const FilterButton = ({ active, onClick, label, isDark }) => (
  <button
    onClick={onClick}
    className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm tracking-tight transition-all ${
      active
        ? isDark ? 'bg-yellow-500 text-gray-900 shadow-lg' : 'bg-blue-600 text-white shadow-md'
        : isDark
          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
    }`}
  >
    {label}
  </button>
);

const RequestCard = ({ request, type, onAction, formatNumber, formatDate, getStatusBadge, isDark }) => {
  // جلوگیری از بیرون زدن متون با استفاده از break-words و min-w-0
  const renderContent = () => {
    if (type === 'financial') {
      return (
        <>
          <div className="min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>نوع درخواست</p>
            <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{request.type_display}</p>
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>مبلغ</p>
            <p className="font-black text-sm text-blue-500 truncate">{formatNumber(request.amount)} ریال</p>
          </div>
          <div className="col-span-1 md:col-span-2 min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>دلیل</p>
            <p className={`font-medium text-sm break-words whitespace-normal line-clamp-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{request.reason || 'ندارد'}</p>
          </div>
        </>
      );
    } else if (type === 'equipment') {
      return (
        <>
          <div className="min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>وسیله درخواستی</p>
            <p className={`font-black text-sm break-words whitespace-normal line-clamp-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{request.item_name}</p>
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تعداد</p>
            <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{request.count}</p>
          </div>
          <div className="col-span-1 md:col-span-2 min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>پروژه</p>
            <p className={`font-medium text-sm break-words whitespace-normal line-clamp-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{request.project_name || 'نامشخص'}</p>
          </div>
        </>
      );
    } else if (type === 'leave') {
      return (
        <>
          <div className="min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>نوع مرخصی</p>
            <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{request.leave_type_name}</p>
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>مدت زمان</p>
            <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{request.total_days} روز</p>
          </div>
          <div className="col-span-1 md:col-span-2 min-w-0">
            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تاریخ مرخصی</p>
            <p className={`font-medium text-sm text-blue-500 break-words`}>
              {formatJalaliDate(request.start_date) || '-'} تا {formatJalaliDate(request.end_date) || '-'}
            </p>
          </div>
        </>
      );
    }
  };

  return (
    <div className={`rounded-xl p-5 sm:p-6 transition-all border ${
      isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 border-b pb-4 border-dashed border-gray-500/30">
        <div className="min-w-0 flex-1">
          <h3 className={`text-lg font-black break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>{request.employee_name || 'نام کارمند'}</h3>
          <p className={`text-xs font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تاریخ ثبت: {formatDate(request.created_at)}</p>
        </div>
        <div className="shrink-0 self-start">
          {getStatusBadge(request.status)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {renderContent()}
      </div>

      {request.admin_note && (
        <div className={`rounded-lg p-3.5 mb-5 border-r-4 border-blue-500 ${isDark ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
          <p className={`text-xs font-bold mb-1.5 flex items-center gap-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            <FaClipboardList /> یادداشت مدیریت:
          </p>
          <p className={`text-sm break-words whitespace-pre-wrap leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{request.admin_note}</p>
        </div>
      )}

      {request.status === 'PENDING' && (
        <button
          onClick={onAction}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
        >
          <FaTools /> بررسی و اقدام
        </button>
      )}
    </div>
  );
};

const ActionModal = ({
  request, type, adminNote, setAdminNote, onApprove, onReject, onClose, loading, error, formatNumber, formatDate, isDark
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <span className="text-blue-500">📋</span> بررسی دقیق درخواست
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
            }`}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto min-w-0">
          
          <div className={`rounded-xl p-4 sm:p-5 mb-6 border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`text-sm font-black mb-4 pb-2 border-b ${isDark ? 'text-white border-gray-600' : 'text-gray-800 border-gray-200'}`}>
              جزئیات کامل درخواست
            </h3>
            
            <div className="space-y-1 min-w-0">
              <DetailRow label="نام کارمند" value={request.employee_name || 'نامشخص'} isDark={isDark} />
              
              {type === 'financial' && (
                <>
                  <DetailRow label="نوع درخواست" value={request.type_display} isDark={isDark} />
                  <DetailRow label="مبلغ درخواستی" value={`${formatNumber(request.amount)} ریال`} isDark={isDark} highlight />
                  <DetailRow label="دلیل درخواست" value={request.reason || 'ندارد'} isDark={isDark} />
                </>
              )}
              
              {type === 'equipment' && (
                <>
                  <DetailRow label="نام وسیله" value={request.item_name} isDark={isDark} highlight />
                  <DetailRow label="تعداد" value={request.count} isDark={isDark} />
                  <DetailRow label="پروژه مربوطه" value={request.project_name || 'نامشخص'} isDark={isDark} />
                  <DetailRow label="توضیحات تکمیلی" value={request.description || 'ندارد'} isDark={isDark} />
                </>
              )}
              
              {type === 'leave' && (
                <>
                  <DetailRow label="نوع مرخصی" value={request.leave_type_name} isDark={isDark} highlight />
                  <DetailRow label="از تاریخ" value={formatJalaliDate(request.start_date)} isDark={isDark} />
                  <DetailRow label="تا تاریخ" value={formatJalaliDate(request.end_date)} isDark={isDark} />
                  <DetailRow label="مدت زمان" value={`${request.total_days} روز`} isDark={isDark} />
                  <DetailRow label="دلیل مرخصی" value={request.reason || 'ندارد'} isDark={isDark} />
                </>
              )}
              
              <DetailRow label="تاریخ ثبت سیستم" value={formatDate(request.created_at)} isDark={isDark} />
            </div>
          </div>

          <div className="mb-2">
            <label className={`block font-bold mb-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              یادداشت مدیریت (برای کارمند نمایش داده می‌شود)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className={`w-full rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border transition-colors ${
                isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
              }`}
              rows="3"
              placeholder="توضیحات تایید یا علت رد درخواست را اینجا بنویسید..."
            />
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 font-bold text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-5 sm:p-6 border-t shrink-0 flex flex-col sm:flex-row gap-3 ${isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black py-3.5 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaCheck /> تایید درخواست</>}
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black py-3.5 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaTimes /> رد درخواست</>}
          </button>
        </div>
        
      </div>
    </div>
  );
};

// حل مشکل بیرون زدن تکست‌ها در مدال با flex-col در موبایل و break-words
const DetailRow = ({ label, value, isDark, highlight }) => (
  <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between py-2.5 border-b last:border-0 border-dashed gap-1 sm:gap-4 ${
    isDark ? 'border-gray-600/50' : 'border-gray-300'
  }`}>
    <span className={`text-xs sm:text-sm font-bold shrink-0 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}:</span>
    <span className={`text-sm font-black break-words whitespace-pre-wrap sm:text-left min-w-0 ${
      highlight ? 'text-blue-500' : isDark ? 'text-white' : 'text-gray-800'
    }`}>
      {value}
    </span>
  </div>
);

export default RequestManagementScreen;