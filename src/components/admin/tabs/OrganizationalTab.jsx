// src/components/admin/tabs/OrganizationalTab.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateEmployee } from '../../../features/admin/adminSlice';

const OrganizationalTab = ({ user }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.admin.updateStatus);
  const { positions, skillLevels } = useSelector((state) => state.admin);

  const employee = user?.employee_details;

  const [formData, setFormData] = useState({
    code_meli: employee?.code_meli || '',
    father_name: employee?.father_name || '',
    age: employee?.age || '',
    position_id: employee?.position?.id || '',        // ✅ اصلاح
    skill_level_id: employee?.skill_level?.id || '',  // ✅ اصلاح
    insurance_code: employee?.insurance_code || '',
    shaba_number: employee?.shaba_number || '',
    bank_account_number: employee?.bank_account_number || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employee?.id) {
      alert('این کاربر هنوز پروفایل کارمندی ندارد!');
      return;
    }
    dispatch(updateEmployee({ employeeId: employee.id, employeeData: formData }));
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* کدملی و نام پدر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-bold">
            کدملی <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="code_meli"
            value={formData.code_meli}
            onChange={handleChange}
            required
            maxLength={10}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            placeholder="0000000000"
          />
          <p className="text-gray-500 text-xs mt-1">10 رقم بدون خط تیره</p>
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-bold">نام پدر</label>
          <input
            type="text"
            name="father_name"
            value={formData.father_name}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* سن و کد بیمه */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-bold">سن</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="18"
            max="70"
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-bold">
            کد بیمه <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="insurance_code"
            value={formData.insurance_code}
            onChange={handleChange}
            required
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* سمت و سطح مهارت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-bold">سمت سازمانی</label>
          <select
            name="position_id"
            value={formData.position_id}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- انتخاب کنید --</option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.title} ({pos.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-bold">سطح مهارت</label>
          <select
            name="skill_level_id"
            value={formData.skill_level_id}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- انتخاب کنید --</option>
            {skillLevels.map((skill) => (
              <option key={skill.id} value={skill.id}>
                سطح {skill.level_number} - {skill.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* شماره شبا */}
      <div>
        <label className="block text-gray-300 mb-2 font-bold">
          شماره شبا <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="shaba_number"
          value={formData.shaba_number}
          onChange={handleChange}
          required
          maxLength={26}
          placeholder="IR000000000000000000000000"
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
        />
        <p className="text-gray-500 text-sm mt-1">فرمت: IR + 24 رقم</p>
      </div>

      {/* شماره حساب */}
      <div>
        <label className="block text-gray-300 mb-2 font-bold">شماره حساب بانکی</label>
        <input
          type="text"
          name="bank_account_number"
          value={formData.bank_account_number}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
        />
      </div>

      {/* دکمه ذخیره */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition"
        >
          {loading ? '⏳ در حال ذخیره...' : '💾 ذخیره اطلاعات سازمانی'}
        </button>
      </div>
    </form>
  );
};

export default OrganizationalTab;
