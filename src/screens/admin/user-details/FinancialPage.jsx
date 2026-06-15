import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUserDetail } from '../../../features/admin/usersSlice';

const FinancialPage = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedUser: user, loading: usersLoading } = useSelector((state) => state.admin.users);
  const userLoading = usersLoading?.userDetail;

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setIsInitializing(true);
    
    const fetchUserData = async () => {
      try {
        await dispatch(fetchUserDetail(userId));
      } catch (error) {
        console.error("خطا در دریافت اطلاعات کاربر:", error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [dispatch, userId]);

  if (isInitializing || userLoading) {
    return <div className="p-8 flex justify-center items-center h-screen text-gray-500 font-bold text-lg">در حال بارگذاری اطلاعات...</div>;
  }
  
  if (!user) {
    return <div className="p-8 flex justify-center items-center h-screen text-red-500 font-bold text-lg">کاربر یافت نشد.</div>;
  }

  const employee = user?.employee_details;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="text-sm font-medium text-gray-500 mb-4 flex gap-2 items-center">
          <Link to="/admin/users" className="hover:text-blue-600 transition-colors">👥 لیست کاربران</Link>
          <span>/</span>
          <Link to={`/admin/users/${userId}`} className="hover:text-blue-600 transition-colors">
            داشبورد {user.first_name} {user.last_name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">اطلاعات مالی</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            💰 اطلاعات مالی: <span className="text-blue-600">{user.first_name} {user.last_name}</span>
          </h1>
          <button
            onClick={() => navigate(`/admin/users/${userId}`)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            ← بازگشت به داشبورد
          </button>
        </div>
      </div>

      {!employee ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6">
          ⚠️ برای این کاربر هنوز اطلاعات پرسنلی ثبت نشده است. بنابراین اطلاعات مالی در دسترس نیست.
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* Financial Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">مشخصات بانکی و بیمه</h3>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium mb-1 sm:mb-0">شماره شبا:</span>
              <span className="text-gray-900 font-mono font-bold tracking-widest text-left" dir="ltr">
                {employee?.shaba_number ? `IR ${employee.shaba_number}` : '---'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium mb-1 sm:mb-0">شماره حساب:</span>
              <span className="text-gray-900 font-mono font-bold text-left" dir="ltr">
                {employee?.bank_account_number || '---'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium mb-1 sm:mb-0">کد بیمه تأمین اجتماعی:</span>
              <span className="text-gray-900 font-mono font-bold text-left" dir="ltr">
                {employee?.insurance_code || '---'}
              </span>
            </div>
          </div>

          
        </div>
      )}
    </div>
  );
};

export default FinancialPage;
