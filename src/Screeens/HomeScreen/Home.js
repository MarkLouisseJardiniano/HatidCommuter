import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import axios from "axios";
import imagePath from "../../constants/imagePath";
const Home = () => {
  const [currentAddress, setCurrentAddress] = useState("Fetching address...");
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentAddress("Permission to access location was denied.");
        return;
      }
      setLocationPermission(true);

      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const address = await getAddress(latitude, longitude);
        setCurrentAddress(address);
      } catch (error) {
        console.error("Error fetching location:", error);
        setCurrentAddress("Error fetching location.");
      }
    };

    fetchLocation();
  }, []);

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

        return `${barangay}, ${district}` || "Address not found";
      }
      return "Address not found";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address.";
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.rowContainer}>
        <View style={styles.fullWidthBox}>
        <Image
            source={imagePath.logo}
            style={{width: 150, height: 150}}
            resizeMode="contain"
          />
        </View>

        <View>
          <View style={styles.currentLoc}>
            <Text style={{fontSize:16}}>{currentAddress}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor:"white"
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
  currentLoc: {
    margin: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
});

export default Home;
