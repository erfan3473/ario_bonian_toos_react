// src/screens/admin/UserDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDetail } from '../../features/admin/adminSlice';
import PersonalInfoTab from '../../components/admin/tabs/PersonalInfoTab';
import OrganizationalTab from '../../components/admin/tabs/OrganizationalTab';
import ContractsTab from '../../components/admin/tabs/ContractsTab';
import FinancialTab from '../../components/admin/tabs/FinancialTab';
import LeaveTab from '../../components/admin/tabs/LeaveTab';

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedUser, loading } = useSelector((state) => state.admin);
  const userLoading = loading.userDetail;

  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: ' سیستمی', icon: '👤' },
    { id: 'organizational', label: 'سازمانی', icon: '👔' },
    { id: 'contracts', label: 'قراردادها', icon: '📋' },
    { id: 'financial', label: 'مالی', icon: '💰' },
    { id: 'leave', label: 'مرخصی', icon: '🏖️' },
  ];

  useEffect(() => {
   
      dispatch(fetchUserDetail(userId));
    
  }, [userId, dispatch]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleBack = () => {
    navigate('/admin/users');
    
  };

  
if (userLoading ) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
        <div className="bg-gray-900 rounded-2xl p-12 text-center border-4 border-gray-700 max-w-4xl w-full animate-pulse">
          <div className="animate-spin text-6xl mb-8 text-blue-500">⏳</div>
          <h2 className="text-3xl font-bold text-white mb-4">در حال بارگذاری پروفایل...</h2>
          <p className="text-gray-400 text-xl">لطفاً چند لحظه صبر کنید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all shadow-lg border border-gray-600 hover:shadow-xl hover:scale-105 w-fit"
            >
              ← بازگشت به لیست
            </button>
            
            
            <div className="flex-1 ">
              <h1 className=" text-4xl font-bold text-white mb-2">
               
                 
                    👤 {selectedUser?.first_name} {selectedUser?.last_name}
                   
                 
                
              </h1>
             
            </div>
            
           
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900/50 border-2 border-gray-700 rounded-2xl p-1 mb-8 backdrop-blur-sm shadow-2xl">
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all whitespace-nowrap flex-shrink-0 group min-w-fit ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl scale-101 border-2 border-blue-400'
                    : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 border border-transparent hover:shadow-lg'
                }`}
              >
                <span className="text-1xl group-hover:scale-101 transition-transform">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-900/70 border-2 border-gray-700 rounded-xl p-8 shadow-2xl backdrop-blur-sm min-h-[600px]">
          {activeTab === 'personal' && <PersonalInfoTab user={selectedUser || {}}  />}
          {activeTab === 'organizational' && <OrganizationalTab user={selectedUser || {}} />}
          {activeTab === 'contracts' && <ContractsTab user={selectedUser || {}} />}
          {activeTab === 'financial' && <FinancialTab user={selectedUser || {}} />}
          {activeTab === 'leave' && <LeaveTab user={selectedUser || {}} />}
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
