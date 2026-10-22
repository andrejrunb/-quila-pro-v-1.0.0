import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { theme } from './src/theme/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ParentDashboard from './src/screens/ParentDashboard';
import GuardDashboard from './src/screens/GuardDashboard';
import TeacherDashboard from './src/screens/TeacherDashboard';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ParentDashboard" 
          component={ParentDashboard} 
          options={{ title: 'Portal Pais' }} 
        />
        <Stack.Screen 
          name="GuardDashboard" 
          component={GuardDashboard} 
          options={{ title: 'Monitoramento Tático' }} 
        />
        <Stack.Screen 
          name="TeacherDashboard" 
          component={TeacherDashboard} 
          options={{ title: 'Diário de Classe' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
