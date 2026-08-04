import React from 'react';
import { 
    FaClock, FaCheckCircle, FaArrowLeft, FaTimesCircle, 
    FaUser, FaFileImage, FaFileAudio, FaFileVideo, FaFile 
} from 'react-icons/fa';



export const STATUS_COLORS = {
    PENDING:     'bg-yellow-500/20 text-yellow-600 border-yellow-500/50',
    IN_PROGRESS: 'bg-blue-500/20  text-blue-400  border-blue-500/50',
    DONE:        'bg-green-500/20  text-green-400  border-green-500/50',
    REJECTED:    'bg-red-500/20    text-red-400    border-red-500/50',
    CANCELLED:   'bg-zinc-500/20   text-zinc-400   border-zinc-500/40',
};


export const STATUS_LABELS = {
    PENDING: 'در انتظار',
    IN_PROGRESS: 'در جریان',
    DONE: 'انجام شده',
    REJECTED: 'رد شده',
    CANCELLED: 'لغو شده',
};

export const STEP_STATE_CONFIG = {
    PENDING:            { label: 'در انتظار',   color: 'text-yellow-400', icon: <FaClock /> },
    APPROVED:           { label: 'تایید شد',    color: 'text-green-400',  icon: <FaCheckCircle /> },
    REJECTED_FORWARDED: { label: 'رد و ارجاع',  color: 'text-orange-400', icon: <FaArrowLeft /> },
    REJECTED:           { label: 'رد شد',       color: 'text-red-400',    icon: <FaTimesCircle /> },
    FORWARDED:          { label: 'ارجاع شد',    color: 'text-blue-400',   icon: <FaArrowLeft /> },
    COMPLETED:          { label: 'خاتمه',       color: 'text-zinc-400',   icon: <FaCheckCircle /> },
    SKIPPED:          { label: 'عبور مرحله',       color: 'text-zinc-400',   icon: <FaCheckCircle /> },
};

export const URGENCY_LABELS = {
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  CRITICAL: 'بحرانی',
};

export const URGENCY_COLORS = {
    LOW:      'bg-zinc-500/15  text-zinc-300    border-zinc-500/40',
    MEDIUM:   'bg-blue-500/20  text-blue-400    border-blue-500/50',
    HIGH:     'bg-orange-400/25 text-orange-500 border-orange-500/55',
    CRITICAL: 'bg-red-500/25   text-red-400     border-red-500/55',
};

export const ACTION_LABELS = {
    CREATE: 'ایجاد کرد',
    FORWARD: 'ارجاع داد',
    APPROVE: 'تایید کرد',
    REJECT: 'رد کرد',
    COMPLETE: 'خاتمه داد',
    COMMENT: 'یادداشت گذاشت',
    RETURNED: 'برگشت مامور اجرا',
    INTERMEDIATE_APPROVE: 'تایید ناظر صورت گرفت',
    INTERMEDIATE_REJECT: 'تایید ناظر صورت گرفت',
    EDIT: 'ویرایش ماموریت انجام شده است',
    IN_PROGRESS: 'شروع عملیات',
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
