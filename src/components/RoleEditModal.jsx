// src/components/RoleEditModal.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  createRoleThunk,
  updateRoleThunk,
  manageRolePermissionThunk,
  resetRoleCreate,
  resetRoleUpdate,
  resetRolePermission,
  listModelsThunk,
  fetchRolePermissionsThunk,
} from '../features/roles/roleSlice'
import Loader from './Loader'
import Message from './Message'

function RoleEditModal({ role, onClose }) {
  const dispatch = useDispatch()
  const isEdit = !!role

  // --------------------------------------------------
  // 🟢 فیلدهای نقش
  // --------------------------------------------------
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')

  // --------------------------------------------------
  // 🟢 فیلدهای permission
  // --------------------------------------------------
  const [modelName, setModelName] = useState('')
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)

  // --------------------------------------------------
  // 🟢 Selectors
  // --------------------------------------------------
  const {
    createLoading,
    updateLoading,
    permLoading,
    createError,
    updateError,
    permError,
    successCreate,
    successUpdate,
    permSuccess,
    models,
    modelsLoading,
    modelsError,
  } = useSelector((state) => state.roleList)

  const { permissions, loading: permissionsLoading, error: permissionsError } =
    useSelector((state) => state.rolePermissions)

  // --------------------------------------------------
  // 🟢 Effects
  // --------------------------------------------------
  // گرفتن مدل‌ها فقط وقتی میریم تو حالت ویرایش
  useEffect(() => {
    if (isEdit) {
      dispatch(listModelsThunk())
      dispatch(fetchRolePermissionsThunk(role.id))
    }
  }, [isEdit, dispatch, role?.id])

  // ریست و بستن بعد از ایجاد/ویرایش نقش
  useEffect(() => {
    if (successCreate || successUpdate) {
      dispatch(resetRoleCreate())
      dispatch(resetRoleUpdate())
      onClose()
    }
  }, [successCreate, successUpdate, dispatch, onClose])

  // ریست وضعیت permission بعد از موفقیت
  useEffect(() => {
    if (permSuccess) {
      dispatch(resetRolePermission())
      setModelName('')
      setCanCreate(false)
      setCanUpdate(false)
      dispatch(fetchRolePermissionsThunk(role.id)) // رفرش permissionها
    }
  }, [permSuccess, dispatch, role?.id])

  // --------------------------------------------------
  // 🟢 Handlers
  // --------------------------------------------------
  const submitHandler = (e) => {
    e.preventDefault()
    if (isEdit) {
      dispatch(updateRoleThunk({ id: role.id, roleData: { name, description } }))
    } else {
      dispatch(createRoleThunk({ name, description }))
    }
  }

  const addPermissionHandler = () => {
    if (!isEdit) return alert('ابتدا نقش را ذخیره کنید!')
    if (!modelName) return alert('مدل را انتخاب کنید!')
    dispatch(
      manageRolePermissionThunk({
        roleId: role.id,
        permissionData: {
          model_name: modelName,
          can_create: canCreate,
          can_update: canUpdate,
        },
      })
    )
  }

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose()
    }
  }

  // --------------------------------------------------
  // 🟢 Render
  // --------------------------------------------------
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="bg-white text-black rounded-lg p-6 w-1/2 relative">
        {/* دکمه ضربدر */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">
          {isEdit ? 'ویرایش نقش' : 'ایجاد نقش جدید'}
        </h2>

        {(createLoading || updateLoading || permLoading || modelsLoading) && <Loader />}
        {(createError || updateError || permError || modelsError) && (
          <Message variant="danger">
            {createError || updateError || permError || modelsError}
          </Message>
        )}

        <form onSubmit={submitHandler}>
          <div className="mb-3">
            <label className="block font-semibold">نام نقش</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control w-full border px-2 py-1"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block font-semibold">توضیحات</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control w-full border px-2 py-1"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            {isEdit ? 'ذخیره تغییرات' : 'ایجاد نقش'}
          </button>
          <button
            type="button"
            className="btn btn-secondary mx-2"
            onClick={onClose}
          >
            بستن
          </button>
        </form>

        {/* مدیریت Permissionها */}
        {isEdit && (
          <div className="mt-6">
            <h3 className="font-bold mb-2">مدیریت دسترسی‌ها</h3>

            <div className="flex items-center gap-2 mb-2">
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="border px-2 py-1 flex-grow"
              >
                <option value="">-- انتخاب مدل --</option>
                {models.map((m) => (
                  <option key={m.model_name} value={m.model_name}>
                    {m.verbose_name} ({m.model_name})
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={canCreate}
                  onChange={(e) => setCanCreate(e.target.checked)}
                />
                ایجاد
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={canUpdate}
                  onChange={(e) => setCanUpdate(e.target.checked)}
                />
                ویرایش
              </label>

              <button
                className="btn btn-success btn-sm"
                onClick={addPermissionHandler}
              >
                افزودن
              </button>
            </div>

            {permSuccess && <Message variant="success">Permission ذخیره شد</Message>}
            {permissionsLoading && <Loader />}
            {permissionsError && <Message variant="danger">{permissionsError}</Message>}

            {/* لیست فعلی permissionها */}
            {permissions.length > 0 && (
              <ul className="mt-2 border rounded p-2">
                {permissions.map((p) => (
                  <li key={`${p.model_name}`}>
                    <span className="font-semibold">{p.model_name}</span> -{' '}
                    {p.can_create ? 'ایجاد ✔' : ''} {p.can_update ? 'ویرایش ✔' : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoleEditModal
