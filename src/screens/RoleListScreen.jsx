// src/screens/RoleListScreen.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  listRolesThunk,
  deleteRoleThunk,
  resetRoleCreate,
  resetRoleUpdate,
  resetRoleDelete,
  fetchRolePermissionsThunk,
} from '../features/roles/roleSlice'

// Components
import Loader from '../components/Loader'
import Message from '../components/Message'
import RoleEditModal from '../components/RoleEditModal'

// UI Kit
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Text from '../components/ui/Text' // << ایمپورت کامپوننت Text

function RoleListScreen() {
  const dispatch = useDispatch()
  const [editingRole, setEditingRole] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [expandedPermissions, setExpandedPermissions] = useState({})

  const { roles, loading, error, successCreate, successUpdate, successDelete } =
    useSelector((state) => state.roleList)

  const {
    permissions: allPermissions,
    loading: permLoading,
    error: permError,
  } = useSelector((state) => state.rolePermissions)

  // Fetch roles list
  useEffect(() => {
    dispatch(listRolesThunk())
    return () => {
      dispatch(resetRoleCreate())
      dispatch(resetRoleUpdate())
      dispatch(resetRoleDelete())
    }
  }, [dispatch, successCreate, successUpdate, successDelete])

  // Fetch permissions for expanded roles
  useEffect(() => {
    Object.entries(expandedPermissions).forEach(([roleId, isOpen]) => {
      if (isOpen && !allPermissions[roleId]) { // فقط اگر داده‌ها موجود نیستند، fetch کن
        dispatch(fetchRolePermissionsThunk(roleId))
      }
    })
  }, [expandedPermissions, dispatch])

  const togglePermissions = (roleId) => {
    setExpandedPermissions((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }))
  }

  const deleteHandler = (id) => {
    if (window.confirm('آیا از حذف این نقش مطمئن هستید؟')) {
      dispatch(deleteRoleThunk(id))
    }
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Text as="h1" size="2xl" weight="bold">
            مدیریت نقش‌ها
          </Text>
          <Button variant="success" onClick={() => setCreatingNew(true)}>
            ایجاد نقش جدید
          </Button>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <Table headers={['ID', 'نام نقش', 'توضیحات', 'دسترسی‌ها', 'عملیات']}>
            {roles.map((role) => (
              <React.Fragment key={role.id}>
                <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <Text>{role.id}</Text>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <Text weight="medium">{role.name}</Text>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <Text color="secondary">{role.description || '---'}</Text>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => togglePermissions(role.id)}
                    >
                      {expandedPermissions[role.id] ? 'بستن' : 'نمایش'} دسترسی‌ها
                    </Button>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 space-x-2 space-x-reverse">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteHandler(role.id)}
                    >
                      حذف
                    </Button>
                  </td>
                </tr>

                {expandedPermissions[role.id] && (
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td
                      colSpan="5"
                      className="p-3 border border-gray-200 dark:border-gray-700"
                    >
                      {permLoading ? (
                        <Loader />
                      ) : permError ? (
                        <Message variant="danger">{permError}</Message>
                      ) : (
                        <div>
                          <Text weight="semibold" className="mb-2">
                            لیست دسترسی‌ها:
                          </Text>
                          <ul className="space-y-1 list-disc list-inside">
                            {allPermissions && allPermissions.length > 0 ? (
                              allPermissions.map((p, idx) => (
                                <li key={idx}>
                                  <Text as="span">
                                    <Text as="span" weight="bold">
                                      {p.model_name}
                                    </Text>
                                    {' – '}
                                    {p.can_create && 'ایجاد ✔ '}{' '}
                                    {p.can_update && 'ویرایش ✔'}
                                  </Text>
                                </li>
                              ))
                            ) : (
                              <Text color="secondary">
                                این نقش هیچ دسترسی ندارد.
                              </Text>
                            )}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </Table>
        )}
      </Card>

      {editingRole && (
        <RoleEditModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}
      {creatingNew && (
        <RoleEditModal role={null} onClose={() => setCreatingNew(false)} />
      )}
    </div>
  )
}

export default RoleListScreen