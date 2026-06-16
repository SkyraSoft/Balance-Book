import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/MaterialIcons';
import { DataProvider, useData } from './src/context/DataContext';
import { COLORS } from './src/utils/theme';

// User Screens
import HomeScreen from './src/screens/HomeScreen';
import WeeklyTrendScreen from './src/screens/WeeklyTrendScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import CustomerDetailScreen from './src/screens/CustomerDetailScreen';
import AddCustomerScreen from './src/screens/AddCustomerScreen';
import AddEntryScreen from './src/screens/AddEntryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LanguageCurrencyScreen from './src/screens/LanguageCurrencyScreen';
import BackupRestoreScreen from './src/screens/BackupRestoreScreen';
import ExportDataScreen from './src/screens/ExportDataScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import HelpScreen from './src/screens/HelpScreen';
import PeerConnectionScreen from './src/screens/PeerConnectionScreen';
import NotificationsListScreen from './src/screens/NotificationsListScreen';

// Auth / Onboarding Screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

// Admin Screens
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import AdminTicketsScreen from './src/screens/AdminTicketsScreen';
import AdminSettingsScreen from './src/screens/AdminSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack for Home and Weekly Ledger Curve Chart Screen
const HomeStackNav = createNativeStackNavigator();
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="WeeklyTrend" component={WeeklyTrendScreen} />
    </HomeStackNav.Navigator>
  );
}

// 1. Navigation Stack for User Customers ledger
function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
      <Stack.Screen name="AddEntry" component={AddEntryScreen} />
    </Stack.Navigator>
  );
}

// 2. Navigation Stack for User Settings Launcher
function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <Stack.Screen name="LanguageCurrency" component={LanguageCurrencyScreen} />
      <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecurityScreen} />
      <Stack.Screen name="HelpSupport" component={HelpScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="PeerConnection" component={PeerConnectionScreen} />
      <Stack.Screen name="NotificationsList" component={NotificationsListScreen} />
    </Stack.Navigator>
  );
}

// 3. Bottom Tab Navigator for Store Retail Users
function UserAppTabs() {
  const { getTranslation } = useData();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'CustomersTab') iconName = 'people';
          else if (route.name === 'Reports') iconName = 'bar-chart';
          else if (route.name === 'SettingsTab') iconName = 'settings';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: getTranslation('businessDashboard') }} />
      <Tab.Screen name="CustomersTab" component={CustomersStack} options={{ title: getTranslation('customers') }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack} 
        options={{ title: getTranslation('settings') }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behaviour
            e.preventDefault();
            // Force reset settings stack back to main menu launcher
            navigation.navigate('SettingsTab', { screen: 'SettingsMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

// 4. Bottom Tab Navigator for App Owners (Admin Mobile App)
function AdminAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'AdminHome') iconName = 'dashboard';
          else if (route.name === 'AdminTickets') iconName = 'feedback';
          else if (route.name === 'AdminSettings') iconName = 'admin-panel-settings';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'App Analytics' }} />
      <Tab.Screen name="AdminTickets" component={AdminTicketsScreen} options={{ title: 'Help Tickets' }} />
      <Tab.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'System Settings' }} />
    </Tab.Navigator>
  );
}

// 5. Onboarding Navigation Stack
const OnboardingStack = createNativeStackNavigator();
function OnboardingFlow() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="OnboardingMain" component={OnboardingScreen} />
      <OnboardingStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

// 6. Navigation Router Controller
function AppNavigation() {
  const { userRole, isOnboarded } = useData();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userRole === null ? (
          // Logged Out Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userRole === 'admin' ? (
          // System Owner Admin Stack
          <Stack.Screen name="AdminApp" component={AdminAppTabs} />
        ) : !isOnboarded ? (
          // User Onboarding Stack
          <Stack.Screen name="Onboarding" component={OnboardingFlow} />
        ) : (
          // Regular Retail User Stack
          <Stack.Screen name="UserApp" component={UserAppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppNavigation />
    </DataProvider>
  );
}
