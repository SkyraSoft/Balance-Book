import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DataProvider } from './src/context/DataContext';

import HomeScreen from './src/screens/HomeScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import CustomerDetailScreen from './src/screens/CustomerDetailScreen';
import AddCustomerScreen from './src/screens/AddCustomerScreen';
import AddEntryScreen from './src/screens/AddEntryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BackupRestoreScreen from './src/screens/BackupRestoreScreen';
import ExportDataScreen from './src/screens/ExportDataScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Customer Details' }} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Add Customer' }} />
      <Stack.Screen name="AddEntry" component={AddEntryScreen} options={{ title: 'Add Entry' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: 'Business Profile' }} />
      <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} options={{ title: 'Backup & Restore' }} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} options={{ title: 'Export Data' }} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="SecuritySettings" component={SecurityScreen} options={{ title: 'Security' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy Policy' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <DataProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Home') iconName = 'home';
              else if (route.name === 'Customers') iconName = 'people';
              else if (route.name === 'Reports') iconName = 'bar-chart';
              else if (route.name === 'Settings') iconName = 'settings';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2c7da0',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Customers" component={CustomersStack} />
          <Tab.Screen name="Reports" component={ReportsScreen} />
          <Tab.Screen name="Settings" component={SettingsStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </DataProvider>
  );
}
