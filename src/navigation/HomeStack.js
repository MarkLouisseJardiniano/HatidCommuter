import React from 'react';
import { StatusBar } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../Screeens/HomeScreen/Home';

const Stack = createStackNavigator();

const Layout = () => {
  return (
<>
<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
</>
  );
};

export default Layout;
