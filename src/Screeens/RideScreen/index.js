import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
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
  const [showSearching, setShowSearching] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleOptions, setShowVehicleOptions] = useState(false);
  const [fareDetails, setFareDetails] = useState(null);
  const [totalFare, setTotalFare] = useState(null);
  const [selectPaymentMethod, setSelectPaymentMethod] = useState(null);
  const [destinationCords, setDestinationCords] = useState(null);
  const [showDirections, setShowDirections] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

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
    distance: 0,
    heading: 0,
  });

  const { curLoc, time, distance, isLoading, coordinate, heading } = state;

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
    navigation.navigate("chooseLocation");
    setShowSearching(false);
    setShowVehicleOptions(true);
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
    updateState({
      distance: d,
      time: t,
    });
  };

  const createBooking = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        console.error("No token or user ID found.");
        return;
      }

      //fare details
      const fareResponse = await axios.get(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/admin-fare/fares",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fareDetails = fareResponse.data.find(
        (fare) => fare.vehicleType === selectedVehicle
      );

      if (!fareDetails) {
        console.error("Fare details not found for selected vehicle type.");
        return;
      }

      const { baseFare, farePerKm, bookingFee } = fareDetails;

      // Calculate total fare
      const distanceInKm = distance; // distance in kilometers
      const totalFare = baseFare + farePerKm * distanceInKm + bookingFee;

      const bookingData = {
        userId: userId,
        pickupLocation: {
          latitude: curLoc.latitude,
          longitude: curLoc.longitude,
        },
        destinationLocation: destinationCords,
        fare: totalFare,
        vehicleType: selectedVehicle,
      };

      const response = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/create",
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

          if (driverId) {
            console.log("Booking completed:", bookingDetails);
            console.log("Driver ID:", driverId);

            await AsyncStorage.setItem("driverId", driverId.toString());
            console.log("Driver ID saved:", driverId);

            clearInterval(intervalId);
          } else {
            console.log("Driver ID not found in booking details.");
          }
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      }
    }, 2000);

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

  return (
    <View style={styles.container}>
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
            />
          </Marker.Animated>
          {destinationCords && (
            <Marker
              coordinate={destinationCords}
              image={imagePath.icGreenMarker}
            />
          )}
          {destinationCords && showDirections && (
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
                // Replace with your own function to handle the result
                // fetchTime(result.distance, result.duration);
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
        {!showVehicleOptions && (
          <View>
            <Text>Where are you going..?</Text>
            <TouchableOpacity
              onPress={onPressLocation}
              style={styles.inpuStyle}
            >
              <Text>Choose your location</Text>
            </TouchableOpacity>
          </View>
        )}
        {showVehicleOptions && !showSearching && (
          <View style={styles.vehicleOptionsContainer}>
            <Text>Suggested Vehicles</Text>
            <TouchableOpacity
              style={[
                styles.vehicleOption,
                selectedVehicle === "Tricycle" && styles.selectedOption,
              ]}
              onPress={() => handleSelectVehicle("Tricycle")}
            >
              <Text>Tricycle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.vehicleOption,
                selectedVehicle === "Jeep" && styles.selectedOption,
              ]}
              onPress={() => handleSelectVehicle("Jeep")}
            >
              <Text>Jeep</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createBooking} style={styles.bookButton}>
              <Text>Book {selectedVehicle} </Text>
            </TouchableOpacity>
          </View>
        )}
        {isLoading && <Loader isLoading={isLoading} />}

        {!bookingDetails?.driver && showSearching && (
          <View style={styles.searchingContainer}>
            <Text style={styles.searchingText}>Searching for a driver...</Text>
          </View>
        )}

        {bookingDetails?.driver && bookingDetails.status === "accepted" && (
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

        {bookingDetails?.driver && bookingDetails?.status === "completed" && (
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
                    Plate Number:{" "}
                    {bookingDetails.driver.vehicleInfo2.plateNumber ||
                      "Not Available"}
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
              {fareDetails?.bookingFee && (
                <Text>Booking Fee: ₱{fareDetails.bookingFee.toFixed(2)}</Text>
              )}
              {fareDetails?.farePerKm && distance && (
                <Text>
                  Distance Fare: ₱
                  {(fareDetails.farePerKm * distance).toFixed(2)}
                </Text>
              )}
              {fareDetails?.baseFare && (
                <Text>Base Fare: ₱{fareDetails.baseFare.toFixed(2)}</Text>
              )}
              {totalFare && <Text>Total Fare: ₱{totalFare.toFixed(2)}</Text>}
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
            <TouchableOpacity onPress={handleReport}>
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
