import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

const SkillLevelsSettings = () => {
  const { skillLevels = [] } = useSelector((state) => state.admin.dropdowns || {});
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const sortedSkillLevels = useMemo(() => {
    return [...skillLevels].sort((a, b) => a.level_number - b.level_number);
  }, [skillLevels]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-dashed border-gray-500/30">
        <h3 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>⭐ سطوح مهارت</h3>
        <div className={`text-sm font-bold px-3 py-1 rounded-md border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
          {sortedSkillLevels.length} سطح
        </div>
      </div>

      {/* Skill Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedSkillLevels.map((skill) => (
          <div
            key={skill.id}
            className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg ${
              isDark ? 'bg-gray-800 border-gray-700 hover:border-yellow-600 shadow-sm' : 'bg-white border-gray-200 hover:border-yellow-400 shadow-md'
            }`}
          >
            {/* Level Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-md border border-white/20">
                  {skill.level_number}
                </div>
                <div>
                  <h4 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {skill.title}
                  </h4>
                  <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    سطح {skill.level_number}
                  </p>
                </div>
              </div>

              {/* Multiplier Badge */}
              <div className={`rounded-xl px-4 py-2 border shadow-sm text-center ${
                isDark ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'
              }`}>
                <div className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  ×{skill.wage_multiplier}
                </div>
                <div className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ضریب دستمزد</div>
              </div>
            </div>

            {/* Description */}
            {skill.description && (
              <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {skill.description}
                </p>
              </div>
            )}

            {/* Visual Bar */}
            <div className="mt-5">
              <div className={`w-full rounded-full h-2.5 overflow-hidden border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'}`}>
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${(skill.wage_multiplier / 1.5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className={`rounded-xl p-6 border flex items-start gap-3 shadow-sm ${isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
        <span className="text-xl mt-0.5 opacity-80">ℹ️</span>
        <div>
          <h4 className={`font-black mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>راهنما</h4>
          <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-blue-200' : 'text-blue-900/80'}`}>
            سطح مهارت کارگران نشان‌دهنده تجربه و تخصص آنهاست. این اطلاعات برای دسته‌بندی، محاسبه ضرایب پرداختی و گزارش‌گیری استفاده می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkillLevelsSettings;