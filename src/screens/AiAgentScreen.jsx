// src/screens/AiAgentScreen.jsx
import React from 'react';
import AgentChat from '../components/AgentChat/AgentChat';

const AiAgentScreen = () => {
  return (
    <div className="p-4 sm:p-6 w-full h-full flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">دستیار هوشمند سازمانی  آریو بنیان توس</h1>
        <p className="opacity-80 text-sm">  بهت میگم هر چی می خواهی  </p>
      </div>
      
      <div className="w-full max-w-3xl">
        <AgentChat currentPage="کارتابل و تایید مراحل ماموریت" />
      </div>
    </div>
  );
};

export default AiAgentScreen;