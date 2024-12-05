import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddNewSavedPlaceForm = ({ route }) => {
  const [address, setAddress] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(route.params?.selectedLocation || null);
  const [placeType, setPlaceType] = useState(''); // Added placeType as state

  // Fetch user ID when the component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
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

  // Get address when the selected location changes
  useEffect(() => {
    if (selectedLocation) {
      getAddress(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation]);

  // Reverse geocoding to get the address based on latitude and longitude
  const getAddress = async (latitude, longitude) => {
    try {
      const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
      const geoResponse = await axios.get(reverseGeocodeUrl);
      if (geoResponse.data.features.length > 0) {
        const addressComponents = geoResponse.data.features[0].context;

        let barangay = "";
        let district = "";

        addressComponents.forEach((component) => {
          if (component.id.includes("locality")) {
            barangay = component.text;
          } else if (component.id.includes("place")) {
            district = component.text;
          }
        });

        setAddress(`${barangay || "Unknown Barangay"}, ${district || "Unknown District"}`);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Address not found");
    }
  };

  // Handle the saving of the new place
  const handleSavePlace = async () => {
    if ( !address || !placeType) {
      Alert.alert("Error", "Please provide place name, address, and place type.");
      return;
    }

    try {
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/saved/saved-place",
        {
          userId,
          placeType,
          savedLocation: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
        }
      );

      if (response.status === 201) {
        Alert.alert("Success", "New place saved successfully!");
        setAddress('');
        setPlaceType('');
      } else {
        Alert.alert("Error", "Failed to save the new place.");
      }
    } catch (error) {
      console.error("Error saving new place:", error);
      Alert.alert("Error", "An error occurred while saving the place.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Place</Text>
      <View style={styles.form}>

        <Text>Place Type:</Text>
        <TextInput
          style={styles.input}
          value={placeType}
          onChangeText={setPlaceType}
          placeholder="Enter place type (e.g. Gym, School)"
        />

        <Text>Address:</Text>
        <TextInput
           style={[styles.input, { color: 'black' }]} 
          value={address}
          onChangeText={setAddress}
          placeholder="Enter address"
          editable={false}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSavePlace}>
        <Ionicons name="save" size={24} color="white" />
        <Text style={styles.saveButtonText}>Save Place</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  saveButton: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
});

export default AddNewSavedPlaceForm;
