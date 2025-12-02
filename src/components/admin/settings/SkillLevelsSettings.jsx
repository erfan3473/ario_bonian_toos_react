// src/components/admin/settings/SkillLevelsSettings.jsx

import React from 'react';
import { useSelector } from 'react-redux';

const SkillLevelsSettings = () => {
  const { skillLevels } = useSelector((state) => state.admin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-xl">⭐ سطوح مهارت</h3>
        <div className="text-gray-400 text-sm">
          {skillLevels.length} سطح
        </div>
      </div>

      {/* Skill Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skillLevels
          .sort((a, b) => a.level_number - b.level_number)
          .map((skill) => (
            <div
              key={skill.id}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-600 transition-all"
            >
              {/* Level Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                    {skill.level_number}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      {skill.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      سطح {skill.level_number}
                    </p>
                  </div>
                </div>

                {/* Multiplier Badge */}
                <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
                  <div className="text-green-400 text-2xl font-bold">
                    ×{skill.wage_multiplier}
                  </div>
                  <div className="text-gray-400 text-xs">ضریب دستمزد</div>
                </div>
              </div>

              {/* Description */}
              {skill.description && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {skill.description}
                  </p>
                </div>
              )}

              {/* Visual Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${(skill.wage_multiplier / 1.5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
        <h4 className="text-blue-400 font-bold mb-2">ℹ️ راهنما</h4>
        <p className="text-gray-300 text-sm">
          سطح مهارت کارگران تأثیر مستقیم بر ضریب دستمزد آنها دارد. 
          هرچه سطح مهارت بالاتر باشد، ضریب بیشتری اعمال می‌شود.
        </p>
      </div>
    </div>
  );
};

export default SkillLevelsSettings;
