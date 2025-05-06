import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext'; // 👈 ekliyoruz
import { useRouter } from 'expo-router';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const translateX = useSharedValue(width);
  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(-width + (width), { duration: 300 });
    } else {
      translateX.value = withTiming(-width, { duration: 300 });
    }
  }, [isOpen]);

  const animatedStyles = useAnimatedStyle(() => ({
    right: translateX.value,
  }));

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace('/login');
  };

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}
      <Animated.View style={[styles.drawer, animatedStyles]}>
        <SafeAreaView style={styles.drawerContent}>
          <View style={{ padding: 20 }}>
            {isAuthenticated && user ? (
              <>
                <Text style={styles.welcome}>Welcome, {user.firstName}!</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
                  <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => { onClose(); router.push('/login'); }} style={styles.menuItem}>
                  <Text style={styles.menuText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { onClose(); router.push('/register'); }} style={styles.menuItem}>
                  <Text style={styles.menuText}>Register</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1,
    },
    drawer: {
        position: 'absolute',
        top: 92,
        right: 0,
        bottom: 0,
        width: width * 0.7,
        backgroundColor: '#fff',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
  drawerContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  menuItem: {
    marginVertical: 12,
  },
  menuText: {
    fontSize: 18,
    color: '#1F2937',
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937',
  },
  logout: {
    fontSize: 18,
    color: '#EF4444',
  },
});
