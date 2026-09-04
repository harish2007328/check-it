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
import Svg, {
  Path,
  Defs,
  Filter,
  FeGaussianBlur,
  FeOffset,
  FeMerge,
  FeMergeNode,
} from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

// ─── Geometry constants ──────────────────────────────────────
const BTN_DIAMETER = 64;
const BTN_R = BTN_DIAMETER / 2;  // 32
const BTN_LIFT = -6;               // button centre 4px above bar top

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
const SW = 100;
const Q1C_X = 60;
const MX = 40;
const MY = 24;  // pushed down
const Q2C_X = 24;
const FLOOR = 48;  // pushed down
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
        return (
          <Svg width={22} height={22} viewBox="0 0 48 48">
            <Path
              d={
                isFocused
                  ? 'M39.5,43h-9c-1.381,0-2.5-1.119-2.5-2.5v-9c0-1.105-0.895-2-2-2h-4c-1.105,0-2,0.895-2,2v9c0,1.381-1.119,2.5-2.5,2.5h-9 C7.119,43,6,41.881,6,40.5V21.413c0-2.299,1.054-4.471,2.859-5.893L23.071,4.321c0.545-0.428,1.313-0.428,1.857,0L39.142,15.52 C40.947,16.942,42,19.113,42,21.411V40.5C42,41.881,40.881,43,39.5,43z'
                  : 'M 23.951172 4 A 1.50015 1.50015 0 0 0 23.072266 4.3222656 L 8.859375 15.519531 C 7.0554772 16.941163 6 19.113506 6 21.410156 L 6 40.5 C 6 41.863594 7.1364058 43 8.5 43 L 18.5 43 C 19.863594 43 21 41.863594 21 40.5 L 21 30.5 C 21 30.204955 21.204955 30 21.5 30 L 26.5 30 C 26.795045 30 27 30.204955 27 30.5 L 27 40.5 C 27 41.863594 28.136406 43 29.5 43 L 39.5 43 C 40.863594 43 42 41.863594 42 40.5 L 42 21.410156 C 42 19.113506 40.944523 16.941163 39.140625 15.519531 L 24.927734 4.3222656 A 1.50015 1.50015 0 0 0 23.951172 4 z M 24 7.4101562 L 37.285156 17.876953 C 38.369258 18.731322 39 20.030807 39 21.410156 L 39 40 L 30 40 L 30 30.5 C 30 28.585045 28.414955 27 26.5 27 L 21.5 27 C 19.585045 27 18 28.585045 18 30.5 L 18 40 L 9 40 L 9 21.410156 C 9 20.030807 9.6307412 18.731322 10.714844 17.876953 L 24 7.4101562 z'
              }
              fill={color}
            />
          </Svg>
        );
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
        {/* SVG bar with blurred drop-shadow that follows the notch curve.
            The feGaussianBlur filter blurs the path alpha, feOffset lifts it
            upward, then feMerge composites the blur behind the original fill —
            giving a soft shadow on both the flat top edge and the notch walls. */}
        <Svg
          width={layoutWidth}
          height={barHeight + 20}
          viewBox={`0 -20 ${layoutWidth} ${barHeight + 20}`}
          style={[StyleSheet.absoluteFill, { top: -20, height: barHeight + 20 }]}
        >

          <Path
            d={d}
            fill="#111118"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            filter="url(#notchShadow)"
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
    // Shadow is handled inside the SVG (follows the notch curve)
    // — no rectangular View shadow here
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
