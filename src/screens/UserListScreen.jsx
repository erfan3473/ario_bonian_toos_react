// src/screens/UserListScreen.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listUsersThunk, deleteUserThunk, updateUserByAdminThunk, updateUserRoleThunk, resetUserUpdateByAdmin } from '../features/users/userSlice';
import { listRolesThunk } from '../features/roles/roleSlice';
import { listProjectsThunk } from '../features/projects/projectListSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import UserEditModal from '../components/UserEditModal'; // ✅ ایمپورت مودال

function UserListScreen() {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // 👈 اینو اضافه کن

    // --- Local State for Modal ---
    const [editingUser, setEditingUser] = useState(null); // کاربری که در حال ویرایش است

    // --- Redux State Selectors ---
    const { loading, error, users } = useSelector((state) => state.userList);
    const { projects, loading: projectsLoading, error: projectsError } =     useSelector((state) => state.projectList);
                                     
    const { roles, loading: rolesLoading } = useSelector((state) => state.roleList);
    const { success: successDelete } = useSelector((state) => state.userDelete);
    
    // ✅ سلکتورهای مربوط به آپدیت
    const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = useSelector((state) => state.userUpdateByAdmin);

    // --- Effects ---
    useEffect(() => {
        dispatch(listUsersThunk());
        dispatch(listProjectsThunk());
        dispatch(listRolesThunk());

        if (successUpdate) {
            // وقتی آپدیت موفق بود، مودال را ببند و وضعیت را ریست کن
            setEditingUser(null);
            dispatch(resetUserUpdateByAdmin());
        }
    }, [dispatch, successDelete, successUpdate]);

    // --- Handlers ---
    const deleteHandler = (id) => {
        if (window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
            dispatch(deleteUserThunk(id));
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user); // کاربر را برای ویرایش در state قرار بده تا مودال باز شود
    };

    const handleModalClose = () => {
        setEditingUser(null); // بستن مودال
    };

    const handleSaveUser = (coreUserData, roleData) => {
        // آپدیت اطلاعات اصلی کاربر
        dispatch(updateUserByAdminThunk(coreUserData));

        // اگر پروژه و نقش انتخاب شده بود، آن را هم آپدیت کن
        if (roleData.projectId && roleData.roleId) {
            dispatch(updateUserRoleThunk(roleData));
        }
    };

    // --- Render Logic ---
    const isLoading = loading || projectsLoading || rolesLoading;

    return (
        <div>
            <h1>مدیریت کاربران</h1>
            <hr></hr>
            <h2>لیست پروژه‌ها</h2>
{projectsLoading ? (
  <Loader />
) : projectsError ? (
  <Message variant="danger">{projectsError}</Message>
) : (
  <ul className="list-group mb-3">
    {projects.map((project) => (
      <li key={project.id} className="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>{project.name}</strong> – {project.location_text || '---'} - {project.start_date}  _ {project.end_date}
        </div>
        <span className="badge bg-primary rounded-pill">
          {project.member_count} عضو
        </span>
      </li>
    ))}
  </ul>
)}

            <button
                className="btn btn-success my-3"
                onClick={() => navigate('/admin/project/create')}
                >
                ➕ افزودن پروژه
            </button>
            {loadingUpdate && <Loader />}
            {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
            {successUpdate && <Message variant="success">کاربر با موفقیت به‌روزرسانی شد.</Message>}
            {successDelete && <Message variant="success">کاربر با موفقیت حذف شد.</Message>}

            {isLoading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                
                <table className="table table-striped table-bordered table-hover">
                    
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>نام کاربری</th>
                            <th>نام</th>
                            <th>ادمین</th>
                            <th>نقش اصلی</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.first_name} {user.last_name}</td>
                                <td>{user.isAdmin ? '✔️' : '❌'}</td>
                                <td>{user.project_memberships?.[0]?.role_name || 'تعیین نشده'}</td>
                                <td>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleEditClick(user)}
                                    >
                                        ویرایش
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm mx-1"
                                        onClick={() => deleteHandler(user.id)}
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ✅ رندر کردن مودال */}
            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    onClose={handleModalClose}
                    onSave={handleSaveUser}
                    projects={projects}
                    roles={roles}
                />
            )}
        </div>
    );
}

export default UserListScreen;