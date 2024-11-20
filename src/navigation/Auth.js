import React from "react";
import { StatusBar } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Authenticate from "../Screeens/(authenticate)/auth";
import Login from '../Screeens/(authenticate)/login';
import Signup from "../Screeens/(authenticate)/register";
import Otp from "../Screeens/(authenticate)/otp";
import CompletionMessage from "../Screeens/(authenticate)/completionMessage"

const Stack = createStackNavigator();

const Layout = () => {
  return (
<>
<StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
    <Stack.Navigator initialRouteName="Auth">
      <Stack.Screen name="Auth" component={Authenticate} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
      <Stack.Screen name="Otp" component={Otp} options={{ headerShown: false }} />
      <Stack.Screen name="CompletionMessage" component={CompletionMessage} options={{ headerShown: false }} />
    </Stack.Navigator>
</>
  );
};

export default Layout;
