import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Animated, FlatList, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import AddressPickup from "../../components/AddressPickup";
import axios from "axios";g
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showError } from "../../helper/helperFunction";

const ChooseLocation = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [destinationCords, setDestinationCords] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [containerHeight] = useState(new Animated.Value(0)); 
  const [isExpanded, setIsExpanded] = useState(false);
  const [alertShown, setAlertShown] = useState(false);
  const screen = Dimensions.get("window");
  const ASPECT_RATIO = screen.width / screen.height;
  const LATITUDE_DELTA = 0.04;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

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

  useEffect(() => {
    const getCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showError("Permission denied. We need location access.");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    };

    getCurrentLocation();
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
            placesWithAddresses[placeKey] = { address, latitude, longitude };
          } else {
            placesWithAddresses[placeKey] = {
              address: `Add ${placeKey.charAt(0).toUpperCase() + placeKey.slice(1)}`,
            };
          }
        }

        setSavedPlaces(placesWithAddresses); 
      } catch (error) {
        console.error("Error fetching saved places:", error);
        Alert.alert("Error", "Failed to fetch saved places.");
      }
    };

    fetchSavedPlaces();
    const intervalId = setInterval(fetchSavedPlaces, 2000); 
    return () => clearInterval(intervalId);
  }, [userId]);

  const toggleContainer = () => {
    if (isExpanded) {
      Animated.timing(containerHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
     
      Animated.timing(containerHeight, {
        toValue: screen.height * 0.2,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
    setIsExpanded(!isExpanded);
  };

  const selectSavedPlace = (place) => {
    setDestinationCords({
      latitude: place.savedLocation.latitude,
      longitude: place.savedLocation.longitude,
    });
    setMapRegion({
      latitude: place.savedLocation.latitude,
      longitude: place.savedLocation.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
    toggleContainer(); 
  };

  const isInsideMarinduque = (latitude, longitude) => {
    const minLatitude = 12.8066;
    const maxLatitude = 13.5595;
    const minLongitude = 121.8020;
    const maxLongitude =  122.0708;

    console.log(`Checking latitude: ${latitude}, longitude: ${longitude}`);

    return (
      latitude >= minLatitude &&
      latitude <= maxLatitude &&
      longitude >= minLongitude &&
      longitude <= maxLongitude
    );
  };

  const onDone = () => {
    if (!destinationCords) {
      showError("Please select a destination location");
      return;
    }

    const { latitude, longitude } = destinationCords;

    if (!isInsideMarinduque(latitude, longitude)) {
      console.log("Booking outside of Marinduque");
      Alert.alert(
        "Invalid Location",
        "The selected location is outside Marinduque. Please choose a location within the island.",
        [{ text: "OK" }]
      );
      setAlertShown(true);
      return;
    }
    setAlertShown(false);
    navigation.navigate("home", { destinationCords });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          setDestinationCords({ latitude, longitude });
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        }}
      >
        {currentLocation && <Marker coordinate={currentLocation} title="Current Location" />}
        {destinationCords && <Marker coordinate={destinationCords} title="Destination" pinColor="red" />}
      </MapView>

     
      <View style={styles.searchContainer}>
  <AddressPickup
    placeholderText="Enter Location"
    fetchAddress={(lat, lng, zipCode, cityText) =>
      setDestinationCords({ latitude: lat, longitude: lng })
    }
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
  <TouchableOpacity style={styles.savedPlaces} onPress={toggleContainer}>
    <Text style={styles.savedPlacesText}>Saved Places</Text>
  </TouchableOpacity>

  <Animated.View style={[styles.expandingContainer, { height: containerHeight }]}>
    <FlatList
      data={Object.entries(savedPlaces)}
      keyExtractor={(item) => item[0]} 
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.savedPlaceItem}
          onPress={() => selectSavedPlace({ savedLocation: item[1] })}
        >
          <Text style={styles.savedPlaceText}>
            {item[0]}: {item[1].address}
          </Text>
        </TouchableOpacity>
      )}
    />
  </Animated.View>
</View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Choose this Destination</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  searchContainer: { position: "absolute", top: 50, left: 10, right: 10, zIndex: 1,padding: 10, backgroundColor: "white", borderRadius: 8 },
  savedPlaces: { padding: 12,backgroundColor: "white" },
  savedPlacesText: { fontSize: 18, fontWeight: "bold" },
  expandingContainer: { overflow: "hidden",backgroundColor: "white" },
  savedPlacesTitle: { fontSize: 16, marginBottom: 10 },
  savedPlaceItem: { padding: 20, borderBottomWidth: 1, borderColor: "#ccc" },
  savedPlaceText: { fontSize: 14 },
  buttonContainer: { position: "absolute", bottom: 20, left: 20, right: 20, zIndex: 2 },
  doneButton: { backgroundColor: "powderblue", padding: 15, borderRadius: 10 },
  doneButtonText: { color: "black", textAlign: "center", fontSize: 18, fontWeight: "bold" },
});

export default ChooseLocation;
