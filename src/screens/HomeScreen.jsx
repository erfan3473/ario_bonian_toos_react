import React from 'react'
import { Link } from 'react-router-dom'

const HomeScreen = () => {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-4">سلام!</h1>
      <p className="mb-6">این صفحه تست Tailwind و React Router هست.</p>
      <Link
        to="/dashboard"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg"
      >
        برو به داشبورد
      </Link>
    </div>
  )
}

export default HomeScreen
