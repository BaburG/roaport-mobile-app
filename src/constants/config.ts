type Env = 'development' | 'staging' | 'production';

const ENV: Env = process.env.EXPO_PUBLIC_ENV as Env || 'development';

const CONFIG = {
  development: {
    API_BASE_URL: 'http://192.168.1.100:5000', // ⬅ local IP
  },
  staging: {
    API_BASE_URL: 'https://staging.roaport.com/api',
  },
  production: {
    API_BASE_URL: 'https://api.roaport.com',
  },
};

export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;
