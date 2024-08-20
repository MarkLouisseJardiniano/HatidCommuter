import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import EditProfile from '../Screeens/ProfileScreen/editProfile'; 
import Profile from '../Screeens/ProfileScreen/profile'; 
import SavedPlaces from '../Screeens/ProfileScreen/savedPlaces'; 
import Contact from '../Screeens/ProfileScreen/contact'; 
import AddContact from '../Screeens/ProfileScreen/addContact'; 


const Stack = createStackNavigator();

export default function Layout() {
  return (
    <Stack.Navigator  
        screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="SavedPlaces" component={SavedPlaces} />
      <Stack.Screen name="Contact" component={Contact} />
      <Stack.Screen name="AddContact" component={AddContact} />
    </Stack.Navigator>
  );
}
