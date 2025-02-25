// API 配置
export const API_CONFIG = {
  // 生产环境 API URL
  PROD_API_URL: 'https://web-production-11ae6.up.railway.app/api',
  
  // 开发环境 API URL
  DEV_API_URL: 'http://localhost:3001/api',
  
  // 获取当前环境的 API URL
  getApiUrl: () => {
    if (process.env.NODE_ENV === 'production') {
      return API_CONFIG.PROD_API_URL;
    }
    return API_CONFIG.DEV_API_URL;
  }
};
