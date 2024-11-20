import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import Login from '../navigation/Auth';
import TabNav from '../navigation/TabNav';
import Message from '../Screeens/RideScreen/Message';

const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="LoginStack" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="TabNav" component={TabNav} options={{ headerShown: false }} />
        <Stack.Screen name="MessageScreen" component={Message} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
