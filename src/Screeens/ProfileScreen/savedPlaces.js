import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SavedPlaces = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState({});
  const [newPlaces, setNewPlaces] = useState([]); 

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        console.log("Retrieved userId:", storedUserId);

        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          Alert.alert("Error", "User ID not found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    fetchUserId();
  }, []);

  // Reverse Geocode to get Address
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
            barangay = component.text; // Get the barangay
          } else if (component.id.includes("place")) {
            district = component.text; // Get the district
          }
        });

        return `${barangay}, ${district}` || "Address not found";
      }
      return "Address not found";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address";
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchSavedPlaces = async () => {
      try {
        const response = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/saved/saved-places/${userId}`
        );

        const places = response.data;

        const placesWithAddresses = {};

        for (const placeKey in places) {
          const place = places[placeKey];
          if (place) {
            const { latitude, longitude } = place;
            const address = await getAddress(latitude, longitude);
            placesWithAddresses[placeKey] = address;
          } else {
            placesWithAddresses[placeKey] = `Add ${placeKey.charAt(0).toUpperCase() + placeKey.slice(1)}`;
          }
        }

        setSavedPlaces(placesWithAddresses); // Update state with multiple places
      } catch (error) {
        console.error("Error fetching saved places:", error);
      }
    };

    fetchSavedPlaces();
    const intervalId = setInterval(fetchSavedPlaces, 2000);
    return () => clearInterval(intervalId);
  }, [userId]);

  const handleDelete = async (placeKey) => {
    try {
      const response = await axios.delete(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/saved/saved-places/${userId}/${placeKey}`
      );

      if (response.data.message === "Saved Place deleted successfully") {
        const updatedPlaces = { ...savedPlaces };
        delete updatedPlaces[placeKey];
        setSavedPlaces(updatedPlaces); 
      }
    } catch (error) {
      console.error("Error deleting saved place:", error);
      Alert.alert("Error", "Unable to delete the saved place.");
    }
  };


  const renderSavedPlace = (placeKey) => {
    return (
      <View style={styles.places} key={placeKey}>
        <Ionicons
          name={placeKey === "home" ? "home" : "heart"}
          size={30}
          color={placeKey === "home" ? "black" : "red"}
        />
        <View style={styles.addedPlaceDetails}>
        <View>
        <Text style={styles.placeTitle}>{placeKey.charAt(0).toUpperCase() + placeKey.slice(1)}</Text>
          <Text style={styles.placeName}>
            {savedPlaces[placeKey] || "Loading..."}
          </Text>
        </View>
          <TouchableOpacity onPress={() => handleDelete(placeKey)}>
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>
        </View>
 
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableOpacity style={styles.places} onPress={() => navigation.navigate("AddHome")}>
          <Ionicons name="home" size={30} />
          <View style={styles.placeDetails}>
            <Text style={styles.placeTitle}>Home</Text>
            <Text style={styles.placeName}>
              {savedPlaces.Home || "Add Home"} 
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.places} onPress={() => navigation.navigate("AddWork")}>
          <Ionicons name="briefcase" size={30} />
          <View style={styles.placeDetails}>
            <Text style={styles.placeTitle}>Work</Text>
            <Text style={styles.placeName}>
              {savedPlaces.Work || "Add Work"}
            </Text>
          </View>
        </TouchableOpacity>

        {Object.keys(savedPlaces)
          .filter((placeKey) => placeKey !== "Home" && placeKey !== "Work")
          .map((placeKey) => renderSavedPlace(placeKey))}

        <FlatList
          data={newPlaces}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.places} onPress={() => navigation.navigate("AddNew")}>
              <Ionicons name="add" size={30} />
              <Text style={styles.placeItems}>Add New {item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.toString()}
        />
      </ScrollView>

      <TouchableOpacity style={styles.addNewButton} onPress={() => navigation.navigate("AddNew")}>
        <Ionicons name="add-circle" size={30} />
        <Text style={styles.addNewText}>Add New Place</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 40,
    flexDirection: "column",
    backgroundColor: "white"
  },
  places: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  placeDetails: {
    marginLeft: 10,
  },
  addedPlaceDetails: {
    marginLeft: 10,
    width: "85%",
    justifyContent: "space-between",
    flexDirection: "row"
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
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    justifyContent: "center",
    marginBottom: 20,
  },
  addNewText: {
    color: "black",
    marginLeft: 10,
  },
});

export default SavedPlaces;
