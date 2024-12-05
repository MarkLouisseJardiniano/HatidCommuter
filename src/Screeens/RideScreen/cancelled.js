import React, { useState, useEffect } from "react";
import { View, Text,StyleSheet, TextInput, Button, Alert, Image } from "react-native";
import axios from "axios";
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

const Cancelled = ({route}) => {
   const [destinationAddress, setDestinationAddress] = useState(null);
    const {
        reason,
        bookingId,
        driverId,
        date,
        destinationLocation 
      } = route.params;
    const navigation = useNavigation();

    const handleHome = async () => {
      
        navigation.navigate('home', {
          resetStates: true, 
          selectedLocation: null,
          showVehicleOptions: false,
          showSearching: false,
          waitingForDriver: false,
          pickupAddress: '',
          destinationAddress: '',
          activeTab: null,
          modalVisible: false,
          submitted: true,
        });
      
       
        setBookingDetails(null);
        setSelectedLocation(null);
        setSelectedVehicle(null);
        setAcceptedSharedRides([]);
        setSelectedRide(null);
        setShowVehicleOptions(false);
        setShowSearching(false);
        setWaitingForDriver(false);
        setPickupAddress("");
        setDestinationAddress("");
        setActiveTab(null); 
        setModalVisible(false);
        setSubmitted(true);
      
        // Clear AsyncStorage
        await AsyncStorage.removeItem("bookingId");
        await AsyncStorage.removeItem("driverId");
      };
      
    
      const handleBookingAction = async () => {
        try {
          const {
            userId,
            pickupLocation,
            destinationLocation,
            fare,
            vehicleType,
            rideType,
            rideAction,
            bookingId, 
          } = route.params;
      
          console.log("rideType:", rideType);

          if (!userId || !pickupLocation || !destinationLocation || !fare || !vehicleType || !rideType) {
            Alert.alert("Error", "Missing required fields for booking.");
            return;
          }
      
          let apiUrl;
          let requestBody = {
            userId,
            pickupLocation,
            destinationLocation,
            fare,
            vehicleType,
            rideType,
          };
      
          if (rideAction) {
            requestBody.rideAction = rideAction;
          }
      
          console.log("bookingId:", bookingId); 

          if (rideType === "Special") {

            apiUrl = "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/create/special";
          } else if (rideType === "Shared Ride" && rideAction === "Create") {
            apiUrl = "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/create/shared";
          }
      
          console.log("API URL:", apiUrl);
          console.log("Request Body:", requestBody);

          await AsyncStorage.removeItem("bookingId");
          await AsyncStorage.removeItem("driverId");
      
          const response = await axios.post(apiUrl, requestBody);
          console.log("API Response:", response.data);
      
          Alert.alert("Success", "Booking action completed successfully.");

          navigation.navigate("home", {
            rebookState: true,
            showSearching: true, 
            bookingDetails: response.data,
          });
        } catch (error) {
          console.error("Error in booking action:", error.response?.data || error.message || error);
      
          if (error.response && error.response.data && error.response.data.error) {
            Alert.alert("Error", error.response.data.error);
          } else {
            Alert.alert("Error", "Failed to complete booking action.");
          }
        }
      };
      
       const { latitude, longitude } = destinationLocation || {};

 
  useEffect(() => {
    if (latitude && longitude) {
      getAddress(latitude, longitude);
    }
  }, [latitude, longitude]);

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

        setDestinationAddress(`${barangay}, ${district}` || "Address not found");
      } else {
        setDestinationAddress("Address not found");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setDestinationAddress("Error fetching address.");
    }
  };
      
      

  return (
    <View style={{flex:1,backgroundColor: "white",  justifyContent: "center"}}>
    <View style={{alignItems: "center", padding: 20, justifyContent: "center"}}>
    <View style={{paddingVertical: 20}}>
    <Image
          source={imagePath.xcircle}
          style={{
            height: 100,
            width: 100,
            justifyContent: "center",
            alignItems: "center",
          }} 
        />
    </View>
        <Text style={{fontWeight: "bold", fontSize: 24, color: "red"}}>Booking Cancelled</Text>
        <Text style={{textAlign: "center", fontSize: 16}}>Your booking has been cancelled. We're sorry for any inconvenience this may have caused.
</Text>
<View style={{    display: "flex",
    flexDirection: "row",
    borderBottomColor: "lightgray",
    borderBottomWidth: 1,
    padding: 15,
    width: "100%",}}></View>
    </View>

    <View style={{padding: 20}}>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
            <Text style={{fontSize: 16, fontWeight: "bold"}}>Booking Id:</Text>
            <Text style={{fontSize: 16, fontWeight: "bold"}}>{driverId || "null"}</Text>
        </View>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
        <Text style={{fontSize: 16, fontWeight: "bold"}}>Cancelled Date:</Text>
<Text style={{ fontSize: 16, fontWeight: "bold" }}>
  {date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "null"}
</Text>

        </View>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
        <Text style={{fontSize: 16, fontWeight: "bold"}}>Reason</Text>
        <Text style={{fontSize: 16, fontWeight: "bold"}}>{reason || "null"}</Text>
        </View>
    </View>
<View style={{padding: 20, flexDirection: "column", gap: 10}}>
<TouchableOpacity onPress={handleBookingAction} style={{ backgroundColor: "black", padding: 15,    borderRadius: 8,    alignItems: "center",}}>
        <Text style={{color: "white", fontSize: 16}}>Rebook this Trip</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={handleHome} style={{backgroundColor: "white" , padding: 15,    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",}}>
        <Text style={{ }}>Return to Home</Text>
    </TouchableOpacity>

</View>

    </View>
  )
}

export default Cancelled

const styles = StyleSheet.create({})