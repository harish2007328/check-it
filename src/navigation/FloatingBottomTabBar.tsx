import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

// ─── Geometry constants ──────────────────────────────────────
const BTN_DIAMETER = 64;
const BTN_R = BTN_DIAMETER / 2;  // 32
const BTN_LIFT = 4;               // button centre 4px above bar top

/**
 * The notch is drawn with 4 chained quadratic Béziers:
 *
 *   Q1 (left shoulder):  flat bar → gently rounded corner → side wall entry
 *   Q2 (left arc):       side wall entry → circular sweep → notch floor
 *   Q3 (right arc):      notch floor → circular sweep → side wall exit     (mirror)
 *   Q4 (right shoulder): side wall exit → gently rounded corner → flat bar (mirror)
 *
 * Q1 control stays at y=0 → horizontal departure from the bar, no kink.
 * Q2 control is at the floor depth → pulls the arc down to wrap the button.
 */
const SW = 90;
const Q1C_X = 54;
const MX = 38;
const MY = 22;  // pushed down
const Q2C_X = 22;
const FLOOR = 42;  // pushed down
// ────────────────────────────────────────────────────────────

interface TabItemProps {
  route: any;
  isFocused: boolean;
  onPress: () => void;
}

function CustomTabItem({ route, isFocused, onPress }: TabItemProps) {
  const color = isFocused ? Colors.primary : '#9CA3AF';

  const renderIcon = () => {
    switch (route.name) {
      case 'Home':
        return <Feather name="home" size={22} color={color} />;
      case 'Rules':
        return (
          <Ionicons
            name={isFocused ? 'reader' : 'reader-outline'}
            size={22}
            color={color}
          />
        );
      case 'Track':
        return (
          <Ionicons
            name={isFocused ? 'pulse' : 'pulse-outline'}
            size={22}
            color={color}
          />
        );
      case 'Profile':
        return (
          <Ionicons
            name={isFocused ? 'person' : 'person-outline'}
            size={22}
            color={color}
          />
        );
      default:
        return <Feather name="circle" size={22} color={color} />;
    }
  };

  const labelMap: Record<string, string> = {
    Home: 'Home',
    Rules: 'Rules',
    Track: 'Track',
    Profile: 'Profile',
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
      <View style={styles.tabItemContent}>
        {renderIcon()}
        <Text
          style={[
            styles.tabLabel,
            isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {labelMap[route.name] ?? route.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function FloatingBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [layoutWidth, setLayoutWidth] = useState(Dimensions.get('window').width);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setLayoutWidth(width);
  };

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12);
  const barHeight = 68 + bottomPadding;
  const cx = layoutWidth / 2;

  /**
   * Two symmetric cubic Beziers create a smooth U-shaped notch.
   *
   * Left side:  from (cx−NW, 0) → control1 (cx−NW+CTRL_X_IN, 0)
   *                              → control2 (cx−CTRL_X_IN,    DEPTH)
   *                              → end      (cx,               DEPTH)
   *
   * Right side: mirror of the above.
   *
   * Because control1 is always on y=0 (the flat bar line), the curve
   * departs the bar perfectly horizontally — no shoulder kink at all.
   * The curve then smoothly sweeps down to the notch floor at DEPTH.
   */
  /**
   * 4-Q bezier notch algorithm:
   *
   *  Q1 shoulder:  (cx-72, 0) → ctrl(cx-58, 0) → (cx-44, 8)
   *  Q2 bottom:    (cx-44, 8) → ctrl(cx-18, 28) → (cx,    28)
   *  Q3 bottom:    (cx,   28) → ctrl(cx+18, 28) → (cx+44,  8)  [mirror]
   *  Q4 shoulder:  (cx+44, 8) → ctrl(cx+58, 0) → (cx+72,  0)  [mirror]
   *
   * Q1/Q4 control on y=0 → perfectly horizontal departure from flat bar.
   * Q2/Q3 control at floor depth → smooth circular sweep that hugs the button.
   */
  const d = [
    `M 0 0`,
    `L ${cx - SW} 0`,
    `Q ${cx - Q1C_X} 0, ${cx - MX} ${MY}`,           // left shoulder
    `Q ${cx - Q2C_X} ${FLOOR}, ${cx} ${FLOOR}`,       // left bottom arc
    `Q ${cx + Q2C_X} ${FLOOR}, ${cx + MX} ${MY}`,     // right bottom arc
    `Q ${cx + Q1C_X} 0, ${cx + SW} 0`,                // right shoulder
    `L ${layoutWidth} 0`,
    `L ${layoutWidth} ${barHeight}`,
    `L 0 ${barHeight}`,
    `Z`,
  ].join(' ');

  // Button: centre is BTN_LIFT px above bar top
  const btnTop = -(BTN_LIFT + BTN_R);  // = -(16+32) = -48

  return (
    <View
      style={styles.dockedWrapper}
      onLayout={onContainerLayout}
      pointerEvents="box-none"
    >
      <View style={[styles.barContainer, { height: barHeight }]}>
        {/* Smooth U-shaped cutout */}
        <Svg width={layoutWidth} height={barHeight} style={StyleSheet.absoluteFill}>
          <Path
            d={d}
            fill="#111118"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
          />
        </Svg>

        {/* Perfectly centred floating scan button */}
        <View
          style={[
            styles.centerButtonWrapper,
            { left: cx - BTN_R, top: btnTop },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.85}
            style={styles.centerButtonSolid}
          >
            <MaterialCommunityIcons name="barcode-scan" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tab row */}
        <View style={[styles.tabsRow, { paddingBottom: bottomPadding }]}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const isScanner = route.name === 'ScannerTab';

            if (isScanner) {
              // Transparent space for the notch area
              return <View key={route.key} style={styles.tabItemPlaceholder} />;
            }

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

            return (
              <CustomTabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockedWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 999,
    overflow: 'visible',
  },
  barContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabItemPlaceholder: {
    flex: 1.4,
    height: '100%',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Scan Button ──────────────────────────────────────────
  centerButtonWrapper: {
    position: 'absolute',
    width: BTN_DIAMETER,
    height: BTN_DIAMETER,
    zIndex: 10,
  },
  centerButtonSolid: {
    width: BTN_DIAMETER,
    height: BTN_DIAMETER,
    borderRadius: BTN_R,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
