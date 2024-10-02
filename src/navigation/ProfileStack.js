import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screen components here
import EditProfile from '../Screeens/ProfileScreen/editProfile'; 
import Profile from '../Screeens/ProfileScreen/profile'; 
import SavedPlaces from '../Screeens/ProfileScreen/savedPlaces'; 
import Contact from '../Screeens/ProfileScreen/contact'; 
import AddContact from '../Screeens/ProfileScreen/addContact'; 
import AddWork from '../Screeens/ProfileScreen/addSavedPlaceWork';
import AddHome from '../Screeens/ProfileScreen/addSavedPlaceHome';
import AddNew from '../Screeens/ProfileScreen/addSavedPlaceNew';
import Map from "../Screeens/ProfileScreen/map"



const Stack = createStackNavigator();

export default function Layout() {

  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={Profile}  options={{ headerShown: false }}/>
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="SavedPlaces" component={SavedPlaces} />
      <Stack.Screen
        name="AddWork"
        component={AddWork}
        options={{ title: 'Add Work', headerStyle: { backgroundColor: '#f4511e' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}
      />
      <Stack.Screen
        name="AddHome"
        component={AddHome}
        options={{ title: 'Add Home', headerStyle: { backgroundColor: '#1e90ff' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}
      />
      <Stack.Screen
        name="AddNew"
        component={AddNew}
        options={{ title: 'Add New', headerStyle: { backgroundColor: '#32cd32' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}
      />
      <Stack.Screen name="Map" component={Map} />
      <Stack.Screen name="Contact" component={Contact} />
      <Stack.Screen name="AddContact" component={AddContact} />
    </Stack.Navigator>
  );
}
