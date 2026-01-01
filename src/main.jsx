import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import store from './store';
import App from './App';
import './index.css'
import 'leaflet/dist/leaflet.css'; // استایل‌های نقشه

// نکته مهم: React.StrictMode حذف شد تا لگ‌های نقشه در حالت Draw رفع شود
ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);