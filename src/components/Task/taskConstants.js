import React from 'react';
import { 
    FaClock, FaCheckCircle, FaArrowLeft, FaTimesCircle, 
    FaUser, FaFileImage, FaFileAudio, FaFileVideo, FaFile 
} from 'react-icons/fa';

export const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'تکمیل فرم حقوق',
    PURCHASE: 'خرید/تدارکات',
    REPORT: 'گزارش‌دهی',
};

export const STATUS_COLORS = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    DONE: 'bg-green-500/10 text-green-500 border-green-500/30',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30',
    CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

export const STATUS_LABELS = {
    PENDING: 'در انتظار',
    IN_PROGRESS: 'در جریان',
    DONE: 'انجام شده',
    REJECTED: 'رد شده',
    CANCELLED: 'لغو شده',
};

export const STEP_STATE_CONFIG = {
    PENDING: { label: 'در انتظار', color: 'text-yellow-500', icon: <FaClock /> },
    APPROVED: { label: 'تایید شد', color: 'text-green-500', icon: <FaCheckCircle /> },
    REJECTED_FORWARDED: { label: 'رد و ارجاع', color: 'text-orange-500', icon: <FaArrowLeft /> },
    REJECTED: { label: 'رد شد', color: 'text-red-500', icon: <FaTimesCircle /> },
    FORWARDED: { label: 'ارجاع شد', color: 'text-blue-500', icon: <FaArrowLeft /> },
    COMPLETED: { label: 'خاتمه', color: 'text-gray-500', icon: <FaCheckCircle /> },
};

export const URGENCY_LABELS = {
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  CRITICAL: 'بحرانی',
};

export const URGENCY_COLORS = {
  LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  MEDIUM: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export const ACTION_LABELS = {
    CREATE: 'ایجاد کرد',
    FORWARD: 'ارجاع داد',
    APPROVE: 'تایید کرد',
    REJECT: 'رد کرد',
    COMPLETE: 'خاتمه داد',
    COMMENT: 'یادداشت گذاشت',
};

export const FILE_ICONS = {
    IMAGE: <FaFileImage className="text-blue-500" />,
    AUDIO: <FaFileAudio className="text-purple-500" />,
    VIDEO: <FaFileVideo className="text-pink-500" />,
    FILE: <FaFile className="text-gray-500" />,
};

export const stepDotColor = (state, isDark) => {
    if (state === 'PENDING') return isDark ? 'border-yellow-400 bg-slate-800' : 'border-yellow-500 bg-white';
    if (state === 'APPROVED') return 'border-green-500 bg-green-500';
    if (state === 'REJECTED' || state === 'REJECTED_FORWARDED') return 'border-red-500 bg-red-500';
    return isDark ? 'border-slate-600 bg-slate-600' : 'border-gray-300 bg-gray-300';
};
