import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radii, Shadows } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  dark?: boolean;
}

export default function GlassCard({
  children,
  style,
  intensity = 30,
  tint,
  dark = false,
}: GlassCardProps) {
  const chosenTint = tint || (dark ? 'dark' : 'light');

  return (
    <View
      style={[
        styles.outerContainer,
        dark ? styles.darkContainer : styles.lightContainer,
        dark ? Shadows.glassIsland : Shadows.soft,
        style,
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'web' ? 0 : intensity}
        tint={chosenTint}
        style={styles.blur}
      >
        <View
          style={[
            styles.innerContent,
            dark ? styles.darkOverlay : styles.lightOverlay,
          ]}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  lightContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: Colors.glassBorder,
  },
  darkContainer: {
    backgroundColor: Colors.darkGlass,
    borderColor: Colors.glassBorderDark,
  },
  blur: {
    width: '100%',
    height: '100%',
  },
  innerContent: {
    padding: 16,
  },
  lightOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  darkOverlay: {
    backgroundColor: 'rgba(13, 13, 18, 0.65)',
  },
});
