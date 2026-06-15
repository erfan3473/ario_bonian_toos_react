// // src/screens/admin/UserDetailLayout.jsx
// import React, { useEffect } from 'react';
// import { useParams, useNavigate, Outlet, NavLink } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchUserDetail } from "../../features/admin/usersSlice";

// const UserDetailLayout = () => {
//   const { userId } = useParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
  
//   const { selectedUser, loading = {} } = useSelector((state) => state.admin.users || {});
//   // کنترل ایمن لودینگ (چه آبجکت باشد چه بولین)
//   const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;

//   const links = [
//     { id: 'personal', path: 'personal', label: 'سیستمی', icon: '👤' },
//     { id: 'contracts', path: 'contracts', label: 'قراردادها', icon: '📋' },
//     { id: 'financial', path: 'financial', label: 'مالی', icon: '💰' },
//     { id: 'leave', path: 'leave', label: 'مرخصی', icon: '🏖️' },
//   ];

//   useEffect(() => {
//     dispatch(fetchUserDetail(userId));
//   }, [userId, dispatch]);

//   if (userLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-8">
//         <div className="bg-gray-900 rounded-2xl p-12 text-center border-4 border-gray-700 max-w-2xl w-full animate-pulse shadow-2xl">
//           <div className="animate-spin text-6xl mb-8 text-blue-500">⏳</div>
//           <h2 className="text-3xl font-bold text-white mb-4">در حال بارگذاری پروفایل...</h2>
//           <p className="text-gray-400 text-xl">لطفاً چند لحظه صبر کنید</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col w-full h-full">
//       <div className="max-w-7xl mx-auto w-full">
        
//         {/* Header - هدر و دکمه‌های اکشن */}
//         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-900/50 p-6 rounded-2xl border border-gray-700 shadow-lg">
//           <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full md:w-auto">
//             <button
//               onClick={() => navigate('/admin/users')}
//               className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all shadow-md border border-gray-600 hover:scale-105 w-full md:w-fit"
//             >
//               ← بازگشت
//             </button>
//             <h1 className="text-3xl md:text-4xl font-bold text-white whitespace-nowrap">
//               {selectedUser?.first_name} {selectedUser?.last_name}
//             </h1>
//           </div>

//           <button
//             onClick={() => navigate(`/admin/users/${userId}/organizational`)}
//             className="flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg border border-blue-500 hover:scale-105 w-full md:w-fit"
//           >
//             <span className="text-xl">👔</span>
//             <span>ورود به صفحه سازمانی</span>
//           </button>
//         </div>

//         {/* Navigation Links - دیزاین متناسب برای ۴ تا ۵ دکمه با استفاده از flex-1 */}
//         <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-2 mb-8 shadow-xl backdrop-blur-sm">
//           <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
//             {links.map((link) => (
//               <NavLink
//                 key={link.id}
//                 to={link.path}
//                 className={({ isActive }) =>
//                   `flex-1 min-w-[130px] flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-bold transition-all whitespace-nowrap group ${
//                     isActive
//                       ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border border-blue-400 scale-[1.02]'
//                       : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-transparent hover:border-gray-500'
//                   }`
//                 }
//               >
//                 <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
//                   {link.icon}
//                 </span>
//                 <span className="text-base tracking-wide">{link.label}</span>
//               </NavLink>
//             ))}
//           </div>
//         </div>

//         {/* Content Area - محیط نمایش فرم‌ها (SystemInfo, Contracts, etc.) */}
//         <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm min-h-[500px]">
//           {/* ارسال اطلاعات کاربر به صفحات فرزند */}
//           <Outlet context={{ user: selectedUser }} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserDetailLayout;
