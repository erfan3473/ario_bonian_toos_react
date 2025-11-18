// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   listUsersThunk,
//   deleteUserThunk,
//   updateUserByAdminThunk,
//   updateUserRoleThunk,
//   resetUserUpdateByAdmin,
// } from "../features/users/userSlice";
// import { listRolesThunk } from "../features/roles/roleSlice";
// import { listProjectsThunk } from "../features/projects/projectListSlice";
// import Loader from "../components/Loader";
// import Message from "../components/Message";
// import UserEditModal from "../components/UserEditModal";

// function UserListScreen() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [editingUser, setEditingUser] = useState(null);

//   const { loading, error, users } = useSelector((state) => state.userList);
//   const {
//     projects,
//     loading: projectsLoading,
//     error: projectsError,
//   } = useSelector((state) => state.projectList);
//   const { roles, loading: rolesLoading } = useSelector(
//     (state) => state.roleList
//   );
//   const { success: successDelete } = useSelector((state) => state.userDelete);
//   const {
//     loading: loadingUpdate,
//     error: errorUpdate,
//     success: successUpdate,
//   } = useSelector((state) => state.userUpdateByAdmin);

//   useEffect(() => {
//     dispatch(listUsersThunk());
//     dispatch(listProjectsThunk());
//     dispatch(listRolesThunk());

//     if (successUpdate) {
//       setEditingUser(null);
//       dispatch(resetUserUpdateByAdmin());
//     }
//   }, [dispatch, successDelete, successUpdate]);

//   const deleteHandler = (id) => {
//     if (window.confirm("آیا از حذف این کاربر مطمئن هستید؟")) {
//       dispatch(deleteUserThunk(id));
//     }
//   };

//   const handleEditClick = (user) => setEditingUser(user);
//   const handleModalClose = () => setEditingUser(null);

//   const handleSaveUser = (coreUserData, roleData) => {
//     dispatch(updateUserByAdminThunk(coreUserData));
//     if (roleData.projectId && roleData.roleId) {
//       dispatch(updateUserRoleThunk(roleData));
//     }
//   };

//   const isLoading = loading || projectsLoading || rolesLoading;

//   return (
//     <div className="min-h-screen bg-gray-900 text-gray-100 px-6 py-8">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-100">مدیریت کاربران</h1>
//           <hr className="border-gray-700 my-2" />
//           <h2 className="text-lg text-gray-400">لیست پروژه‌ها</h2>
//         </div>
//         <button
//           onClick={() => navigate("/admin/project/create")}
//           className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2 rounded-lg shadow"
//         >
//           ➕ افزودن پروژه
//         </button>
//       </div>

//       {/* Projects */}
//       {projectsLoading ? (
//         <Loader />
//       ) : projectsError ? (
//         <Message variant="danger">{projectsError}</Message>
//       ) : (
//         <ul className="space-y-3 mb-8">
//           {projects.map((project) => (
//             <li
//               key={project.id}
//               className="flex justify-between items-center bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
//             >
//               <div>
//                 <strong className="text-gray-100">{project.name}</strong>{" "}
//                 <span className="text-gray-400">
//                   – {project.location_text || "---"} - {project.start_date} _{" "}
//                   {project.end_date}
//                 </span>
//               </div>
//               <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
//                 {project.member_count} عضو
//               </span>
//             </li>
//           ))}
//         </ul>
//       )}

//       {/* Alerts */}
//       {loadingUpdate && <Loader />}
//       {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
//       {successUpdate && (
//         <Message variant="success">کاربر با موفقیت به‌روزرسانی شد.</Message>
//       )}
//       {successDelete && (
//         <Message variant="success">کاربر با موفقیت حذف شد.</Message>
//       )}

//       {/* Users Table */}
//       {isLoading ? (
//         <Loader />
//       ) : error ? (
//         <Message variant="danger">{error}</Message>
//       ) : (
//         <div className="overflow-x-auto rounded-lg shadow border border-gray-700">
//           <table className="min-w-full divide-y divide-gray-700">
//             <thead className="bg-gray-800">
//               <tr>
//                 {["ID", "نام کاربری", "نام", "ادمین", "نقش اصلی", "عملیات"].map(
//                   (th) => (
//                     <th
//                       key={th}
//                       className="px-4 py-3 text-right text-sm font-medium text-gray-300"
//                     >
//                       {th}
//                     </th>
//                   )
//                 )}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-800 bg-gray-900">
//               {users.map((user) => (
//                 <tr
//                   key={user.id}
//                   className="hover:bg-gray-800 transition-colors"
//                 >
//                   <td className="px-4 py-3">{user.id}</td>
//                   <td className="px-4 py-3">{user.username}</td>
//                   <td className="px-4 py-3">
//                     {user.first_name} {user.last_name}
//                   </td>
//                   <td className="px-4 py-3">
//                     {user.isAdmin ? "✔️" : "❌"}
//                   </td>
//                   <td className="px-4 py-3">
//                     {user.project_memberships?.[0]?.role_name || "تعیین نشده"}
//                   </td>
//                   <td className="px-4 py-3 space-x-2 space-x-reverse">
//                     <button
//                       onClick={() => handleEditClick(user)}
//                       className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-lg"
//                     >
//                       ویرایش
//                     </button>
//                     <button
//                       onClick={() => deleteHandler(user.id)}
//                       className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-lg"
//                     >
//                       حذف
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Modal */}
//       {editingUser && (
//         <UserEditModal
//           user={editingUser}
//           onClose={handleModalClose}
//           onSave={handleSaveUser}
//           projects={projects}
//           roles={roles}
//         />
//       )}
//     </div>
//   );
// }

// export default UserListScreen;
