import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import {
  View,
  Text,
} from "react-native";

//Screens
import ChooseLocation from "../Screeens/RideScreen/ChooseLocation";
import Home from "../Screeens/RideScreen/index";
import Report from "../Screeens/RideScreen/report";


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
 
      <Stack.Screen 
  name="ReportScreen" 
  component={Report} 
  options={{ 
    headerShown: true, 
    headerTitle: () => (
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>Report A Problem</Text>
        <Text style={{ fontSize: 12, color: '#fff' }}>Please provide details about your experience.</Text>
      </View>
    ),
    headerStyle: { backgroundColor: 'red', height: 120, }, 
    headerTitleContainerStyle: {
      height: '100%', // Ensures the title remains aligned at the top of the header
      justifyContent: 'center', // Centers the title vertically
    },
    headerTintColor: '#fff',
  }}
/>

    </Stack.Navigator>
    </>
  );
}
