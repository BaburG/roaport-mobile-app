import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SuccessAnimationProps {
  message: string;
  onAnimationComplete?: () => void;
}

export function SuccessAnimation({ message, onAnimationComplete }: SuccessAnimationProps) {
  const scaleValue = new Animated.Value(0);
  const opacityValue = new Animated.Value(0);
  
  useEffect(() => {
    console.log('Animation starting');
    
    // Start with opacity
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Delay the scale animation
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 400,
          easing: Easing.easeIn,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('Animation complete');
        // Wait longer before completing
        setTimeout(() => {
          console.log('Calling onAnimationComplete');
          onAnimationComplete?.();
        }, 2000);
      });
    }, 100);

  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityValue }]}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleValue }] }]}>
        <Ionicons name="checkmark-circle" size={120} color="#22C55E" />
      </Animated.View>
      <Text style={[styles.message, { color: '#fff' }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 32,
  },
}); 