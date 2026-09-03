import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import AppNavigator from './src/navigation/AppNavigator';

// Bar colour — keep in sync with FloatingBottomTabBar fill (#111118)
const NAV_BAR_COLOR = '#111118';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Match the system navigation bar to the app's bottom tab bar so they
      // appear as one continuous surface on Android devices.
      NavigationBar.setBackgroundColorAsync(NAV_BAR_COLOR);
      NavigationBar.setButtonStyleAsync('light'); // white gesture handles / buttons
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


