import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign, Entypo, Ionicons,MaterialIcons,FontAwesome } from '@expo/vector-icons';

// Import your screens
import HomeScreen from '../navigation/HomeStack';
import RideScreen from '../navigation/RideStack';
import ProfileScreen from '../navigation/ProfileStack';
import Activity from '../Screeens/ActivityScreen/activity';

const Tab = createBottomTabNavigator();

const TabNav = () => {
  return (
<Tab.Navigator>
  <Tab.Screen
    name="HomeScreen"
    component={HomeScreen}
    options={{
      tabBarLabel: 'Home',
      tabBarLabelStyle: { color: '#008E97' },
      headerShown: false,
      tabBarIcon: ({ focused }) =>
        focused ? (
          <Entypo name="home" size={24} color="#008E97" />
        ) : (
          <Entypo name="home" size={24} color="black" />
        ),
    }}
  />
  <Tab.Screen
    name="RideScreen"
    component={RideScreen}
    options={{
      tabBarLabel: 'Ride',
      tabBarLabelStyle: { color: '#008E97' },
      headerShown: false,
      tabBarIcon: ({ focused }) =>
        focused ? (
          <MaterialIcons name="directions-car" size={24} color="#008E97" />
        ) : (
          <MaterialIcons name="directions-car" size={24} color="black" />
        ),
    }}
  />
  <Tab.Screen
    name="Activity"
    component={Activity}
    options={{
      tabBarLabel: 'Activity',
      tabBarLabelStyle: { color: '#008E97' },
      tabBarIcon: ({ focused }) =>
        focused ? (
          <FontAwesome name="history" size={24} color="#008E97" />
        ) : (
          <FontAwesome name="history" size={24} color="black" />
        ),
    }}
  />
  <Tab.Screen
    name="ProfileScreen"
    component={ProfileScreen}
    options={{
      tabBarLabel: 'Profile',
      tabBarLabelStyle: { color: '#008E97' },
      headerShown: false,
      tabBarIcon: ({ focused }) =>
        focused ? (
          <Ionicons name="person" size={24} color="#008E97" />
        ) : (
          <Ionicons name="person-outline" size={24} color="black" />
        ),
    }}
  />
</Tab.Navigator>

  );
};

export default TabNav;
