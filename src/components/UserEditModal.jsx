import React, { useState, useEffect } from "react";

function UserEditModal({ user, onSave, onClose, projects, roles }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    isAdmin: false,
    projectId: "",
    roleId: "",
  });

  useEffect(() => {
    if (user) {
      const membership = user.project_memberships?.[0];
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        isAdmin: user.isAdmin || false,
        projectId: membership?.project_id || "",
        roleId: membership?.role_id || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 animate-fadeIn"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">
            ویرایش کاربر: {user.username}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300">نام</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              نام خانوادگی
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              نام کاربری
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-600"
            />
            <label className="text-sm text-gray-300">ادمین است؟</label>
          </div>

          <hr className="border-gray-700" />
          <h5 className="text-gray-300 font-medium">تخصیص نقش و پروژه</h5>

          <div>
            <label className="block text-sm mb-1 text-gray-300">پروژه</label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">انتخاب پروژه</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">نقش</label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">انتخاب نقش</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200"
            >
              لغو
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserEditModal;
