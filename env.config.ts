export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  appName: import.meta.env.VITE_APP_NAME || 'UA Designs PMS',
  pusherKey: import.meta.env.VITE_PUSHER_KEY || '',
  pusherCluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
}
