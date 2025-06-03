import { API_URL } from '@/src/config/constants';
import { useAuth } from '@/src/context/AuthContext';

interface PushTokenResponse {
  id?: string;
  pushToken: string;
}

export function usePushTokenService() {
  const { accessToken, user, isAuthenticated, anonymousId } = useAuth();

  const registerPushToken = async (expoPushToken: string): Promise<PushTokenResponse> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}/mobile/notification`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expoPushToken, userId: isAuthenticated ? user?.id : anonymousId }),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  };

  return { registerPushToken };
} 