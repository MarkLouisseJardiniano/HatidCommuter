import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import ChooseLocation from "../Screeens/RideScreen/ChooseLocation";
import Home from "../Screeens/RideScreen/index";
import BookingDetails from "../Screeens/RideScreen/BookingDetails";
import MessageScreen from "../Screeens/RideScreen/Message";

export default function Layout() {
  const Stack = createStackNavigator();

  return (
    <>
    <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
    <Stack.Navigator screenOptions={{
      headerShown: false,
    }}>
      <Stack.Screen name="home" component={Home} />
      <Stack.Screen name="chooseLocation" component={ChooseLocation} />
      <Stack.Screen name="BookingDetails" component={BookingDetails } />
      <Stack.Screen name="MessageScreen" component={MessageScreen } />
    </Stack.Navigator>
    </>
  );
}
