// src/components/UserEditModal.jsx
import React, { useState, useEffect } from 'react';

function UserEditModal({ user, onSave, onClose, projects, roles }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    isAdmin: false,
    projectId: '', // برای مدیریت نقش
    roleId: ''     // برای مدیریت نقش
  });

  useEffect(() => {
    if (user) {
      const membership = user.project_memberships?.[0]; // فرض بر اولین عضویت
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        isAdmin: user.is_staff || false,
        projectId: membership?.project_id || '',
        roleId: membership?.role_id || ''
      });
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // داده‌های اصلی کاربر و داده‌های مربوط به نقش را جداگانه ارسال می‌کنیم
    const coreUserData = {
      id: user.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      isAdmin: formData.isAdmin,
    };
    const roleData = {
      userId: user.id,
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
      roleId: formData.roleId ? parseInt(formData.roleId) : null,
    };
    onSave(coreUserData, roleData);
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">ویرایش کاربر: {user.username}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>نام</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>نام خانوادگی</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>نام کاربری</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group form-check">
                <input type="checkbox" name="isAdmin" checked={formData.isAdmin} onChange={handleChange} className="form-check-input" />
                <label className="form-check-label">ادمین است؟</label>
              </div>
              <hr />
              <h5>تخصیص نقش و پروژه</h5>
              <div className="form-group">
                <label>پروژه</label>
                <select name="projectId" value={formData.projectId} onChange={handleChange} className="form-control">
                  <option value="">انتخاب پروژه</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>نقش</label>
                <select name="roleId" value={formData.roleId} onChange={handleChange} className="form-control">
                  <option value="">انتخاب نقش</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary mt-3">ذخیره تغییرات</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserEditModal;