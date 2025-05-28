import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import SideDrawer from './SideDrawer';

export default function TopBar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}></Text>

        <View style={styles.rightActions}>
          <TouchableOpacity onPress={() => setIsDrawerOpen(true)}>
            <Feather name="menu" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logout: {
    color: '#F87171',
    fontSize: 16,
  },
});
