// import React, { useEffect, useState } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { listEmploymentTypes, createEmploymentType, updateEmploymentType, deleteEmploymentType } from '../features/payroll/employmentTypeSlice'

// function EmploymentTypeListScreen() {
//   const dispatch = useDispatch()
//   const { list, loading, error } = useSelector((state) => state.employmentTypes)

//   const [form, setForm] = useState({ key: '', description: '' })
//   const [editing, setEditing] = useState(null)

//   useEffect(() => {
//     dispatch(listEmploymentTypes())
//   }, [dispatch])

//   const submitHandler = (e) => {
//     e.preventDefault()
//     if (editing) {
//       dispatch(updateEmploymentType({ id: editing, ...form }))
//       setEditing(null)
//     } else {
//       dispatch(createEmploymentType(form))
//     }
//     setForm({ key: '', description: '' })
//   }

//   const editHandler = (item) => {
//     setEditing(item.id)
//     setForm({ key: item.key, description: item.description })
//   }

//   const deleteHandler = (id) => {
//     if (window.confirm('حذف شود؟')) {
//       dispatch(deleteEmploymentType(id))
//     }
//   }

//   return (
//     <div>
//       <h1 className="text-xl font-bold mb-4 text-white">مدیریت انواع استخدام</h1>

//       {loading && <p>در حال بارگذاری...</p>}
//       {error && <p className="text-red-500">{error}</p>}

//       <form onSubmit={submitHandler} className="mb-4 space-x-2">
//         <input
//           type="text"
//           placeholder="کلید (مثلا monthly)"
//           value={form.key}
//           onChange={(e) => setForm({ ...form, key: e.target.value })}
//           className="border p-2"
//         />
//         <input
//           type="text"
//           placeholder="توضیحات"
//           value={form.description}
//           onChange={(e) => setForm({ ...form, description: e.target.value })}
//           className="border p-2"
//         />
//         <button type="submit" className="bg-blue-500 px-4 py-2 text-white rounded">
//           {editing ? 'ویرایش' : 'ایجاد'}
//         </button>
//       </form>

//       <table className="w-full border">
//         <thead>
//           <tr>
//             <th>شناسه</th>
//             <th>کلید</th>
//             <th>توضیحات</th>
//             <th>عملیات</th>
//           </tr>
//         </thead>
//         <tbody>
//           {list.map((item) => (
//             <tr key={item.id} className="border-t">
//               <td>{item.id}</td>
//               <td>{item.key}</td>
//               <td>{item.description}</td>
//               <td>
//                 <button onClick={() => editHandler(item)} className="text-yellow-500 mx-1">✏️</button>
//                 <button onClick={() => deleteHandler(item.id)} className="text-red-500 mx-1">🗑️</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// export default EmploymentTypeListScreen
