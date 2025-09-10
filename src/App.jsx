// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import AuthScreen from './screens/AuthScreen';
import UserListScreen from './screens/UserListScreen'; // ✅ اضافه شد

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto p-4">
        <Routes>
          
          <Route path="/" element={<HomeScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/dashboard" element={<WorkerDashboardScreen />} />
        
          <Route path="/admin/users" element={<UserListScreen />} /> {/* ✅ مسیر جدید */}
        </Routes>
      </main>

      <footer className="bg-gray-800 p-4 text-center text-gray-500 mt-auto">
        &copy; {new Date().getFullYear()} - سامانه مدیریت کارگران
      </footer>
    </div>
  );
}

export default App;
