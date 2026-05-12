import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

export const authAPI = {
  verifyGoogleToken: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/google`, { token });
      return response.data;
    } catch (error) {
      console.error('Auth verification failed:', error);
      throw error;
    }
  }
};

export const setAuthSession = (sessionData) => {
  if (sessionData) {
    localStorage.setItem('annotation_user', JSON.stringify(sessionData.user));
    localStorage.setItem('annotation_token', sessionData.token);
  } else {
    localStorage.removeItem('annotation_user');
    localStorage.removeItem('annotation_token');
  }
};

export const getAuthSession = () => {
  const userStr = localStorage.getItem('annotation_user');
  const token = localStorage.getItem('annotation_token');
  
  if (userStr && token) {
    try {
      return { user: JSON.parse(userStr), token };
    } catch (e) {
      return null;
    }
  }
  return null;
};
