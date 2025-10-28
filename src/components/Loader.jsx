import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
    </div>
  );
};

export default Loader;
