// src/screens/UserListScreen.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { listUsersThunk, deleteUserThunk, updateUserRoleThunk, listRolesThunk } from '../features/users/userSlice'
import { listProjectsThunk } from '../features/projects/projectSlice'
import Loader from '../components/Loader'
import Message from '../components/Message'

function UserListScreen() {
  const dispatch = useDispatch()

  // --- Local State for Managing Selections ---
  const [selections, setSelections] = useState({}) // e.g., { userId: { projectId, roleId } }

  // --- Redux State Selectors ---
  const { loading, error, users } = useSelector((state) => state.userList)
  const { projects, loading: projectsLoading } = useSelector((state) => state.projectList)
  const { roles, loading: rolesLoading } = useSelector((state) => state.roleList)
  const { success: successDelete } = useSelector((state) => state.userDelete)
  const { loading: roleLoading, success: roleSuccess, error: roleError } = useSelector((state) => state.userRole)

  // --- Effects ---
  useEffect(() => {
    // Fetch initial data
    dispatch(listUsersThunk())
    dispatch(listProjectsThunk())
    dispatch(listRolesThunk())
  }, [dispatch, successDelete, roleSuccess])

  useEffect(() => {
    // Initialize local selections state when users data is loaded
    if (users.length > 0) {
      const initialSelections = {}
      users.forEach(user => {
        // For simplicity, we manage the first membership. UI can be extended for multiple memberships.
        const membership = user.project_memberships?.[0]
        initialSelections[user.id] = {
          projectId: membership?.project_id || '',
          roleId: membership?.role_id || '',
        }
      })
      setSelections(initialSelections)
    }
  }, [users])

  // --- Handlers ---
  const deleteHandler = (id) => {
    if (window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
      dispatch(deleteUserThunk(id))
    }
  }

  const handleSelectionChange = (userId, field, value) => {
    setSelections(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }))
  }

  const handleSaveMembership = (userId) => {
    const { projectId, roleId } = selections[userId]
    if (projectId && roleId) {
      dispatch(updateUserRoleThunk({ userId, projectId: parseInt(projectId), roleId: parseInt(roleId) }))
    } else {
      alert('لطفاً هم پروژه و هم نقش را انتخاب کنید.')
    }
  }

  // --- Render Logic ---
  const isLoading = loading || projectsLoading || rolesLoading

  return (
    <div>
      <h1>مدیریت کاربران</h1>
      {roleLoading && <Loader />}
      {roleError && <Message variant="danger">{roleError}</Message>}
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
              <th>پروژه</th>
              <th>نقش</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
                const userSelection = selections[user.id] || { projectId: '', roleId: '' };
                const originalMembership = user.project_memberships?.[0];
                const hasChanged = originalMembership?.project_id !== parseInt(userSelection.projectId) || originalMembership?.role_id !== parseInt(userSelection.roleId);

                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>
                      <select
                        className="form-control"
                        value={userSelection.projectId}
                        onChange={(e) => handleSelectionChange(user.id, 'projectId', e.target.value)}
                      >
                        <option value="">انتخاب پروژه</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={userSelection.roleId}
                        onChange={(e) => handleSelectionChange(user.id, 'roleId', e.target.value)}
                      >
                        <option value="">انتخاب نقش</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveMembership(user.id)}
                        disabled={!hasChanged || roleLoading}
                      >
                        ذخیره
                      </button>
                      <button
                        className="btn btn-danger btn-sm mx-1"
                        onClick={() => deleteHandler(user.id)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default UserListScreen