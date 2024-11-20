import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Ensure AsyncStorage is imported

const SavedPlaces = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null); // State to store userId
  const [savedPlaces, setSavedPlaces] = useState({
    home: null,  // Coordinates or location name for home
    work: null,  // Coordinates or location name for work
  });

  // Fetch userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        console.log('Retrieved userId:', storedUserId);

        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          Alert.alert("Error", "User ID not found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        Alert.alert("Error", "Error fetching user ID");
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return; // Ensure userId is available before fetching

    const fetchSavedPlaces = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get(`https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/saved/saved-places/${userId}`);
        const { home, work } = response.data;
        setSavedPlaces({
          home: home || null,  
          work: work || null,  
        });
      } catch (error) {
        console.error("Error fetching saved places:", error);
      }
    };

    fetchSavedPlaces();
    const intervalId = setInterval(fetchSavedPlaces, 3000); 

    return () => clearInterval(intervalId);
  }, [userId]);

  const handleAddWork = () => {
    navigation.navigate("AddWork");
  };

  const handleAddHome = () => {
    if (savedPlaces.home) {
      navigation.navigate("AddHome", { location: savedPlaces.home });
    } else {
      navigation.navigate("AddHome");
    }
  };

  const handleAddNew = () => {
    navigation.navigate("AddNew");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.places} onPress={handleAddHome}>
        <Ionicons name="home" size={30} />
        <View style={styles.placeDetails}>
          <Text style={styles.placeTitle}>Home</Text>
          <Text style={styles.placeName}>
            {savedPlaces.home
              ? `Lat: ${savedPlaces.home.latitude}, Lon: ${savedPlaces.home.longitude}`
              : "Add Home"}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.places} onPress={handleAddWork}>
        <Ionicons name="briefcase" size={30} />
        <View style={styles.placeDetails}>
          <Text style={styles.placeTitle}>Work</Text>
          <Text style={styles.placeName}>
            {savedPlaces.work
              ? `Lat: ${savedPlaces.work.latitude}, Lon: ${savedPlaces.work.longitude}`
              : "Add Work"}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.places} onPress={handleAddNew}>
        <Ionicons name="add" size={30} />
        <Text style={styles.placeItems}>Add New</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 40,
    flexDirection: "column",
  },
  places: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  placeDetails: {
    marginLeft: 10,
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  placeName: {
    color: "blue",
  },
  placeItems: {
    color: "blue",
    fontWeight: "700",
  },
});

export default SavedPlaces;
