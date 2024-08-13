import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import { GOOGLE_MAP_KEY } from "../../constants/googleMapKey";
import imagePath from "../../constants/imagePath";
import MapViewDirections from "react-native-maps-directions";
import Loader from "../../components/Loader";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
} from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from 'moment';
import RNPickerSelect from 'react-native-picker-select';

const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Home = ({ navigation, route,  onSelectVehicle }) => {
  const mapRef = useRef();
  const markerRef = useRef();
  const [showSearching, setShowSearching] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fareDetails, setFareDetails] = useState(null);
  const [totalFare, setTotalFare] = useState(null);
  const [selectPaymentMethod, setSelectPaymentMethod] = useState(null);

  const [state, setState] = useState({
    curLoc: {
      latitude: 13.3646, // Default to Marinduque latitude
      longitude: 121.9136,
    },
    destinationCords: {},
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
    showVehicleOptions: false,
  });


  
  const {
    curLoc,
    time,
    distance,
    destinationCords,
    isLoading,
    coordinate,
    heading,
    showVehicleOptions,
  } = state;

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
      updateState({
        destinationCords: route.params.destinationCords,
        showVehicleOptions: true,
      });
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
        errorMessage: error.message, // Handle errors
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

      // Prepare data for booking
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

      // Start polling for updates
      startPolling(response.data._id, token);
    } catch (error) {
      console.error("Error creating booking:", error);
      // Handle error scenario
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
        setBookingDetails(bookingResponse.data);
      } catch (error) {
        console.error("Error fetching booking details:", error);
      }
    }, 2000); // Poll every 5 seconds

    setPollingInterval(intervalId);
  };

  useEffect(() => {
    // Clear polling interval on component unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <View style={styles.container}>
      {/* {distance !== 0 && time !== 0 && (
        <View style={{ alignItems: "center", marginVertical: 16 }}>
        </View>
      )} */}
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
  zoomEnabled={true} // Enable zoom the map
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

          {Object.keys(destinationCords).length > 0 && (
            <Marker
              coordinate={destinationCords}
              image={imagePath.icGreenMarker}
            />
          )}

          {Object.keys(destinationCords).length > 0 && (
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
                fetchTime(result.distance, result.duration);
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
                // console.log('GOT AN ERROR');
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
        {!showVehicleOptions && !showSearching && (
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
        style={[styles.vehicleOption, selectedVehicle === 'Tricycle' && styles.selectedOption]}
        onPress={() => handleSelectVehicle('Tricycle')}
      >
        <Text>Tricycle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.vehicleOption, selectedVehicle === 'Jeep' && styles.selectedOption]}
        onPress={() => handleSelectVehicle('Jeep')}
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
        The driver is on the way to pick you up <Text>Time left: {time.toFixed(0)}</Text>
      </Text>
    </View>
    <View style={styles.circle}/>
    <Text style={{ fontWeight: '700' }}>{bookingDetails.driver.name}</Text>
    {bookingDetails.driver.vehicleInfo2 && (
      <Text style={{ fontWeight: '700' }}>
        Plate Number: {bookingDetails.driver.vehicleInfo2.plateNumber || 'Not Available'}
      </Text>
    )}
    <Text style={{ fontWeight: '700' }}>Total Fare: ₱{totalFare.toFixed(2)}</Text>
    <Text>Pick up:</Text>
    <Text>{bookingDetails.pickupLocation.latitude}, {bookingDetails.pickupLocation.longitude}</Text>
    <Text>Destination:</Text>
    <Text>{bookingDetails.destinationLocation.latitude}, {bookingDetails.destinationLocation.longitude}</Text>
    <TouchableOpacity>
      <Text style={styles.cancelButton}>Cancel Booking</Text>
    </TouchableOpacity>
  </View>
)}



        {bookingDetails?.status === "completed" &&  bookingDetails?.driver && (
          <View style={styles.completedContainer}>
            <Text style={{fontWeight: '700', fontSize: 24}}>Payment Summary</Text>

            <View style={styles.driverDetails}>
            <View style={styles.circle}/>
            <View style={styles.driverInfo}>
            <Text>Driver: {bookingDetails.driver.name}</Text>
            <Text>Vehicle: {bookingDetails.vehicleType}</Text>
            {bookingDetails.driver.vehicleInfo2 && (
      <Text style={{ fontWeight: '700' }}>
        Plate Number: {bookingDetails.driver.vehicleInfo2.plateNumber || 'Not Available'}
      </Text>
    )}
            </View>
            </View>
            <Text>Date: {moment(bookingDetails.createdAt).format('MMMM DD, YYYY')}</Text>

            <View style={styles.location}>
            <Text>
              Pick up: 
            </Text>
            <Text>{bookingDetails.pickupLocation.latitude},{" "}
            {bookingDetails.pickupLocation.longitude}</Text>
            <Text>
              Destination: 
            </Text>
            <Text>{bookingDetails.destinationLocation.latitude},{" "}
            {bookingDetails.destinationLocation.longitude}</Text>
            </View>

            <View style={styles.fare}>
            <Text>Distance: {distance.toFixed(2)} km</Text>
            <Text>Booking Fee: ₱{fareDetails?.bookingFee.toFixed(2)}</Text>
            <Text>
              Distance Fare: ₱{(fareDetails?.farePerKm * distance).toFixed(2)}
            </Text>
            <Text>Base Fare: ₱{fareDetails?.baseFare.toFixed(2)}</Text>
            <Text>Total Fare: ₱{totalFare.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentContainer}>
      <Text style={styles.label}>Select Payment Method:</Text>
      <RNPickerSelect
        onValueChange={(value) => setSelectPaymentMethod(value)}
        items={[
          { label: 'Cash', value: 'Cash' },
          { label: 'GCash', value: 'GCash' },
        ]}
        style={pickerSelectStyles}
      />
    </View>
            <Text>Rate Your Driver</Text>
            <Text>Overall Experience</Text>
            <TouchableOpacity style={styles.button}>
              <Text>Submit</Text>
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
    backgroundColor: 'white'
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
    backgroundColor: 'white',
    borderRadius: 8,
  },
  acceptedHeader: {
    backgroundColor: '#f3f3f3',
    marginTop: -30,
    marginLeft: -30,
    marginRight: -30,
    height: 40,
    justifyContent: 'center'
  },
  acceptedText: {
    marginLeft: 40
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 30, // Ensure the circle is properly rounded
    justifyContent: "center",
    alignItems: "center",
  },
  driverDetails: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 40,
    paddingBottom: 20,
    gap:20
  },
  driverInfo: {
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#ccc',
    borderRadius: 4,
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  bookButton: {
    backgroundColor: 'lightblue',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  completedContainer: {
    height: '100%',
    padding: 20
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
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, 
  },
});
export default Home;
