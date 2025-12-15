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
  FaChartLine 
} from 'react-icons/fa';

const RequestManagementScreen = () => {
  const dispatch = useDispatch();
  
  const { financial, equipment, leave, stats, updating, updateSuccess, updateError } = 
    useSelector((state) => state.adminRequests);

  const [activeTab, setActiveTab] = useState('financial'); // financial | equipment | leave
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
      
      // رفرش لیست
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
      PENDING: 'bg-yellow-500 text-white',
      APPROVED: 'bg-green-500 text-white',
      REJECTED: 'bg-red-500 text-white',
    };
    
    const labels = {
      PENDING: 'در انتظار',
      APPROVED: 'تایید شده',
      REJECTED: 'رد شده',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
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
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          مدیریت درخواست‌ها
        </h1>
        <p className="text-gray-400">تایید و رد درخواست‌های کارکنان</p>
      </div>

      {/* Stats Cards */}
      {stats.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FaClock />}
            title="در انتظار"
            value={stats.data.pending_count || 0}
            color="yellow"
          />
          <StatCard
            icon={<FaCheck />}
            title="تایید شده"
            value={stats.data.approved_count || 0}
            color="green"
          />
          <StatCard
            icon={<FaTimes />}
            title="رد شده"
            value={stats.data.rejected_count || 0}
            color="red"
          />
          <StatCard
            icon={<FaChartLine />}
            title="کل درخواست‌ها"
            value={stats.data.total_count || 0}
            color="blue"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <TabButton
          active={activeTab === 'financial'}
          onClick={() => setActiveTab('financial')}
          icon={<FaMoneyBillWave />}
          label="مالی"
        />
        <TabButton
          active={activeTab === 'equipment'}
          onClick={() => setActiveTab('equipment')}
          icon={<FaTools />}
          label="تجهیزات"
        />
        <TabButton
          active={activeTab === 'leave'}
          onClick={() => setActiveTab('leave')}
          icon={<FaCalendarAlt />}
          label="مرخصی"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <FilterButton
          active={filterStatus === 'PENDING'}
          onClick={() => setFilterStatus('PENDING')}
          label="در انتظار"
        />
        <FilterButton
          active={filterStatus === 'APPROVED'}
          onClick={() => setFilterStatus('APPROVED')}
          label="تایید شده"
        />
        <FilterButton
          active={filterStatus === 'REJECTED'}
          onClick={() => setFilterStatus('REJECTED')}
          label="رد شده"
        />
        <FilterButton
          active={filterStatus === null}
          onClick={() => setFilterStatus(null)}
          label="همه"
        />
      </div>

      {/* Content */}
      {currentData.loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">در حال بارگذاری...</p>
        </div>
      ) : currentData.error ? (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          {currentData.error}
        </div>
      ) : currentData.data.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">درخواستی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {currentData.data.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              type={activeTab}
              onAction={() => handleOpenModal(request)}
              formatNumber={formatNumber}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
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
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════

const StatCard = ({ icon, title, value, color }) => {
  const colors = {
    yellow: 'border-yellow-500 text-yellow-500',
    green: 'border-green-500 text-green-500',
    red: 'border-red-500 text-red-500',
    blue: 'border-blue-500 text-blue-500',
  };

  return (
    <div className={`bg-gray-800 border-r-4 ${colors[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`text-3xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
      active
        ? 'text-yellow-500 border-b-2 border-yellow-500'
        : 'text-gray-400 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const FilterButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-yellow-500 text-gray-900'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
    }`}
  >
    {label}
  </button>
);

const RequestCard = ({ request, type, onAction, formatNumber, formatDate, getStatusBadge }) => {
  const renderContent = () => {
    if (type === 'financial') {
      return (
        <>
          <div>
            <p className="text-sm text-gray-400">نوع</p>
            <p className="text-white font-semibold">{request.type_display}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">مبلغ</p>
            <p className="text-white font-semibold">{formatNumber(request.amount)} ریال</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">دلیل</p>
            <p className="text-white">{request.reason || 'ندارد'}</p>
          </div>
        </>
      );
    } else if (type === 'equipment') {
      return (
        <>
          <div>
            <p className="text-sm text-gray-400">وسیله</p>
            <p className="text-white font-semibold">{request.item_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">تعداد</p>
            <p className="text-white font-semibold">{request.count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">پروژه</p>
            <p className="text-white">{request.project_name || 'نامشخص'}</p>
          </div>
        </>
      );
    } else if (type === 'leave') {
      return (
        <>
          <div>
            <p className="text-sm text-gray-400">نوع</p>
            <p className="text-white font-semibold">{request.leave_type_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">مدت</p>
            <p className="text-white font-semibold">{request.total_days} روز</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">تاریخ</p>
            <p className="text-white">{request.start_date} تا {request.end_date}</p>
          </div>
        </>
      );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{request.employee_name || 'نام کارمند'}</h3>
          <p className="text-sm text-gray-400">تاریخ ثبت: {formatDate(request.created_at)}</p>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {renderContent()}
      </div>

      {request.admin_note && (
        <div className="bg-gray-700 rounded p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">یادداشت مدیر:</p>
          <p className="text-sm text-white">{request.admin_note}</p>
        </div>
      )}

      {request.status === 'PENDING' && (
        <button
          onClick={onAction}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded transition-colors"
        >
          بررسی و اقدام
        </button>
      )}
    </div>
  );
};

const ActionModal = ({
  request,
  type,
  adminNote,
  setAdminNote,
  onApprove,
  onReject,
  onClose,
  loading,
  error,
  formatNumber,
  formatDate,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">بررسی درخواست</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Request Details */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">جزئیات</h3>
            
            {type === 'financial' && (
              <>
                <DetailRow label="نوع" value={request.type_display} />
                <DetailRow label="مبلغ" value={`${formatNumber(request.amount)} ریال`} />
                <DetailRow label="دلیل" value={request.reason || 'ندارد'} />
              </>
            )}
            
            {type === 'equipment' && (
              <>
                <DetailRow label="وسیله" value={request.item_name} />
                <DetailRow label="تعداد" value={request.count} />
                <DetailRow label="پروژه" value={request.project_name || 'نامشخص'} />
                <DetailRow label="توضیحات" value={request.description || 'ندارد'} />
              </>
            )}
            
            {type === 'leave' && (
              <>
                <DetailRow label="نوع مرخصی" value={request.leave_type_name} />
                <DetailRow label="از تاریخ" value={request.start_date} />
                <DetailRow label="تا تاریخ" value={request.end_date} />
                <DetailRow label="مدت" value={`${request.total_days} روز`} />
                <DetailRow label="دلیل" value={request.reason || 'ندارد'} />
              </>
            )}
            
            <DetailRow label="تاریخ ثبت" value={formatDate(request.created_at)} />
          </div>

          {/* Admin Note */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              یادداشت مدیر (اختیاری)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
              rows="4"
              placeholder="در صورت نیاز، توضیحات خود را وارد کنید..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4 text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onApprove}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? '...' : <><FaCheck /> تایید</>}
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? '...' : <><FaTimes /> رد</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-600 last:border-0">
    <span className="text-gray-400">{label}:</span>
    <span className="text-white font-semibold">{value}</span>
  </div>
);

export default RequestManagementScreen;
