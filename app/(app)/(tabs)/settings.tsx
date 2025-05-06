import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext'; // 🔥 Doğru import
import { LanguageContext } from '@/src/context/LanguageContext';
import DropDownPicker from 'react-native-dropdown-picker';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { logout } = useAuth(); // AuthContext'ten sadece logout kullanıyoruz

  const { locale, setLocale } = useContext(LanguageContext);

  const [username, setUsername] = useState<string>('');

  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>(locale);
  const [items, setItems] = useState([
    {
      label: 'English',
      value: 'en',
      icon: () => (
        <Image
          source={require('@/assets/flags/en.png')}
          style={{ width: 24, height: 24 }}
        />
      ),
    },
    {
      label: 'Türkçe',
      value: 'tr',
      icon: () => (
        <Image
          source={require('@/assets/flags/tr.png')}
          style={{ width: 24, height: 24 }}
        />
      ),
    },
  ]);

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const handleChangeUsername = () => {
    Alert.alert(
      'Change Username',
      'Are you sure you want to change your username? You will need to set a new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('username');
              await logout(); // logout çağırıyoruz, çünkü kullanıcı bilgisi resetleniyor
              router.replace('/(auth)/username');
            } catch (error) {
              console.error('Error removing username:', error);
              Alert.alert('Error', 'Failed to change username');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('username');
              await logout(); // Hesap silindiğinde de logout yapıyoruz
              router.replace('/(auth)/username');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000' : '#f3f4f6' },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' },
            ]}
          >
            Current Username
          </Text>
          <Text
            style={[
              styles.username,
              { color: colorScheme === 'dark' ? '#fff' : '#1F2937' },
            ]}
          >
            {username}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.changeButton]}
            onPress={handleChangeUsername}
          >
            <Text style={styles.buttonText}>Change Username</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.buttonText, styles.deleteButtonText]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24, zIndex: 9999 }}>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            setItems={setItems}
            onChangeValue={(selectedVal) => {
              console.log('Selected dropdown value:', selectedVal);
              setLocale(selectedVal!);
            }}
            style={{
              borderColor: '#ccc',
              zIndex: 9999,
            }}
            dropDownContainerStyle={{
              borderColor: '#ccc',
              zIndex: 9999,
              elevation: 9999,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: { fontSize: 14, marginBottom: 4 },
  username: { fontSize: 24, fontWeight: 'bold' },
  buttonContainer: { marginTop: 24, gap: 12 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  changeButton: { backgroundColor: '#2563EB' },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButtonText: { color: '#DC2626' },
});
