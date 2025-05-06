import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export const useRegister = () => {
  const router = useRouter();

  const handleRegister = async (firstName: string, lastName: string, email: string, phoneNumber: string, password: string) => {
    try {

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(apiUrl + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phoneNumber, password }),
      });

      const result = await response.json();

      if (result.status) {
        const { user, access_token, refresh_token } = result.data;
        await SecureStore.setItemAsync('accessToken', access_token);
        await SecureStore.setItemAsync('refreshToken', refresh_token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));

        Alert.alert('Success', 'Welcome ' + user.firstName + '!');
        router.replace('/(app)/(tabs)/');
      } else {
        Alert.alert('Error', result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Error', 'Something went wrong!');
    }
  };

  return { handleRegister };
};
