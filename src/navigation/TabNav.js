import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign, Entypo, Ionicons } from '@expo/vector-icons';

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
              <Entypo name="home" size={24} color="black" />
            ) : (
              <AntDesign name="home" size={24} color="black" />
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
              <Ionicons name="people" size={24} color="black" />
            ) : (
              <Ionicons name="people-outline" size={24} color="black" />
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
              <AntDesign name="plussquare" size={24} color="black" />
            ) : (
              <AntDesign name="plussquareo" size={24} color="black" />
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
              <AntDesign name="plussquare" size={24} color="black" />
            ) : (
              <AntDesign name="plussquareo" size={24} color="black" />
            ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNav;
