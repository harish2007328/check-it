import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Shadows, Radii } from '../theme/colors';

export default function FloatingBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={[styles.floatingContainer, { pointerEvents: 'box-none' }]}>
      <View style={styles.islandPill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // ─── Center Action Button (Scanner) ───────────────
          if (route.name === 'ScannerTab') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate('Scanner')}
                style={styles.centerButton}
                activeOpacity={0.88}
              >
                <View style={styles.centerButtonGlow} />
                <View style={styles.centerButtonInner}>
                  <MaterialCommunityIcons name="barcode-scan" size={24} color={Colors.white} />
                </View>
              </TouchableOpacity>
            );
          }

          // ─── Standard Nav Icons ────────────────────────────
          let iconName: keyof typeof Feather.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Rules') iconName = 'book-open';
          else if (route.name === 'Track') iconName = 'activity';
          else if (route.name === 'Profile') iconName = 'user';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  isFocused && styles.iconWrapActive,
                ]}
              >
                <Feather
                  name={iconName}
                  size={20}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  islandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.almostBlack,
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 12,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...Shadows.glassIsland,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(252, 146, 68, 0.12)',
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  centerButtonGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    opacity: 0.35,
    transform: [{ scale: 1.15 }],
  },
  centerButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.almostBlack,
    ...Shadows.glowOrange,
  },
});
