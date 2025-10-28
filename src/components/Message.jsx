import React from 'react';

const Message = ({ variant = 'info', children }) => {
  const baseStyle = 'p-4 rounded-lg text-center';
  const variants = {
    info: 'bg-blue-100 text-blue-800',
    danger: 'bg-red-100 text-red-800',
  };

  return <div className={`${baseStyle} ${variants[variant]}`}>{children}</div>;
};

export default Message;
