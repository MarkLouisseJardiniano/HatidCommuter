import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

//Screens
import ChooseLocation from "../Screeens/RideScreen/ChooseLocation";
import Home from "../Screeens/RideScreen/index";
import BookingDetails from "../Screeens/RideScreen/BookingDetails";
<<<<<<< HEAD
import MessageScreen from "../Screeens/RideScreen/Message";
import Report from "../Screeens/RideScreen/report";
=======
>>>>>>> parent of eee38bf (add ratings and feddback)

export default function Layout() {
  const Stack = createStackNavigator();

  return (
    <>
    <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
    <Stack.Navigator screenOptions={{
      headerShown: false, // Hide header for all screens in this stack
    }}>
      <Stack.Screen name="home" component={Home} />
      <Stack.Screen name="chooseLocation" component={ChooseLocation} />
      <Stack.Screen name="BookingDetails" component={BookingDetails } />
<<<<<<< HEAD
      <Stack.Screen name="MessageScreen" component={MessageScreen } />
      <Stack.Screen name="ReportScreen" component={Report } options={{ headerShown: true }}/>
=======
>>>>>>> parent of eee38bf (add ratings and feddback)
    </Stack.Navigator>
    </>
  );
}
