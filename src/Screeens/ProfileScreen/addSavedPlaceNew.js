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
import { useNavigation } from "@react-navigation/native";

const AddSavedPlaceNew = ({ route }) => {
  const navigation = useNavigation();
  const [destinationCords, setDestinationCords] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const checkValid = () => {
    if (!selectedLocation) {
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
      if (!isLocationInMarinduque(selectedLocation)) {
        Alert.alert(
          "Invalid Location",
          "The selected location is outside Marinduque. Please choose a location within the island.",
          [{ text: "OK" }]
        );
        return;
      }
  
      try {
        navigation.navigate("AddNewSavedPlaceForm", {
          selectedLocation: selectedLocation,
        });
      } catch (error) {
        console.error("Error saving place:", error);
        showError("Failed to save place");
      }
    }
  };
  

  const fetchDestinationCords = (lat, lng, zipCode, cityText) => {
    setDestinationCords({
      latitude: lat,
      longitude: lng,
    });
    setSelectedLocation({
      latitude: lat,
      longitude: lng,
    });
    setMapRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
    setSearchQuery(`${cityText}, ${zipCode}`);
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
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

      <View style={styles.searchContainer}>
        <AddressPickup
          placeholderText="Enter Location"
          fetchAddress={fetchDestinationCords}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.saveButtonContainer}>
        <CustomBtn
          btnText="Save"
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
    zIndex: 1,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
  },
});

export default AddSavedPlaceNew;
