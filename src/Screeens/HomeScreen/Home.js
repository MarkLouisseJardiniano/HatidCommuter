import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location"; // Import Expo location

const Home = () => {
  const navigation = useNavigation();
  const [currentAddress, setCurrentAddress] = useState(null);

  // Function to fetch current address
  const getCurrentAddress = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentAddress("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let { coords } = location;
      let address = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
      
      // Construct the address string from the address object
      let fullAddress = `${address[0].street}, ${address[0].village}, ${address[0].city}`;

      setCurrentAddress(fullAddress);
    } catch (error) {
      console.error("Error getting location:", error);
      setCurrentAddress("Location unavailable");
    }
  };

  useEffect(() => {
    getCurrentAddress(); // Fetch address when component mounts
  }, []);

  const handleRental = () => {
    navigation.navigate("Rental");
  };
  



  
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.rowContainer}>
        <View style={styles.fullWidthBox}>
          <Text style={styles.header}>HATID</Text>
        </View>

        <View>
          <View style={styles.currentLoc}>
            <Text>{currentAddress}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleRental}>
          <View style={styles.circle}>
            <Ionicons name="car" size={50} color="black" />
          </View>
        </TouchableOpacity>

        <View>
          <Text style={styles.rent}>Rent a Car</Text>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  try: {
    width:100,
    height:30,
    backgroundColor: 'blue',
  },
  rowContainer: {
    flex: 1,
    flexDirection: "column",
  },
  fullWidthBox: {
    height: 150,
    backgroundColor: "powderblue",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 42,
    fontWeight: "700",
    fontFamily: "sans-serif",
  },
  circle: {
    width: 70,
    height: 70,
    backgroundColor: "powderblue",
    borderRadius: 50,
    marginLeft: 30,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  rent: {
    marginLeft: 25,
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
  },
  currentLoc: {
    margin: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
});

export default Home;
