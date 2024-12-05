import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import AddressPickup from "../../components/AddressPickup";
import CustomBtn from "../../components/CustomBtn";
import { showError } from "../../helper/helperFunction";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";

const AddSavedPlaceWork = ({ route }) => {
  const navigation = useNavigation();
  const [destinationCords, setDestinationCords] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null); // State for selected location
  const [currentLocation, setCurrentLocation] = useState(null);
  const [userId, setUserId] = useState(null); // Add state for userId
  const [mapRegion, setMapRegion] = useState(null); // Add state for mapRegion
  const [searchQuery, setSearchQuery] = useState(""); // State for search query

  const screen = Dimensions.get("window");
  const ASPECT_RATIO = screen.width / screen.height;
  const LATITUDE_DELTA = 0.04;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

  useEffect(() => {
    // Fetch the current location when the component mounts
    const getCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "We need permission to access your location.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    getCurrentLocation();
  }, []);

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
    if (destinationCords) {
      // Update the map region when destinationCords changes
      setMapRegion({
        latitude: destinationCords.latitude,
        longitude: destinationCords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      setSearchQuery(""); // Clear search query if destination is set directly
    }
  }, [destinationCords]);

  useEffect(() => {
    if (selectedLocation) {
      // Update the search query when a location is selected on the map
      setSearchQuery(""); // Clear search query if location is set directly
    }
  }, [selectedLocation]);

  const checkValid = () => {
    if (!selectedLocation) { // Ensure selectedLocation is used for validation
      showError("Please select a location on the map");
      return false;
    }
    return true;
  };

  const MARINDUQUE_BOUNDS = {
    latitudeMin: 12.8066,
    latitudeMax: 13.5595,
    longitudeMin: 121.8020,
    longitudeMax: 122.0708,
  };
  
  const isLocationInMarinduque = (location) => {
    const { latitude, longitude } = location;
    
    console.log("Checking location:", latitude, longitude); // Log the selected location coordinates
    
    return (
      latitude >= MARINDUQUE_BOUNDS.latitudeMin &&
      latitude <= MARINDUQUE_BOUNDS.latitudeMax &&
      longitude >= MARINDUQUE_BOUNDS.longitudeMin &&
      longitude <= MARINDUQUE_BOUNDS.longitudeMax
    );
  };
  
  const onSave = async () => {
    const isValid = checkValid();
    if (isValid) {
      // Check if the selected location is within Marinduque
      console.log("Selected Location:", selectedLocation); // Log the selected location
      if (!isLocationInMarinduque(selectedLocation)) {
        // Show alert if the location is outside Marinduque
        Alert.alert(
          "Invalid Location",
          "The selected location is outside Marinduque. Please choose a location within the island.",
          [{ text: "OK" }]
        );
        return;
      }
  
      console.log("Saving place with userId:", userId);
      console.log("Selected Location for saving:", selectedLocation);
      try {
        const response = await axios.post(
          "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/saved/saved-place",
          {
            userId,
            placeType: "Work", 
            savedLocation: {
              latitude: selectedLocation.latitude, 
              longitude: selectedLocation.longitude,
            },
          }
        );
        console.log("Saved place response:", response.data);
        navigation.navigate("SavedPlaces"); 
      } catch (error) {
        console.error("Error saving place:", error);
        showError("Failed to save place");
      }
    }
  };
  
  const fetchDestinationCords = (lat, lng, zipCode, cityText) => {
    console.log("Zip code:", zipCode);
    console.log("City text:", cityText);
    setDestinationCords({
      latitude: lat,
      longitude: lng,
    });
    setSelectedLocation({
      latitude: lat,
      longitude: lng,
    });
    // Update map region to center on the destination coordinates
    setMapRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
    setSearchQuery(`${cityText}, ${zipCode}`); // Update the search query
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log("Selected Location:", { latitude, longitude });
    setSelectedLocation({ latitude, longitude });
    // Update the map region to center on the selected location
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion || {
          latitude: currentLocation ? currentLocation.latitude : 13.3646,
          longitude: currentLocation ? currentLocation.longitude : 121.9136,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        zoomEnabled={true}
        scrollEnabled={true}
        onPress={handleMapPress}
      >
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Current Location" />
        )}
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title="Selected Location" pinColor="red" />
        )}
      </MapView>

      {/* Floating Search Bar */}
      <View style={styles.searchContainer}>
        <AddressPickup
          placeholderText="Enter Location for Home"
          fetchAddress={fetchDestinationCords}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <CustomBtn
          btnText="Save Work"
          onPress={onSave}
          btnStyle={styles.customBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  searchContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1, // Ensure the search bar is on top of the map
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 5, // For shadow on Android
    shadowColor: "#000", // For shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1, // Ensure the button is on top of the map
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5, // For shadow on Android
  },
});

export default AddSavedPlaceWork;
