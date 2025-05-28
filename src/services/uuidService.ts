import * as SecureStore from 'expo-secure-store';
import uuid from 'react-native-uuid';

const STORAGE_KEY = 'anonymous_user_id';

export async function getOrCreateAnonymousId(): Promise<string> {
  let existingId = await SecureStore.getItemAsync(STORAGE_KEY);

  if (existingId) {
    return existingId;
  }

  const newId = uuid.v4() as string; // string olarak cast et
  await SecureStore.setItemAsync(STORAGE_KEY, newId);
  return newId;
}
