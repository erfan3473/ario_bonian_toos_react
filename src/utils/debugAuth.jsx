// src/utils/debugAuth.js
export const checkAuthStatus = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  console.log('🔍 Auth Debug:');
  console.log('- UserInfo:', userInfo);
  console.log('- Token exists:', !!userInfo?.token);
  console.log('- Token value:', userInfo?.token ? `${userInfo.token.substring(0, 20)}...` : 'None');
  return userInfo;
};

// در کامپوننت استفاده کن:
// checkAuthStatus();