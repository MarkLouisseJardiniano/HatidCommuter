import React from 'react';
import { StatusBar } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../Screeens/HomeScreen/Home';
import Rental from '../Screeens/HomeScreen/rental';

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
        <Stack.Screen name="Rental" component={Rental} />
      </Stack.Navigator>
</>
  );
};

export default Layout;
