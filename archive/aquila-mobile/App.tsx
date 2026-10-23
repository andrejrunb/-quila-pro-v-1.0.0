import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import TimelineScreen from './src/screens/TimelineScreen';

import { LocationService } from './src/services/LocationService';

const Stack = createNativeStackNavigator();

export default function App() {
  React.useEffect(() => {
    LocationService.startGeofencing().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f172a' }
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Timeline" component={TimelineScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
