import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import { GOOGLE_MAP_KEY } from "../../constants/googleMapKey";
import imagePath from "../../constants/imagePath";
import MapViewDirections from "react-native-maps-directions";
import Loader from "../../components/Loader";
import { Image } from "expo-image";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
} from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import RNPickerSelect from "react-native-picker-select";
import { useNavigation } from "@react-navigation/native";
import { CommonActions } from "@react-navigation/native";

const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Home = ({ navigation, route, onSelectVehicle }) => {
  const mapRef = useRef();
  const markerRef = useRef();
  const [waitingForDriver, setWaitingForDriver] = useState(false);

  const [showSearching, setShowSearching] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [showVehicleOptions, setShowVehicleOptions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [fareDetails, setFareDetails] = useState(null);
  const [totalFare, setTotalFare] = useState(null);
  const [selectPaymentMethod, setSelectPaymentMethod] = useState(null);
  const [distance, setDistance] = useState(null);
  const [destinationCords, setDestinationCords] = useState(null);
  const [showDirections, setShowDirections] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedRideType, setSelectedRideType] = useState(null);
  const [activeTab, setActiveTab] = useState("Shared Ride");
  const [pickupAddress, setPickupAddress] = useState(
    "Pickup location not available"
  );
  const [destinationAddress, setDestinationAddress] = useState(
    "Destination location not available"
  );
  const [acceptedSharedRides, setAcceptedSharedRides] = useState([]);
  const [coPassengerAddresses, setCoPassengerAddresses] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [coPassengerPickupAddress, setCoPassengerPickupAddress] = useState(""); // Renamed state for co-passenger's pickup address
  const [coPassengerDestinationAddress, setCoPassengerDestinationAddress] =
    useState(""); // Renamed state for co-passenger's destination address
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPickupConfirmed, setIsPickupConfirmed] = useState({});
  const [distanceToPickup, setDistanceToPickup] = useState({});
  const [isArrivedAtPickup, setIsArrivedAtPickup] = useState({});

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const handleJoinButton = (rideId) => {
    const ride = acceptedSharedRides.find((r) => r._id === rideId);
    if (ride) {
      setSelectedRide(ride);
      setModalVisible(true); // Open the modal
    }
  };

  const getAddress = async (latitude, longitude) => {
    const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
    try {
      const geoResponse = await axios.get(reverseGeocodeUrl);
      if (geoResponse.data.features.length > 0) {
        let barangay = "";
        let district = "";

        const addressComponents = geoResponse.data.features[0].context;

        addressComponents.forEach((component) => {
          if (component.id.includes("locality")) {
            barangay = component.text;
          } else if (component.id.includes("place")) {
            district = component.text;
          }
        });

        return `${barangay}, ${district}` || "Address not found";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
    return "Address not found";
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      if (curLoc) {
        const pickup = await getAddress(curLoc.latitude, curLoc.longitude);
        setPickupAddress(pickup);
      }

      if (destinationCords) {
        const destination = await getAddress(
          destinationCords.latitude,
          destinationCords.longitude
        );
        setDestinationAddress(destination);
      }
    };

    fetchAddresses();
  }, [curLoc, destinationCords]);

  const handleSelectRideType = (rideType) => {
    setSelectedRideType(rideType);
  };
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
  };

  const [state, setState] = useState({
    curLoc: {
      latitude: 13.3646,
      longitude: 121.9136,
    },
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 30.7046,
      longitude: 77.1025,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    time: 0,
    heading: 0,
  });

  const { curLoc, time, isLoading, coordinate, heading } = state;

  const updateState = (data) => setState((state) => ({ ...state, ...data }));

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (onSelectVehicle) {
      onSelectVehicle(vehicle);
    }
  };

  useEffect(() => {
    getLiveLocation();
  }, []);

  useEffect(() => {
    if (route.params?.destinationCords) {
      setDestinationCords(route.params.destinationCords);
    }
  }, [route.params?.destinationCords]);

  const getLiveLocation = async () => {
    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        updateState({
          errorMessage: "Permission to access location was denied",
        });
        return;
      }
      const location = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.High,
      });
      const { latitude, longitude, heading } = location.coords;

      animate(latitude, longitude);

      updateState({
        heading: heading,
        curLoc: { latitude, longitude },
        coordinate: new AnimatedRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }),
      });
    } catch (error) {
      updateState({
        errorMessage: error.message,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getLiveLocation();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const onPressLocation = () => {
    navigation.navigate("chooseLocation", {});
  };

  const animate = (latitude, longitude) => {
    const newCoordinate = { latitude, longitude };
    if (Platform.OS === "android") {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 7000);
      }
    } else {
      coordinate.timing(newCoordinate).start();
    }
  };

  const onCenter = () => {
    mapRef.current.animateToRegion({
      latitude: curLoc.latitude,
      longitude: curLoc.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  const fetchTime = (d, t) => {
    console.log("Updating distance to:", d);
    updateState({
      distance: d,
      time: t,
    });
  };

  const createSpecialBooking = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        console.error("No token or user ID found.");
        return;
      }

      // Get fare details
      const fareResponse = await axios.get(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/admin-fare/fares",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Fare Response Data:", fareResponse.data);

      const fareDetails = fareResponse.data.find(
        (fare) => fare.vehicleType === selectedVehicle
      );

      if (!fareDetails) {
        console.error("Fare details not found for selected vehicle type.");
        return;
      }

      const { baseFare, farePerKm, bookingFee } = fareDetails;

      console.log("Fare Per Km:", farePerKm);
      console.log("Distance:", distance);

      const distanceInKm = distance;
      console.log("Distance in km:", distanceInKm);

      if (isNaN(farePerKm) || isNaN(distanceInKm)) {
        console.error("Invalid farePerKm or distance value.");
        return;
      }

      const totalFare = baseFare + farePerKm * distanceInKm + bookingFee;
      console.log("Total Fare:", totalFare);

      const bookingData = {
        userId: userId,
        pickupLocation: {
          latitude: curLoc.latitude,
          longitude: curLoc.longitude,
        },
        destinationLocation: destinationCords,
        fare: totalFare,
        vehicleType: selectedVehicle,
        rideType: "Special",
      };

      const response = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/create/special",
        bookingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data || !response.data._id) {
        throw new Error("Failed to create booking");
      }

      console.log("Booking created:", response.data);

      const bookingResponse = await axios.get(
        `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/booking/${response.data._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookingDetails(bookingResponse.data);
      setFareDetails(fareDetails); // Update fareDetails
      setTotalFare(totalFare); // Update totalFare
      setShowSearching(true);
      setWaitingForDriver(true);

      startPolling(response.data._id, token);
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const createSharedRideBooking = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        console.error("No token or user ID found.");
        return;
      }

      // Get fare details
      const fareResponse = await axios.get(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/admin-fare/fares",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Fare Response Data:", fareResponse.data);

      const fareDetails = fareResponse.data.find(
        (fare) => fare.vehicleType === selectedVehicle
      );

      if (!fareDetails) {
        console.error("Fare details not found for selected vehicle type.");
        return;
      }

      const { baseFare, farePerKm, bookingFee } = fareDetails;

      console.log("Fare Per Km:", farePerKm);
      console.log("Distance:", distance);

      const distanceInKm = distance;
      console.log("Distance in km:", distanceInKm);

      if (isNaN(farePerKm) || isNaN(distanceInKm)) {
        console.error("Invalid farePerKm or distance value.");
        return;
      }

      const totalFare = baseFare + farePerKm * distanceInKm + bookingFee;
      console.log("Total Fare:", totalFare);

      const bookingData = {
        userId: userId,
        pickupLocation: {
          latitude: curLoc.latitude,
          longitude: curLoc.longitude,
        },
        destinationLocation: destinationCords,
        fare: totalFare,
        vehicleType: selectedVehicle,
        rideType: "Shared Ride",
      };

      const response = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/create/shared",
        bookingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data || !response.data._id) {
        throw new Error("Failed to create booking");
      }

      console.log("Booking created:", response.data);

      const bookingResponse = await axios.get(
        `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/booking/${response.data._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookingDetails(bookingResponse.data);
      setFareDetails(fareDetails); // Update fareDetails
      setTotalFare(totalFare); // Update totalFare
      setShowSearching(true);
      setWaitingForDriver(true);

      startPolling(response.data._id, token);
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const handleCancelBooking = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        console.error("No token or user ID found.");
        return;
      }

      const response = await axios.post(
        `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/cancel`,
        {
          userId: userId,
          bookingId: bookingDetails._id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        console.log("Booking canceled:", response.data);

        // Update state after cancel
        setBookingDetails(null);
        setFareDetails(null);
        setTotalFare(null);
        setShowSearching(false);
        setDestinationCords(null);

        alert("Your booking has been canceled.");
      } else {
        throw new Error("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("Failed to cancel the booking. Please try again.");
    }
  };

  const startPolling = (bookingId, token) => {
    const intervalId = setInterval(async () => {
      try {
        const bookingResponse = await axios.get(
          `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/booking/${bookingId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const bookingDetails = bookingResponse.data;

        // Update booking details state
        setBookingDetails(bookingDetails);

        if (bookingDetails.status === "completed") {
          const driver = bookingDetails.driver;
          const driverId = driver?._id;
          const bookingId = bookingDetails._id;

          if (driverId && bookingId) {
            console.log("Booking completed:", bookingDetails);
            console.log("Driver ID:", driverId);
            console.log("Booking ID:", bookingId);

            await AsyncStorage.setItem("driverId", driverId.toString());
            await AsyncStorage.setItem("bookingId", bookingId.toString());

            console.log("Driver ID saved:", driverId);
            console.log("Booking ID saved:", bookingId);

            clearInterval(intervalId);
          } else {
            console.log(
              "Driver ID or Booking ID not found in booking details."
            );
          }
        } else if (bookingDetails.status === "accepted") {
          console.log("Booking accepted:", bookingDetails);

          setDriverLocation(bookingDetails.driverLocation);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      }
    }, 200);

    setPollingInterval(intervalId);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleMessage = () => {
    navigation.navigate("MessageScreen");
  };

  const handleRating = (index) => {
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      const driverId = await AsyncStorage.getItem("driverId");

      if (!token || !userId || !driverId) {
        Alert.alert("Error", "Missing required information.");
        return;
      }

      console.log("Submitting rating with:", {
        bookingId: bookingDetails?._id,
        driverId,
        userId,
        rating,
        feedback,
      });

      const response = await axios.post(
        `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/rate/ratings`,
        {
          bookingId: bookingDetails?._id,
          driverId,
          userId,
          rating,
          feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        const data = response.data;

        if (data.message === "Rating Submitted Successfully") {
          setRating(null);
          setFeedback("");
          setBookingDetails(null);
          setShowVehicleOptions(false);
          setShowSearching(false);
          setDestinationCords(null);
          setDriverLocation(null);
          setSelectedLocation(null);

          navigation.navigate("Home");
        } else {
          Alert.alert("Info", data.message || "Rating submission completed.");
        }
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error(
        "Error submitting rating:",
        error.response ? error.response.data : error.message
      );
      Alert.alert(
        "Error",
        `There was an error submitting your rating: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleReport = () => {
    navigation.navigate("ReportScreen");
  };
  useEffect(() => {
    if (route.params?.destinationCords) {
      setSelectedLocation("Your Selected Location"); // Replace with actual location data if available
      setShowVehicleOptions(true); // Show vehicle options after location is selected
    }
  }, [route.params?.destinationCords]);

  const getCoPassengerAddress = async (latitude, longitude) => {
    const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
    try {
      const geoResponse = await axios.get(reverseGeocodeUrl);
      if (geoResponse.data.features.length > 0) {
        let barangay = "";
        let district = "";

        const addressComponents = geoResponse.data.features[0].context;

        addressComponents.forEach((component) => {
          if (component.id.includes("locality")) {
            barangay = component.text;
          } else if (component.id.includes("place")) {
            district = component.text;
          }
        });

        return `${barangay}, ${district}` || "Address not found";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
    return "Address not found";
  };
  useEffect(() => {
    const fetchAvailableRides = async () => {
      try {
        const bookingId = await AsyncStorage.getItem("bookingId");

        if (!bookingId) {
          console.log("No booking ID found in AsyncStorage.");
          return;
        }
        const response = await axios.get(
          "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/available/shared"
        );
        const { data } = response.data;
        console.log("Fetched rides:", data);
        setAcceptedSharedRides(data);

        if (data.length > 0) {
          const firstRide = data[0];

          const pickup = await getCoPassengerAddress(
            firstRide.pickupLocation.latitude,
            firstRide.pickupLocation.longitude
          );
          const destination = await getCoPassengerAddress(
            firstRide.destinationLocation.latitude,
            firstRide.destinationLocation.longitude
          );

          setCoPassengerPickupAddress(pickup);
          setCoPassengerDestinationAddress(destination);
        }
      } catch (error) {
        console.error("Error fetching available rides:", error);
      }
    };

    fetchAvailableRides();
  }, []);

  const handleJoinRide = async (bookingId) => {
    try {
      console.log("Current Location:", curLoc);
      console.log("Destination Coordinates:", destinationCords);
  
      // Validate current location and destination coordinates
      if (!curLoc || !destinationCords) {
        console.error("Current location and destination location are required");
        return;
      }
  
      // Get userId and token from AsyncStorage
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");
  
      if (!userId) {
        console.error("User not logged in");
        return;
      }
  
      if (!bookingId) {
        console.error("Booking ID is required");
        return;
      }
  
      // Fetch fare details
      const fareResponse = await axios.get(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/admin-fare/fares",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log("Fare Response Data:", fareResponse.data);
  
      // Get fare details based on selected vehicle
      const fareDetails = fareResponse.data.find(
        (fare) => fare.vehicleType === selectedVehicle
      );
  
      if (!fareDetails) {
        console.error("Fare details not found for selected vehicle type.");
        return;
      }
  
      // Calculate total fare
      const { baseFare, farePerKm, bookingFee } = fareDetails;
      const distanceInKm = distance;
  
      const totalFare = baseFare + farePerKm * distanceInKm + bookingFee;
  
      // Create passenger location object
      const passengerLocation = {
        pickupLocation: {
          latitude: curLoc.latitude,
          longitude: curLoc.longitude,
        },
        destinationLocation: {
          latitude: destinationCords.latitude,
          longitude: destinationCords.longitude,
        },
      };
  
      // Create request body to send to backend
      const requestBody = {
        bookingId: bookingId,
        userId: userId,
        pickupLocation: passengerLocation.pickupLocation,
        destinationLocation: passengerLocation.destinationLocation,
        vehicleType: selectedVehicle,
        rideType: "Shared Ride",
        fare: totalFare,
      };
  
      console.log("Request Body:", requestBody);
  
      // Post request to backend API
      setShowSearching(true); // Show searching UI
      const response = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/join/shared",
        requestBody
      );
  
      console.log("Response Status:", response.status);
  
      // Check if the response was successful
      if (response.status === 201) {
        console.log("Successfully joined the ride", response.data);
        setBookingDetails(response.data.booking); // Set booking details
        setModalVisible(false);
        setSelectedVehicle(false);
        setShowVehicleOptions(false);
      } else {
        console.log("Failed to join the ride:", response.data.message);
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error occurred:", error);
      if (error.response) {
        console.error("Server Response:", error.response.data);
        alert(`Error: ${error.response.data.message || "An error occurred."}`);
      } else if (error.request) {
        console.error("No Response:", error.request);
        alert("No response received from the server. Please try again later.");
      } else {
        console.error("Error Message:", error.message);
        alert("An error occurred. Please try again.");
      }
    }
  };
  
  
  return (
    <View style={styles.container}>
      {distance !== 0 && (
        <View style={{ alignItems: "center", marginVertical: 16 }}></View>
      )}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: 13.3646,
            longitude: 121.9136,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          <Marker.Animated ref={markerRef} coordinate={coordinate}>
            <Image
              source={imagePath.icBike}
              style={{
                width: 40,
                height: 40,
                transform: [{ rotate: `${heading}deg` }],
              }}
              resizeMode="contain"
            />
          </Marker.Animated>

          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              image={imagePath.icGreenMarker}
            />
          )}
          {destinationCords && (
            <Marker
              coordinate={destinationCords}
              image={imagePath.icGreenMarker}
            />
          )}
          {driverLocation && curLoc && (
            <MapViewDirections
              origin={driverLocation}
              destination={curLoc}
              apikey={GOOGLE_MAP_KEY}
              strokeWidth={6}
              strokeColor="black"
              optimizeWaypoints={true}
              onStart={(params) => {
                console.log(
                  `Started routing between "${params.origin}" and "${params.destination}"`
                );
              }}
              onReady={(result) => {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: 30,
                    bottom: 300,
                    left: 30,
                    top: 100,
                  },
                });
              }}
              onError={(errorMessage) => {
                console.error(`MapViewDirections error: ${errorMessage}`);
              }}
            />
          )}

          {destinationCords && curLoc && (
            <MapViewDirections
              origin={curLoc}
              destination={destinationCords}
              apikey={GOOGLE_MAP_KEY}
              strokeWidth={6}
              strokeColor="powderblue"
              optimizeWaypoints={true}
              onStart={(params) => {
                console.log(
                  `Started routing between "${params.origin}" and "${params.destination}"`
                );
              }}
              onReady={(result) => {
                console.log(`Distance: ${result.distance} km`);
                console.log(`Duration: ${result.duration} min.`);
                // Update the distance state
                setDistance(result.distance);
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: 30,
                    bottom: 300,
                    left: 30,
                    top: 100,
                  },
                });
              }}
              onError={(errorMessage) => {
                console.error(`MapViewDirections error: ${errorMessage}`);
              }}
            />
          )}
        </MapView>

        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 0,
            right: 350,
          }}
          onPress={onCenter}
        >
          <Image source={imagePath.greenIndicator} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomCard}>
        {!selectedLocation && (
          <View>
            <Text style={styles.textStyle}>Where are you going..?</Text>
            <TouchableOpacity
              onPress={onPressLocation}
              style={styles.inputStyle}
            >
              <Text>Choose your location</Text>
            </TouchableOpacity>
          </View>
        )}
        {showVehicleOptions && !showSearching && (
          <View style={styles.vehicleOptionsContainer}>
            <Text>Suggested Vehicles</Text>

            {/* Vehicle Selection */}
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleSelectVehicle("Tricycle")}
            >
              <View style={styles.radioCircle}>
                {selectedVehicle === "Tricycle" && (
                  <View style={styles.selectedCircle} />
                )}
              </View>
              <Text>Tricycle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleSelectVehicle("Jeep")}
            >
              <View style={styles.radioCircle}>
                {selectedVehicle === "Jeep" && (
                  <View style={styles.selectedCircle} />
                )}
              </View>
              <Text>Jeep</Text>
            </TouchableOpacity>

            {/* Ride Type Selection */}
            <Text>Ride Type</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "Shared Ride" && styles.activeTab,
                ]}
                onPress={() => handleSelectTab("Shared Ride")}
              >
                <Text>Shared Ride</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "Special" && styles.activeTab,
                ]}
                onPress={() => handleSelectTab("Special")}
              >
                <Text>Special</Text>
              </TouchableOpacity>
            </View>

            {selectedVehicle && activeTab === "Shared Ride" && (
              <View style={styles.tabContent}>
                <Text>
                  {pickupAddress} to {destinationAddress}
                </Text>
                <View style={styles.price}>
                  <Text>32423</Text>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={createSharedRideBooking}
                  >
                    <Text style={styles.joinButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>

                {selectedVehicle && activeTab === "Shared Ride" && (
                  <View style={styles.tabContent}>
                    {acceptedSharedRides
                      .filter((ride) => ride.vehicleType === selectedVehicle)
                      .map((ride) => (
                        <View key={ride._id} style={styles.rideItem}>
                          <Text>
                            {coPassengerPickupAddress} to{" "}
                            {coPassengerDestinationAddress}
                          </Text>
                          <Text>{`Fare: ${ride.fare}`}</Text>
                          <View style={styles.price}>
                            <TouchableOpacity
                              style={styles.joinButton}
                              onPress={() => handleJoinButton(ride._id)}
                            >
                              <Text style={styles.joinButtonText}>Join</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                )}

                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(!modalVisible);
                  }}
                >
                  <View style={styles.modalConfirmContainer}>
                    <View style={styles.modalConfirmContent}>
                      <Text style={styles.modalTitle}>
                        Confirm Joining Shared Ride
                      </Text>
                      <Text>
                        You are about to join a shared ride. Please review the
                        details below.
                      </Text>
                      {selectedRide && (
                        <>
                          <Text style={styles.rideDetails}>
                            {`From: ${coPassengerPickupAddress}\nTo: ${coPassengerDestinationAddress}`}
                          </Text>
                          <Text style={styles.fare}>
                            {`Fare: ${selectedRide.fare}`}
                          </Text>
                        </>
                      )}
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleJoinRide(selectedRide._id)} // Pass bookingId to the function
                      >
                        <Text style={styles.confirmButtonText}>
                          Confirm Join
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setModalVisible(false)} // Close modal
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
            )}

            {selectedVehicle && activeTab === "Special" && (
              <>
                <Text>Available Special Trip</Text>
                <View style={styles.tabContent}>
                  <Text>
                    {pickupAddress} to {destinationAddress}
                  </Text>
                  <View style={styles.price}>
                    <Text>32423</Text>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={createSpecialBooking}
                    >
                      <Text style={styles.joinButtonText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {isLoading && <Loader isLoading={isLoading} />}

        {!bookingDetails?.driver && showSearching && (
          <View style={styles.searchingContainer}>
            <Text style={styles.searchingText}>Searching for a driver...</Text>
          </View>
        )}

        {bookingDetails?.driver &&
          bookingDetails.status === "accepted" &&
          bookingDetails.rideType === "Special" && (
            <View style={styles.acceptedContainer}>
              <View style={styles.acceptedHeader}>
                <Text style={styles.acceptedText}>
                  The driver is on the way to pick you up{" "}
                  <Text>Time left: {time.toFixed(0)}</Text>
                </Text>
              </View>
              <View style={styles.circle} />
              <Text style={{ fontWeight: "700" }}>
                {bookingDetails.driver.name}
              </Text>
              {bookingDetails.driver.vehicleInfo2 && (
                <Text style={{ fontWeight: "700" }}>
                  Plate Number:{" "}
                  {bookingDetails.driver.vehicleInfo2.plateNumber ||
                    "Not Available"}
                </Text>
              )}
              <TouchableOpacity onPress={handleMessage}>
                <Image style={styles.image} source={imagePath.message} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Image style={styles.image} source={imagePath.call} />
              </TouchableOpacity>

              <Text style={{ fontWeight: "700" }}>
                Total Fare: ₱{totalFare.toFixed(2)}
              </Text>
              <Text>Pick up:</Text>
              <Text>
                {bookingDetails.pickupLocation.latitude},{" "}
                {bookingDetails.pickupLocation.longitude}
              </Text>
              <Text>Destination:</Text>
              <Text>
                {bookingDetails.destinationLocation.latitude},{" "}
                {bookingDetails.destinationLocation.longitude}
              </Text>
              <TouchableOpacity onPress={handleCancelBooking}>
                <Text style={styles.cancelButton}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}

          {bookingDetails &&
          bookingDetails?.driver &&
            bookingDetails.status === "accepted" &&
            bookingDetails.rideType === "Shared Ride" && (
              <View style={styles.acceptedContainer}>
                <View style={styles.acceptedHeader}>
                  <Text style={styles.acceptedText}>
                    The driver is on the way to pick you up{" "}
                    <Text>Time left: {time.toFixed(0)}</Text>
                  </Text>
                </View>

                <Text>Shared</Text>
                <View style={styles.circle} />
                <Text style={{ fontWeight: "700" }}>
                  {bookingDetails.driver.name}
                </Text>
                {bookingDetails.driver.vehicleInfo2 && (
                  <Text style={{ fontWeight: "700" }}>
                    Plate Number:{" "}
                    {bookingDetails.driver.vehicleInfo2.plateNumber ||
                      "Not Available"}
                  </Text>
                )}

                <TouchableOpacity onPress={handleMessage}>
                  <Image style={styles.image} source={imagePath.message} />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image style={styles.image} source={imagePath.call} />
                </TouchableOpacity>

                <Text style={{ fontWeight: "700" }}>
                  Total Fare: ₱{totalFare.toFixed(2)}
                </Text>

                <Text>Pick up:</Text>
                <Text>
                  {bookingDetails.pickupLocation.latitude},{" "}
                  {bookingDetails.pickupLocation.longitude}
                </Text>

                <Text>Destination:</Text>
                <Text>
                  {bookingDetails.destinationLocation.latitude},{" "}
                  {bookingDetails.destinationLocation.longitude}
                </Text>

                <TouchableOpacity onPress={handleCancelBooking}>
                  <Text style={styles.cancelButton}>Cancel Booking</Text>
                </TouchableOpacity>

                {/* Ride Details Modal Trigger */}
                <TouchableOpacity
                  onPress={openModal}
                  style={styles.sharedBookingModal}
                >
                  <Text style={styles.rideDetails}>
                    Ride Details{" "}
                    <Icon
                      name="chevron-up"
                      size={12}
                      color="#000"
                      style={styles.communicationIcon}
                    />
                  </Text>
                </TouchableOpacity>

                {/* Modal for Detailed Ride Info */}
                <Modal
                  visible={isModalVisible}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={closeModal}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <View style={styles.modalContent}>
                        {/* Modal Close Button */}
                        <TouchableOpacity
                          onPress={closeModal}
                          style={styles.closeButton}
                        >
                          <Icon
                            name="times"
                            size={18}
                            color="#000"
                            style={styles.closeIcon}
                          />
                        </TouchableOpacity>

                        <Text style={styles.bookingDetailsHeaderText}>
                          Shared Ride Details
                        </Text>

                        <Text>Pickup</Text>
                        <Text>Drop off</Text>

                        <View style={styles.estimatedFares}>
                          <Text style={styles.estimatedFaresText}>
                            Earning Estimate
                          </Text>
                          <Text style={styles.estimatedFaresPrice}>
                            ₱ {totalFare.toFixed(2)}
                          </Text>
                        </View>

                        {/* Co-Passenger Information */}
                        <View style={styles.coPassenger}>
                          <Text>Co-Passengers</Text>
                          {Array.isArray(bookingDetails.copassengers) &&
                          bookingDetails.copassengers.length > 0 ? (
                            bookingDetails.copassengers.map(
                              (copassenger, index) => (
                                <Text
                                  key={`copassenger-${index}`}
                                  style={styles.bookingDetailsText}
                                >
                                  {index + 1}. Co-passenger ID: {copassenger}
                                </Text>
                              )
                            )
                          ) : (
                            <Text>No co-passengers found</Text>
                          )}
                        </View>

                        {Array.isArray(acceptedSharedRides) &&
                          acceptedSharedRides.map((booking, index) => (
                            <Text
                              key={`pickup-${index}`}
                              style={[
                                styles.bookingDetailsText,
                                isPickupConfirmed && { color: "green" },
                              ]}
                            >
                              {index + 1}. Pickup: {booking.name} At{" "}
                              {booking.curLoc}
                            </Text>
                          ))}

                        {Array.isArray(acceptedSharedRides) &&
                          acceptedSharedRides.map((booking, index) => (
                            <Text
                              key={`dropoff-${index}`}
                              style={[
                                styles.bookingDetailsText,
                                isPickupConfirmed && { color: "green" },
                              ]}
                            >
                              {acceptedSharedRides.length + index + 1}. Drop-off:{" "}
                              {booking.name} At {booking.destinationAddress}
                            </Text>
                          ))}
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            )}

        {bookingDetails?.driver &&
          bookingDetails?.status === "completed" &&
          bookingDetails.rideType === "Special" && (
            <View style={styles.completedContainer}>
              <Text style={{ fontWeight: "700", fontSize: 24 }}>
                Payment Summary
              </Text>

              <View style={styles.driverDetails}>
                <View style={styles.circle} />
                <View style={styles.driverInfo}>
                  <Text>Driver: {bookingDetails.driver.name}</Text>
                  <Text>Vehicle: {bookingDetails.vehicleType}</Text>
                  {bookingDetails.driver.vehicleInfo2 && (
                    <Text style={{ fontWeight: "700" }}>
                      {" "}
                      Plate Number:{" "}
                      {bookingDetails.driver.vehicleInfo2.plateNumber}
                    </Text>
                  )}
                </View>
              </View>

              <Text>
                Date: {moment(bookingDetails.createdAt).format("MMMM DD, YYYY")}
              </Text>

              <View style={styles.location}>
                <Text>Pick up:</Text>
                <Text>
                  {bookingDetails.pickupLocation.latitude},{" "}
                  {bookingDetails.pickupLocation.longitude}
                </Text>
                <Text>Destination:</Text>
                <Text>
                  {bookingDetails.destinationLocation.latitude},{" "}
                  {bookingDetails.destinationLocation.longitude}
                </Text>
              </View>

              <View style={styles.fare}>
                {fareDetails?.bookingFee != null && (
                  <Text>
                    Booking Fee: ₱ {fareDetails.bookingFee.toFixed(2)}
                  </Text>
                )}
                {fareDetails?.farePerKm != null && distance != null && (
                  <Text>
                    Distance Fare: ₱{" "}
                    {(fareDetails.farePerKm * distance).toFixed(2)}
                  </Text>
                )}
                {fareDetails?.baseFare != null && (
                  <Text>Base Fare: ₱ {fareDetails.baseFare.toFixed(2)}</Text>
                )}
                {totalFare != null && (
                  <Text>Total Fare: ₱ {totalFare.toFixed(2)}</Text>
                )}
              </View>

              <Text>Rate Your Driver</Text>
              <Text>Overall Experience</Text>
              <View style={styles.ratings}>
                {Array.from({ length: 5 }, (_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRating(index)}
                  >
                    <Image
                      style={styles.image}
                      source={
                        index < rating ? imagePath.starFilled : imagePath.star
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Leave your feedback here..."
                value={feedback}
                onChangeText={setFeedback}
              />
              <TouchableOpacity onPress={handleReport} style={styles.report}>
                <Text style={styles.report}>Report the driver</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

        {bookingDetails?.driver &&
          bookingDetails?.status === "completed" &&
          bookingDetails.rideType === "Shared Ride" && (
            <View style={styles.completedContainer}>
              <Text style={{ fontWeight: "700", fontSize: 24 }}>
                Payment Summary
              </Text>

              <View style={styles.driverDetails}>
                <View style={styles.circle} />
                <View style={styles.driverInfo}>
                  <Text>Driver: {bookingDetails.driver.name}</Text>
                  <Text>Vehicle: {bookingDetails.vehicleType}</Text>
                  {bookingDetails.driver.vehicleInfo2 && (
                    <Text style={{ fontWeight: "700" }}>
                      {" "}
                      Plate Number:{" "}
                      {bookingDetails.driver.vehicleInfo2.plateNumber}
                    </Text>
                  )}
                </View>
              </View>

              <Text>
                Date: {moment(bookingDetails.createdAt).format("MMMM DD, YYYY")}
              </Text>

              <View style={styles.location}>
                <Text>Pick up:</Text>
                <Text>
                  {bookingDetails.pickupLocation.latitude},{" "}
                  {bookingDetails.pickupLocation.longitude}
                </Text>
                <Text>Destination:</Text>
                <Text>
                  {bookingDetails.destinationLocation.latitude},{" "}
                  {bookingDetails.destinationLocation.longitude}
                </Text>
              </View>

              <View style={styles.fare}>
                {fareDetails?.bookingFee != null && (
                  <Text>
                    Booking Fee: ₱ {fareDetails.bookingFee.toFixed(2)}
                  </Text>
                )}
                {fareDetails?.farePerKm != null && distance != null && (
                  <Text>
                    Distance Fare: ₱{" "}
                    {(fareDetails.farePerKm * distance).toFixed(2)}
                  </Text>
                )}
                {fareDetails?.baseFare != null && (
                  <Text>Base Fare: ₱ {fareDetails.baseFare.toFixed(2)}</Text>
                )}
                {totalFare != null && (
                  <Text>Total Fare: ₱ {totalFare.toFixed(2)}</Text>
                )}
              </View>

              <Text>Rate Your Driver</Text>
              <Text>Overall Experience</Text>
              <View style={styles.ratings}>
                {Array.from({ length: 5 }, (_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRating(index)}
                  >
                    <Image
                      style={styles.image}
                      source={
                        index < rating ? imagePath.starFilled : imagePath.star
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Leave your feedback here..."
                value={feedback}
                onChangeText={setFeedback}
              />
              <TouchableOpacity onPress={handleReport} style={styles.report}>
                <Text style={styles.report}>Report the driver</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  closeDetailsButton: {
    position: "absolute",
    right: 0,
    zIndex: 1, // Ensure the button is above other content
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    height: 300,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    maxHeight: "100%",
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    backgroundColor: "white",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    minHeight: 300,
    maxHeight: "100%",
    overflow: "hidden",
  },
  modalConfirmContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalConfirmContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5, // Shadow effect for Android
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  rideDetails: {
    marginBottom: 10,
  },
  fare: {
    marginBottom: 20,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  confirmButtonText: {
    color: "white",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: "white",
    textAlign: "center",
  },
  joinButton: {
    padding: 10,
    backgroundColor: "black",
  },
  joinButtonText: {
    color: "white",
  },
  price: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  vehicleOptionsContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  selectedCircle: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#007bff",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  tab: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    flex: 1,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#007bff",
    color: "#fff",
  },
  tabContent: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  bottomCard: {
    backgroundColor: "white",
    width: "100%",
    padding: 30,
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    elevation: 15,
  },
  inpuStyle: {
    backgroundColor: "#F3F3F3",
    borderRadius: 4,
    padding: 8,
    marginTop: 16,
  },
  vehicleOptionsContainer: {
    marginTop: 16,
  },
  createBookingButton: {
    backgroundColor: "blue",
    padding: 16,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
  },
  createBookingButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  searchingContainer: {
    alignItems: "center",
  },
  bookingDetailsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F3F3F3",
    borderRadius: 4,
  },
  driverDetailsContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#E3E3E3",
    borderRadius: 4,
  },
  cancelButton: {
    padding: 20,
    backgroundColor: "powderblue",
  },
  vehicleOptionsContainer: {
    backgroundColor: "white",
    borderRadius: 8,
  },
  acceptedHeader: {
    backgroundColor: "#f3f3f3",
    marginTop: -30,
    marginLeft: -30,
    marginRight: -30,
    height: 40,
    justifyContent: "center",
  },
  acceptedText: {
    marginLeft: 40,
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  driverDetails: {
    display: "flex",
    flexDirection: "row",
    paddingTop: 40,
    paddingBottom: 20,
    gap: 20,
  },
  driverInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  location: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  fare: {
    paddingBottom: 20,
  },
  vehicleOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  selectedOption: {
    backgroundColor: "#f0f0f0",
  },
  bookButton: {
    backgroundColor: "lightblue",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  completedContainer: {
    height: "100%",
    padding: 20,
  },
  paymentContainer: {
    paddingBottom: 40,
  },
  button: {
    width: 320,
    height: 40,
    backgroundColor: "powderblue",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  image: {
    width: 30,
    height: 30,
  },
  report: {
    color: "blue",
  },
  ratings: {
    flexDirection: "row",
  },
  textStyle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  inputStyle: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    padding: 12,
    borderWidth: 1,
  },
  report: {
    paddingTop: 12,
    paddingBottom: 12,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});
export default Home;
