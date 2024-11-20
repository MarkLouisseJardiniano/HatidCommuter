import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import axios from 'axios';

const Map = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [userId, setUserId] = useState(null); // Add state for userId

  const screen = Dimensions.get("window");
  const ASPECT_RATIO = screen.width / screen.height;
  const LATITUDE_DELTA = 0.04;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      const { latitude, longitude } = location.coords;
      console.log("Current Location:", { latitude, longitude });
      setCurrentLocation({ latitude, longitude });
    })();

    // Fetch userId from AsyncStorage
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

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log("Selected Location:", { latitude, longitude });
    setSelectedLocation({ latitude, longitude });
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }
    const dataToSend = {
      userId,
      placeType: 'Home',
      savedLocation: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      }
    };
  
    console.log("Data to Send:", dataToSend);
  
    // Send data to backend
    try {
      const response = await axios.post('https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/saved/saved-place', dataToSend);
      console.log("Response from Backend:", response.data);
      Alert.alert("Success", "Saved Place Successfully");
    } catch (error) {
      console.error("Error saving place:", error.response ? error.response.data : error.message);
      Alert.alert("Error", "Failed to save place");
    }
  };
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
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
          <Marker coordinate={selectedLocation} title="Selected Location" />
        )}
      </MapView>
      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  map: {
    width: "100%",
    height: "80%",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "powderblue",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
});

export default Map;
