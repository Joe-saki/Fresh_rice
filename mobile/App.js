// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';

import { useAuthStore } from './src/store/index';
import { colors } from './src/utils/theme';

// Auth Screens
import SplashScreen from './src/screens/Auth/SplashScreen';
import PhoneEntryScreen from './src/screens/Auth/PhoneEntryScreen';
import OTPVerifyScreen from './src/screens/Auth/OTPVerifyScreen';

// Student Screens
import HomeScreen from './src/screens/Home/HomeScreen';
import VendorListScreen from './src/screens/Vendor/VendorListScreen';
import VendorDetailScreen from './src/screens/Vendor/VendorDetailScreen';
import FoodDetailScreen from './src/screens/Vendor/FoodDetailScreen';
import CartScreen from './src/screens/Cart/CartScreen';
import CheckoutScreen from './src/screens/Cart/CheckoutScreen';
import PaymentScreen from './src/screens/Cart/PaymentScreen';
import OrderTrackingScreen from './src/screens/Tracking/OrderTrackingScreen';
import OrderHistoryScreen from './src/screens/Orders/OrderHistoryScreen';
import OrderDetailScreen from './src/screens/Orders/OrderDetailScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import RewardsScreen from './src/screens/Profile/RewardsScreen';

// Rider Screens
import RiderHomeScreen from './src/screens/Rider/RiderHomeScreen';
import RiderDeliveryScreen from './src/screens/Rider/RiderDeliveryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, color, size }) {
  const icons = { Home: '🏠', Orders: '📦', Profile: '👤', Rider: '🏍️' };
  return <Text style={{ fontSize: size * 0.8 }}>{icons[name] || '●'}</Text>;
}

function StudentTabs() {
  const { user } = useAuthStore();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f0f0f0', height: 80, paddingBottom: 20 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <TabIcon name={route.name} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f0f0f0', height: 80, paddingBottom: 20 },
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <TabIcon name={route.name} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Rider" component={RiderHomeScreen} options={{ title: 'Deliveries' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === 'RIDER' ? (
        <>
          <Stack.Screen name="RiderTabs" component={RiderTabs} />
          <Stack.Screen name="RiderDelivery" component={RiderDeliveryScreen} options={{ headerShown: true, title: 'Active Delivery' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={StudentTabs} />
          <Stack.Screen name="VendorList" component={VendorListScreen} options={{ headerShown: true, title: 'Restaurants' }} />
          <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
          <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Your Cart' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, title: 'Checkout' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: 'Pay with MoMo' }} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: true, title: 'Track Order' }} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: true, title: 'Order Details' }} />
          <Stack.Screen name="Rewards" component={RewardsScreen} options={{ headerShown: true, title: 'Bites Points' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
          <Text style={{ fontSize: 64 }}>🍚</Text>
          <ActivityIndicator color="white" size="large" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        {!isAuthenticated ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          </Stack.Navigator>
        ) : (
          <AppNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
