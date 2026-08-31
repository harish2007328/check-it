import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ReportScreen from '../screens/ReportScreen';
import ComplaintScreen from '../screens/ComplaintScreen';
import TrackComplaintScreen from '../screens/TrackComplaintScreen';
import RulesScreen from '../screens/RulesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FloatingBottomTabBar from './FloatingBottomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Empty component for the center scanner tab trigger
function DummyScannerComponent() {
  return <View style={{ flex: 1, backgroundColor: Colors.canvas }} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Rules" component={RulesScreen} />
      <Tab.Screen name="ScannerTab" component={DummyScannerComponent} />
      <Tab.Screen name="Track" component={TrackComplaintScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.canvas },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="Complaint" component={ComplaintScreen} />
        <Stack.Screen name="Track" component={TrackComplaintScreen} />
        <Stack.Screen name="Rules" component={RulesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
