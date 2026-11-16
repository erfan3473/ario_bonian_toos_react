// src/components/NotificationDialog.jsx
import React from 'react';

const NotificationDialog = ({
  notifications,
  isDark,
  onOpenTarget,
  onDismissCurrent,
  onDismissAll,
}) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return null;

  const current = notifications[0];
  const remainingCount = notifications.length;

  const isChat =
    current.notif_type === 'CHAT_MESSAGE' || current.model === 'chat';
  const isTask =
    (current.notif_type && current.notif_type.startsWith('TASK_')) ||
    current.model === 'task';
  const isRoutine =
    (current.notif_type === 'SYSTEM_MESSAGE' &&
      (current.extra_data?.event === 'TIME_BASED_ROUTINE_REMINDER' ||
        current.extra_data?.event === 'INCOMPLETE_ROUTINE_CHECKOUT_WARNING')) ||
    current.model === 'routineinstance';

  const theme = isChat
    ? {
        icon: 'fa-comments',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        titleColor: 'text-emerald-400',
        btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        defaultTitle: 'پیام جدید',
        actionLabel: 'مشاهده پیام',
      }
    : isTask
    ? {
        icon: 'fa-clipboard-check',
        badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        titleColor: 'text-blue-400',
        btnBg: 'bg-blue-600 hover:bg-blue-500 text-white',
        defaultTitle: 'ماموریت جدید',
        actionLabel: 'مشاهده ماموریت',
      }
    : isRoutine
    ? {
        icon: 'fa-clock',
        badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        titleColor: 'text-orange-400',
        btnBg: 'bg-orange-600 hover:bg-orange-500 text-white',
        defaultTitle: 'یادآوری روتین',
        actionLabel: 'انجام روتین',
      }
    : {
        icon: 'fa-bell',
        badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        titleColor: 'text-purple-400',
        btnBg: 'bg-purple-600 hover:bg-purple-500 text-white',
        defaultTitle: 'اعلان سیستم',
        actionLabel: 'مشاهده',
      };

  const timeStr = current.created_at
    ? new Date(current.created_at).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#1e1f20] border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-gray-800 bg-[#25262b]' : 'border-gray-100 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${theme.badgeBg}`}
            >
              <i className={`fas ${theme.icon}`}></i>
            </div>
            <div className="min-w-0">
              <h3 className={`font-extrabold text-base truncate ${theme.titleColor}`}>
                {current.title || theme.defaultTitle}
              </h3>
              {timeStr && (
                <span className="text-[11px] text-gray-400 font-mono">
                  ساعت {timeStr}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {remainingCount > 1 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                +{remainingCount - 1} اعلان دیگر
              </span>
            )}
            <button
              type="button"
              onClick={onDismissCurrent}
              className="w-8 h-8 rounded-full hover:bg-gray-700/40 text-gray-400 hover:text-white flex items-center justify-center transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <p
            className={`text-sm leading-7 whitespace-pre-wrap ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}
          >
            {current.body || 'شما یک اعلان جدید دارید.'}
          </p>
        </div>

        <div
          className={`px-5 py-3.5 border-t flex items-center gap-2.5 ${
            isDark ? 'border-gray-800 bg-[#18191a]' : 'border-gray-100 bg-gray-50'
          }`}
        >
          <button
            type="button"
            onClick={() => onOpenTarget(current)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md ${theme.btnBg}`}
          >
            <i className="fas fa-external-link-alt text-xs"></i>
            <span>{theme.actionLabel}</span>
          </button>

          <button
            type="button"
            onClick={onDismissCurrent}
            className={`py-2.5 px-4 rounded-xl text-sm font-bold transition ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            بستن
          </button>

          {remainingCount > 1 && (
            <button
              type="button"
              onClick={onDismissAll}
              title="بستن همه اعلان‌ها"
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-400 transition"
            >
              بستن همه
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDialog;