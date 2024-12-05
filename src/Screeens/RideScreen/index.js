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
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Picker } from "@react-native-picker/picker";
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
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import haversine from "haversine-distance";
import * as ImagePicker from "expo-image-picker";

const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Home = ({ navigation, route, onSelectVehicle }) => {
  const [modalCancelVisible, setCancelModalVisible] = useState(false);
  const [selectedSpecialTripPassenger, setSelectedSpecialTripPassenger] = useState(null);
  const [selectReason, setSelectReason] = useState("");
  const mapRef = useRef();
  const markerRef = useRef();
  const [waitingForDriver, setWaitingForDriver] = useState(false);
  const [showSearching, setShowSearching] = useState(false);
  const [driverDuration, setDriverDuration] = useState(0);
  const [driverDurationArrival, setDriverDurationArrival] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookingCopassengerDetails, setBookingCopassengerDetails] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [showVehicleOptions, setShowVehicleOptions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [fareDetails, setFareDetails] = useState(null);
  const [totalFare, setTotalFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [destinationCords, setDestinationCords] = useState(null);
  const [rating, setRating] = useState(0);
  const [modalCancelSharedVisible, setCancelSharedModalVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [selectedRideType, setSelectedRideType] = useState(null);
  const [activeTab, setActiveTab] = useState("Shared Ride");
  const [pickupAddress, setPickupAddress] = useState("Pickup location not available");
  const [destinationAddress, setDestinationAddress] = useState("Destination location not available");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [image, setImage] = useState(null);
  const [acceptedSharedRides, setAcceptedSharedRides] = useState([]);
  const [coPassengerAddresses, setCoPassengerAddresses] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const responseListener = useRef(null);
  const [driverRating, setDriverRating] = useState(null);
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const [selectedCopassenger, setSelectedCopassenger] = useState(null);
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.granted) {
        console.log("Permission granted");
      } else {
        console.log("Permission denied");
      }
    })();
  }, []);

  const handleJoinButton = (ride) => {
    setSelectedRide(ride);
    setModalVisible(true);
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        updateState({
          errorMessage: "Permission to access location was denied",
        });
        return;
      }
      const location = await getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
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

      if (!userId) {
        console.error("No token or user ID found.");
        return;
      }
      const fareResponse = await axios.get(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/admin-fare/fares",
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
        paymentMethod: null,
        receiptImage: null,
      };

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/create/special",
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

      await AsyncStorage.setItem("bookingId", response.data._id);
      console.log("Booking ID saved to AsyncStorage:", response.data._id);

      const bookingResponse = await axios.get(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/booking/${response.data._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookingDetails(bookingResponse.data);
      setFareDetails(fareDetails);
      setTotalFare(totalFare);
      setShowSearching(true);
      setWaitingForDriver(true);
      setSubmitted(false);
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

      const fareResponse = await axios.get(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/admin-fare/fares",
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
        rideAction: "Create",
        rideType: "Shared Ride",
      };

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/create/shared",
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
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/booking/${response.data._id}`,
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
      setSubmitted(false);
      startPolling(response.data._id, token);
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const openSpecialCancelModal = (special) => {
    console.log("Opening modal for parent:", special);
    setSelectedSpecialTripPassenger(special);
    setCancelModalVisible(true);
  };

  const closeSpecialTripCancelModal = () => {
    setCancelModalVisible(false);
    setSelectedSpecialTripPassenger(null);
  };
  const openSharedCancelModal = (shared) => {
    console.log("Opening modal for parent:", shared);
    setSelectedParent(shared);
    setCancelSharedModalVisible(true);
  };

  const closeSharedTripCancelModal = () => {
    setCancelSharedModalVisible(false);
    setSelectedParent(null);
  };

  const handleCancelBooking = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      console.log("userId", userId);
      if (!token || !userId) {
        console.error("No token or user ID found.");
        return;
      }

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/cancel/cancel`,
        {
          bookingId: bookingDetails._id,
          canceledBy: userId,
          reason: selectReason,
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
        setSelectReason(null);
        setBookingDetails(null);
        setFareDetails(null);
        setTotalFare(null);
        setShowSearching(false);
        setDestinationCords(null);
        setSelectedLocation(null);
        setSelectedVehicle(null);
        setAcceptedSharedRides([]);
        setSelectedRide(null);
        setSelectedPaymentMethod("");
        setFeedback("");
        setRating(0);
        setImage(null);
        setShowVehicleOptions(false);
        setWaitingForDriver(false);
        setPickupAddress("");
        setDestinationAddress("");
        setActiveTab(null);
        setModalVisible(false);
        closeSpecialTripCancelModal();
        closeSharedTripCancelModal();
        alert("Your booking has been canceled.");
      } else {
        throw new Error("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("Failed to cancel the booking. Please try again.");
    }
  };

  const openDropoffModal = (copassenger) => {
    console.log("Opening modal for copassenger drop off:", copassenger);
    setSelectedCopassenger(copassenger);
    setConfirmationModalVisible(true);
  };

  const closeDropoffModal = () => {
    setConfirmationModalVisible(false); 
    setSelectedCopassenger(null); 
  };

  const handleCoPassengerCancelBooking = async () => {
    try {
      console.log("userId", bookingCopassengerDetails.user);
      console.log("bookingId", bookingCopassengerDetails._id);
      console.log("reason", selectReason);
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        console.error("No token or user ID found.");
        return;
      }

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/cancel-copassenger`,
        {
          bookingId: bookingCopassengerDetails._id,
          canceledBy: bookingCopassengerDetails.user,
          canceledByType: "User",
          reason: selectReason,
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

        setBookingCopassengerDetails(null);
        setFareDetails(null);
        setTotalFare(null);
        setShowSearching(false);
        setDestinationCords(null);
        setSelectedLocation(null);
        setSelectedVehicle(null);
        setAcceptedSharedRides([]);
        setSelectedRide(null);
        setSelectedPaymentMethod("");
        setFeedback("");
        setRating(0);
        setImage(null);
        setShowVehicleOptions(false);
        setWaitingForDriver(false);
        setPickupAddress("");
        setDestinationAddress("");
        setActiveTab(null);
        setModalVisible(false);
        closeSpecialTripCancelModal();
        closeSharedTripCancelModal();
        alert("Your booking has been canceled.");
      } else {
        throw new Error("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("Failed to cancel the booking. Please try again.");
    }
  };
  const startPolling = (bookingId, token, rideAction) => {
    const intervalId = setInterval(async () => {
      try {
        const bookingResponse = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/booking/${bookingId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const bookingDetails = bookingResponse.data;

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
          const driverLocation = bookingDetails.driverLocation;
          if (driverLocation) {
            setDriverLocation(driverLocation);
          }
        } else if (bookingDetails.status === "canceled") {
          console.log("Booking canceled by:", bookingDetails.driver._id);

          if (bookingDetails.cancellation.canceledByType === "User") {
            console.log(
              "Cancellation initiated by the user. No navigation will occur."
            );
            clearInterval(intervalId);
            setShowSearching(false);
            setWaitingForDriver(false);
            setBookingDetails(null);
            setShowVehicleOptions(false);
            return;
          }
          const rideAction = bookingDetails.rideAction;
          const rideType = bookingDetails.rideType;
          const driverId = bookingDetails.driver._id;
          const bookingId = bookingDetails._id;
          const userId = bookingDetails.user;
          const fare = bookingDetails.fare;
          const reason = bookingDetails.cancellation.reason;
          const date = bookingDetails.cancellation.timestamp;
          await AsyncStorage.removeItem("driverId");
          console.log("Driver ID removed from AsyncStorage");

          clearInterval(intervalId);
          setShowSearching(false);
          setWaitingForDriver(false);
          setBookingDetails(null);
          setShowVehicleOptions(false);
          if (navigation && navigation.navigate) {
            navigation.navigate("Cancelled", {
              date: date,
              reason: reason,
              bookingId: bookingId,
              driverId: driverId,
              userId: userId,
              pickupLocation: curLoc,
              destinationLocation: destinationCords,
              fare: fare,
              vehicleType: selectedVehicle,
              rideType: rideType,
              paymentMethod: null,
              receiptImage: null,
              rideAction: rideAction,
            });
          } else {
            console.error("Navigation is undefined or not available.");
          }
        }
      } catch (error) {
        console.error("Error fetching booking details:", error.message);
      }
    }, 3000);

    setPollingInterval(intervalId);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [driverLocation]);

  useEffect(() => {
    if (route.params?.resetStates) {
      console.log("Resetting Home screen states based on passed params");
      setSelectedLocation(route.params.selectedLocation);
      setShowVehicleOptions(route.params.showVehicleOptions);
      setShowSearching(route.params.showSearching);
      setWaitingForDriver(route.params.waitingForDriver);
      setPickupAddress(route.params.pickupAddress);
      setDestinationAddress(route.params.destinationAddress);
      setActiveTab(route.params.activeTab);
      setModalVisible(route.params.modalVisible);
      setSubmitted(route.params.submitted);
    }
  }, [route.params]);

  useEffect(() => {
    if (route.params?.rebookState) {
      console.log("Booking Details:", route.params.bookingDetails);
      console.log(
        "Booking ID from bookingDetails:",
        route.params.bookingDetails?._id
      );
      setShowVehicleOptions(route.params.showVehicleOptions);
      setShowSearching(route.params.showSearching);
      setWaitingForDriver(route.params.waitingForDriver);
      setBookingDetails(route.params.bookingDetails);

      const { _id } = route.params.bookingDetails || {};

      if (_id) {
        startPolling(_id, setBookingDetails);
      }
    }
  }, [route.params]);

  const handleMessage = () => {
    const driverId = bookingDetails?.driver?._id;
    if (driverId) {
      navigation.navigate("MessageScreen", { driverId });
    } else {
      console.error("Driver ID is missing.");
      Alert.alert("Error", "Unable to send a message to the driver.");
    }
  };

  const handleCopassengerMessage = async () => {
    try {
      const driverId = bookingCopassengerDetails?.driver?._id;
      if (driverId) {
        navigation.navigate("MessageScreen", { driverId });
      } else {
        console.error("Driver ID is missing.");
        Alert.alert("Error", "Unable to send a message to the driver.");
      }
    } catch (error) {
      console.error("Error in handleMessage:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const handleRating = (index) => {
    setRating(index + 1);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
    });
    if (!result.cancelled) {
      setImage(result.assets[0]);
    }

    console.log("Driver ID:", driverId);
    console.log("Subscription Type:", subscriptionType);
    console.log(
      "Vehicle Type:",
      vehicleInfo2 ? vehicleInfo2.vehicleType : "Loading..."
    );
  };
  const uploadReceiptImage = async (image) => {
    if (!image || !image.uri) {
      console.error("Invalid image object or URI:", image);
      return null;
    }

    console.log("Image object:", image); 

    const fileName = image.uri.split("/").pop() || "default.jpg";
    console.log("Extracted file name:", fileName); 

    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      name: fileName,
      type: "image/jpeg",
    });

    try {
      console.log("Starting file upload...");

      const fileResponse = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/upload-receipt",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("File upload response:", fileResponse.data); 

      if (fileResponse.data && fileResponse.data.signedUrl) {
        console.log("Signed URL:", fileResponse.data.signedUrl);
        return fileResponse.data.signedUrl;
      } else {
        console.error("No signed URL in response:", fileResponse.data);
        return null;
      }
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("Starting submission process...");
      const paymentMethod = selectedPaymentMethod;

      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      const driverId = bookingDetails?.driver?._id;
      const bookingId = bookingDetails?._id;

      if (!token || !userId || !driverId || !bookingId) {
        Alert.alert("Error", "Missing required information.");
        return;
      }

      console.log("Image being passed to upload:", image);
      let signedUrl = await uploadReceiptImage(image);

      const paymentData = {
        paymentMethod: paymentMethod,
        receiptImage: signedUrl,
      };
      console.log("Payment data being sent:", paymentData);

      const paymentResponse = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/choose-payment/${bookingId}`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (paymentResponse.status === 200) {
        console.log("Payment updated successfully:", paymentResponse.data);
        Alert.alert("Success", "Payment method updated successfully.");
      } else {
        throw new Error("Failed to update payment method.");
      }

      // Submit rating
      console.log("Submitting rating...");
      const ratingResponse = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/rate/ratings`,
        {
          bookingId,
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

      if (ratingResponse.status === 201) {
        console.log("Rating submitted successfully:", ratingResponse.data);

        setBookingDetails(null);
        setSelectedLocation(null);
        setSelectedVehicle(null);
        setAcceptedSharedRides([]);
        setSelectedRide(null);
        setSelectedPaymentMethod("");
        setFeedback("");
        setRating(0);
        setImage(null);
        setShowVehicleOptions(false);
        setShowSearching(false);
        setWaitingForDriver(false);
        setPickupAddress("");
        setDestinationAddress("");

        setActiveTab(null);
        setModalVisible(false);

        setSubmitted(true);
        await AsyncStorage.removeItem("bookingId");
        await AsyncStorage.removeItem("driverId"); 

        navigation.navigate("chooseLocation");
      } else {
        throw new Error("Failed to submit rating.");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      Alert.alert("Error", `An error occurred: ${error.message}`);
    }
  };

  const handleSharedSubmitPayment = async () => {
    try {
      console.log("Starting submission process...");
      const paymentMethod = selectedPaymentMethod;
      // Validate required fields
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      const driverId = bookingCopassengerDetails?.driver?._id;
      const bookingId = bookingCopassengerDetails?._id;

      if (!token || !userId || !driverId || !bookingId) {
        Alert.alert("Error", "Missing required information.");
        return;
      }
      console.log("Image being passed to upload:", image);
      let signedUrl = await uploadReceiptImage(image);

      const paymentData = {
        paymentMethod: paymentMethod,
        receiptImage: signedUrl,
      };
      console.log("Payment data being sent:", paymentData);
      const paymentResponse = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/choose-payment/${bookingId}`,
        paymentData,
        {}
      );

      if (paymentResponse.status === 200) {
        console.log("Payment updated successfully:", paymentResponse.data);
        Alert.alert("Success", "Payment method updated successfully.");
      } else {
        throw new Error("Failed to update payment method.");
      }

      console.log("Submitting rating...");
      const ratingResponse = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/rate/ratings`,
        {
          bookingId,
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

      if (ratingResponse.status === 201) {
        console.log("Rating submitted successfully:", ratingResponse.data);

        bookingCopassengerDetails(null);
        setSelectedLocation(null);
        setSelectedVehicle(null);
        setAcceptedSharedRides([]);
        setSelectedRide(null);
        setSelectedPaymentMethod("");
        setFeedback("");
        setRating(0);
        setImage(null);
        setShowVehicleOptions(false);
        setShowSearching(false);
        setWaitingForDriver(false);
        setPickupAddress("");
        setDestinationAddress("");
        setCoPassengerAddresses(null);

        setActiveTab(null);
        setModalVisible(false);

        setSubmitted(true);
        await AsyncStorage.removeItem("bookingId");
        await AsyncStorage.removeItem("driverId");

        navigation.navigate("Home");
      } else {
        throw new Error("Failed to submit rating.");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      Alert.alert("Error", `An error occurred: ${error.message}`);
    }
  };

  const handleReport = () => {
    navigation.navigate("ReportScreen", {
      driverId: bookingDetails.driver._id,
    });
  };

  useEffect(() => {
    console.log(
      "useEffect triggered with route.params?.destinationCords:",
      route.params?.destinationCords
    );

    if (route.params?.destinationCords) {
      console.log(
        "Destination coordinates received:",
        route.params.destinationCords
      );

      setSelectedLocation("Your Selected Location");
      setShowVehicleOptions(true);

      console.log("Updated selectedLocation:", "Your Selected Location");
      console.log("Updated showVehicleOptions:", true);
    } else {
      console.log("No destination coordinates provided.");
    }
  }, [route.params?.destinationCords]);

  console.log("selectedLocation:", selectedLocation);
  console.log("showVehicleOptions:", showVehicleOptions);
  console.log("showSearching:", showSearching);
  console.log("waitingForDriver:", waitingForDriver);

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
        const response = await axios.get(
          "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/available/shared"
        );

        const { data } = response.data;
        const filteredRides = data.filter((ride) => {
          const driverLocation = ride.driverLocation;
          if (
            !driverLocation ||
            !driverLocation.latitude ||
            !driverLocation.longitude
          ) {
            console.warn(`Invalid driver location for ride ID: ${ride._id}`);
            return false;
          }

          const distance = haversine(
            { latitude: curLoc.latitude, longitude: curLoc.longitude },
            {
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }
          );

          console.log(
            `Ride ID: ${ride._id}, Distance to driver: ${distance} meters`
          );
          return ride.status === "accepted" && distance <= 500; // 500 meters
        });

        console.log("Filtered Rides:", filteredRides);

        const ridesInfo = await Promise.all(
          filteredRides.map(async (ride) => {
            const pickup = await getCoPassengerAddress(
              ride.pickupLocation.latitude,
              ride.pickupLocation.longitude
            );
            const destination = await getCoPassengerAddress(
              ride.destinationLocation.latitude,
              ride.destinationLocation.longitude
            );

            return {
              ...ride,
              pickupAddress: pickup,
              destinationAddress: destination,
            };
          })
        );

        setAcceptedSharedRides(ridesInfo);
      } catch (error) {
        console.error("Error fetching available rides:", error);
      }
    };

    fetchAvailableRides();
  }, [curLoc]);

  const handleJoinRide = async (bookingId) => {
    try {
      console.log("Current Location:", curLoc);
      console.log("Destination Coordinates:", destinationCords);

      // Validate current location and destination coordinates
      if (!curLoc || !destinationCords) {
        console.error("Current location and destination location are required");
        alert("Please provide both current and destination locations.");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");

      if (!userId) {
        console.error("User not logged in or token missing");
        alert("You are not logged in. Please log in to proceed.");
        return;
      }

      console.log("userId:", userId, "token:", token);

      if (!bookingId) {
        console.error("Booking ID is required");
        alert("Booking ID is missing.");
        return;
      }

      // Fetch fare details
      const fareResponse = await axios.get(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/admin-fare/fares",
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
        alert("Fare details not found for the selected vehicle.");
        return;
      }

      if (typeof distance !== "number" || distance <= 0) {
        console.error("Invalid distance value:", distance);
        alert("Invalid distance value.");
        return;
      }

      const { baseFare, farePerKm, bookingFee } = fareDetails;
      const totalFare = baseFare + farePerKm * distance + bookingFee;

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

      const requestBody = {
        bookingId: bookingId,
        userId: userId,
        pickupLocation: passengerLocation.pickupLocation,
        destinationLocation: passengerLocation.destinationLocation,
        vehicleType: selectedVehicle,
        rideType: "Shared Ride",
        rideAction: "Join",
        fare: totalFare,
      };

      console.log("Request Body:", requestBody);

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/join/shared",
        requestBody
      );

      console.log("Response Status:", response.status);
      console.log("Response Data:", response.data);

      const bookingResponse = await axios.get(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/booking/${response.data.bookingId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Booking Response Data:", bookingResponse.data);
      setBookingCopassengerDetails({
        bookingId: response.data.bookingId,
        ...bookingResponse.data,
      });
      setModalVisible(false);
      setSelectedVehicle(false);
      setShowSearching(true); 
      setShowVehicleOptions(false);
      setWaitingForDriver(true);
      setSubmitted(false);
      startJoinPolling(response.data.bookingId, token);

      console.log("bookingCopassengerDetails", bookingCopassengerDetails);
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

  const startJoinPolling = async (bookingId, token) => {
    try {
      const intervalId = setInterval(async () => {
        try {
          const bookingResponse = await axios.get(
            `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/booking/${bookingId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Booking Response Data:", bookingResponse.data);

          setBookingCopassengerDetails(bookingResponse.data);

          if (bookingResponse.data.status === "completed") {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error during polling:", error);
        }
      }, 5000);
    } catch (error) {
      console.error("Error starting polling:", error);
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
              title="Driver Location"
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
                console.log(`Distance: ${result.distance} km`);
                console.log(`Duration: ${result.duration} min.`);

                setDriverDurationArrival(result.duration);
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

                setDistance(result.distance);
                setDriverDuration(result.duration);
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
        {showVehicleOptions &&
          selectedLocation &&
          !showSearching &&
          !waitingForDriver && (
            <View style={styles.vehicleOptionsContainer}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                Suggested Vehicles
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  padding: 10,
                }}
              >
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleSelectVehicle("Tricycle")}
                >
                  <View style={styles.radioCircle}>
                    {selectedVehicle === "Tricycle" && (
                      <View style={styles.selectedCircle} />
                    )}
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    Tricycle
                  </Text>
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
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>Jeep</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                Ride Type
              </Text>
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
                <>
                  <View style={styles.sharedTabContent}>
                    <View style={{}}>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        {pickupAddress}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        {destinationAddress}
                      </Text>
                    </View>
                    <View style={styles.createSection}>
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={createSharedRideBooking}
                      >
                        <Text style={styles.joinButtonText}>Create</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.joinTabContent}>
                    <ScrollView
                      contentContainerStyle={styles.scrollContent} // Applies styles to the content inside ScrollView
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {acceptedSharedRides.length === 0 ? (
                        <Text style={{ textAlign: "center" }}>
                          No available rides
                        </Text>
                      ) : (
                        acceptedSharedRides
                          .filter(
                            (ride) =>
                              ride.vehicleType === selectedVehicle &&
                              ["accepted", "Arrived", "On board"].includes(
                                ride.status
                              )
                          )
                          .map((ride) => (
                            <View key={ride._id} style={styles.rideItem}>
                              <View>
                                <Text
                                  style={{ fontSize: 16, fontWeight: "bold" }}
                                >
                                  {ride.pickupAddress}
                                </Text>
                                <Text
                                  style={{ fontSize: 16, fontWeight: "bold" }}
                                >
                                  {ride.destinationAddress}
                                </Text>
                              </View>
                              <View style={styles.price}>
                                <TouchableOpacity
                                  style={styles.joinButton}
                                  onPress={() => handleJoinButton(ride)}
                                >
                                  <Text style={styles.joinButtonText}>
                                    Join
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                      )}
                    </ScrollView>
                  </View>

                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
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
                            <Text
                              style={styles.rideDetails}
                            >{`From: ${selectedRide.pickupAddress}\nTo: ${selectedRide.destinationAddress}`}</Text>
                            <Text
                              style={styles.fare}
                            >{`Fare: ${selectedRide.fare}`}</Text>
                          </>
                        )}

                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={() => handleJoinRide(selectedRide._id)}
                        >
                          <Text style={styles.confirmButtonText}>
                            Confirm Join
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setModalVisible(false)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              )}

              {selectedVehicle && activeTab === "Special" && (
                <>
                  <View style={styles.tabContent}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        {pickupAddress}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        {destinationAddress}
                      </Text>
                    </View>
                    <View style={styles.price}>
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
            <Text style={{ fontWeight: "700", fontSize: 20 }}>
              Searching for a driver...{" "}
            </Text>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}

        {bookingDetails?.driver &&
          bookingDetails.rideType === "Special" &&
          (bookingDetails.status === "accepted" ||
            bookingDetails.status === "Arrived" ||
            bookingDetails.status === "On board") && (
            <View style={styles.acceptedContainer}>
              <View style={styles.acceptedHeader}>
                <Text style={styles.acceptedText}>
                  {bookingDetails && bookingDetails.status && (
                    <Text>
                      {bookingDetails.status === "accepted" &&
                        `The driver is on the way to pick you up. ${
                          driverDurationArrival > 0
                            ? `Arrival Time: ${driverDurationArrival.toFixed(
                                1
                              )} min.`
                            : "Calculating time..."
                        }`}
                      {bookingDetails.status === "Arrived" &&
                        `The driver has arrived. ${
                          driverDurationArrival > 0
                            ? `Arrival Time: ${driverDurationArrival.toFixed(
                                1
                              )} min.`
                            : "Calculating time..."
                        }`}
                      {bookingDetails.status === "On board" &&
                        `Your ride is in progress. ${
                          driverDuration > 0
                            ? `Estimated Time: ${driverDuration.toFixed(
                                1
                              )} min.`
                            : "Calculating time..."
                        }`}
                    </Text>
                  )}
                </Text>
              </View>

              <View style={styles.driverDetail}>
                {bookingDetails.driver?.profilePic ? (
                  <Image
                    source={{ uri: bookingDetails.driver.profilePic }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                  />
                ) : (
                  <Image
                    source={imagePath.defaultpic}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="contain"
                  />
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "80%",
                  }}
                >
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontWeight: "700" }}>
                      {bookingDetails.driver.name}
                    </Text>
                    <Text style={{ fontWeight: "700" }}>
                      <Image
                        source={imagePath.rating}
                        style={{
                          width: 15,
                          height: 15,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingTop: 5,
                        }}
                      />
                      {bookingDetails.driverRating?.averageRating?.toFixed(2)}
                    </Text>
                  </View>

                  <View style={{ padding: 10 }}>
                    <TouchableOpacity
                      onPress={handleMessage}
                      style={styles.communicationContainer}
                    >
                      <Text style={styles.communicationText}>
                        <Icon
                          name="envelope"
                          size={18}
                          color="#000"
                          style={styles.communicationIcon}
                        />{" "}
                        Message
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View
                style={{
                  borderBottomColor: "#f3f3f3",
                  borderBottomWidth: 1,
                  padding: 15,
                }}
              >
                {bookingDetails.driver.vehicleInfo2 && (
                  <Text style={{ fontWeight: "700" }}>
                    Plate Number:{" "}
                    {bookingDetails.driver.vehicleInfo2.plateNumber ||
                      "Not Available"}
                  </Text>
                )}
                <Text style={{ fontWeight: "700" }}>
                  Total Fare: ₱{totalFare.toFixed(2)}
                </Text>
              </View>

              <View
                style={{
                  borderBottomColor: "#f3f3f3",
                  borderBottomWidth: 1,
                  padding: 15,
                }}
              >
                <Text>Pick up: {pickupAddress}</Text>
                <Text>Destination: {destinationAddress}</Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={openSpecialCancelModal}
              >
                <Text style={styles.cancelButton}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalCancelVisible}
          onRequestClose={closeSpecialTripCancelModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Cancel Booking</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel?
              </Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectReason}
                  onValueChange={(itemValue) => {
                    console.log("Selected payment method:", itemValue);
                    setSelectReason(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Reason" value="" />
                  <Picker.Item label="Long Wait Time" value="Long Wait Time" />
                  <Picker.Item label="Vehicle Issue" value="Vehicle issue" />
                  <Picker.Item
                    label="Found Alternative Ride"
                    value="Found Alternative Ride"
                  />
                  <Picker.Item label="Booking error" value="Booking error" />
                  <Picker.Item
                    label="Passenger changed mind"
                    value="Passenger changed mind"
                  />
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleCancelBooking}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeSpecialTripCancelModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {bookingDetails?.driver &&
          bookingDetails?.status === "Dropped off" &&
          bookingDetails.rideType === "Special" &&
          !submitted && (
            <ScrollView
              style={styles.completedContainer}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={{ fontWeight: "700", fontSize: 24 }}>
                Payment Summary
              </Text>

              <View style={styles.driverDetails}>
                {bookingDetails.driver?.profilePic ? (
                  <Image
                    source={{ uri: bookingDetails.driver.profilePic }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                  />
                ) : (
                  <Image
                    source={imagePath.defaultpic}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.driverInfo}>
                  <Text>Driver: {bookingDetails.driver.name}</Text>
                  <Text>Vehicle: {bookingDetails.vehicleType}</Text>
                  {bookingDetails.driver.vehicleInfo2 && (
                    <Text style={{ fontWeight: "700" }}>
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
                <Text>Pick up: {pickupAddress}</Text>
                <Text>Destination: {destinationAddress}</Text>
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

              <Text style={{ fontWeight: "700", fontSize: 18 }}>
                Select Payment Method
              </Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectedPaymentMethod}
                  onValueChange={(itemValue) => {
                    console.log("Selected payment method:", itemValue);
                    setSelectedPaymentMethod(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Payment Method" value="" />
                  <Picker.Item label="Cash" value="Cash" />
                  <Picker.Item label="GCash" value="GCash" />
                </Picker>
              </View>

              {selectedPaymentMethod === "GCash" && (
                <View>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>
                    Upload GCash Receipt
                  </Text>

                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      backgroundColor: "gainsboro",
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      marginTop: 10,
                      alignItems: "center",
                    }}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image.uri }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <Text style={{ textAlign: "center" }}>
                        Click to upload
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <Text style={{ fontWeight: 16, fontWeight: "bold" }}>
                Rate Your Driver
              </Text>
              <Text style={{ fontWeight: 12, fontWeight: "bold" }}>
                Overall Experience
              </Text>
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
              <View style={{ paddingVertical: 10 }}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Leave your feedback here..."
                  value={feedback}
                  onChangeText={setFeedback}
                />
              </View>

              <TouchableOpacity onPress={handleReport} style={styles.report}>
                <Text style={styles.report}>Report the driver</Text>
              </TouchableOpacity>
              <View style={{ paddingBottom: 60, paddingTop: 20 }}>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

        {bookingDetails?.driver &&
          bookingDetails.rideType === "Shared Ride" &&
          (bookingDetails.status === "accepted" ||
            bookingDetails.status === "Arrived" ||
            bookingDetails.status === "On board") && (
            <View style={styles.acceptedContainer}>
              <View style={styles.acceptedHeader}>
                <Text style={styles.acceptedText}>
                  {bookingDetails && bookingDetails.status && (
                    <Text>
                      {bookingDetails.status === "accepted" &&
                        `The driver is on the way to pick you up. ${
                          driverDurationArrival > 0
                            ? `Arrival Time: ${driverDurationArrival.toFixed(
                                1
                              )} min.`
                            : "Calculating time..."
                        }`}
                      {bookingDetails.status === "Arrived" &&
                        `The driver has arrived. ${
                          driverDurationArrival > 0
                            ? `Arrival Time: ${driverDurationArrival.toFixed(
                                1
                              )} min.`
                            : "Calculating time..."
                        }`}
                      {bookingDetails.status === "On board" &&
                        `Your ride is in progress. ${
                          driverDuration > 0
                            ? `Estimated Time: ${driverDuration.toFixed(
                                1
                              )} min.`
                            : "Calculating time..."
                        }`}
                    </Text>
                  )}
                </Text>
              </View>

              <View style={styles.driverDetail}>
                {bookingDetails.driver?.profilePic ? (
                  <Image
                    source={{ uri: bookingDetails.driver.profilePic }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                  />
                ) : (
                  <Image
                    source={imagePath.defaultpic}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="contain"
                  />
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "80%",
                  }}
                >
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontWeight: "700" }}>
                      {bookingDetails.driver.name}
                    </Text>
                    <Text style={{ fontWeight: "700" }}>
                      <Image
                        source={imagePath.rating}
                        style={{
                          width: 15,
                          height: 15,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingTop: 5,
                        }}
                      />
                      {bookingDetails.driverRating?.averageRating?.toFixed(2)}
                    </Text>
                  </View>

                  <View style={{ padding: 10 }}>
                    <TouchableOpacity
                      onPress={handleMessage}
                      style={styles.communicationContainer}
                    >
                      <Text style={styles.communicationText}>
                        <Icon
                          name="envelope"
                          size={18}
                          color="#000"
                          style={styles.communicationIcon}
                        />{" "}
                        Message
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View
                style={{
                  borderBottomColor: "#f3f3f3",
                  borderBottomWidth: 1,
                  padding: 15,
                }}
              >
                {bookingDetails.driver.vehicleInfo2 && (
                  <Text style={{ fontWeight: "700" }}>
                    Plate Number:{" "}
                    {bookingDetails.driver.vehicleInfo2.plateNumber ||
                      "Not Available"}
                  </Text>
                )}
                <Text style={{ fontWeight: "700" }}>
                  Total Fare: ₱{totalFare.toFixed(2)}
                </Text>
              </View>

              <View
                style={{
                  borderBottomColor: "#f3f3f3",
                  borderBottomWidth: 1,
                  padding: 15,
                }}
              >
                <Text>Pick up: {pickupAddress}</Text>
                <Text>Destination: {destinationAddress}</Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={openSharedCancelModal}
              >
                <Text style={styles.cancelButton}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalCancelSharedVisible}
          onRequestClose={closeSharedTripCancelModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Cancel Booking</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel?
              </Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectReason}
                  onValueChange={(itemValue) => {
                    console.log("Selected payment method:", itemValue);
                    setSelectReason(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Reason" value="" />
                  <Picker.Item label="Long Wait Time" value="Long Wait Time" />
                  <Picker.Item label="Vehicle Issue" value="Vehicle issue" />
                  <Picker.Item
                    label="Found Alternative Ride"
                    value="Found Alternative Ride"
                  />
                  <Picker.Item label="Booking error" value="Booking error" />
                  <Picker.Item
                    label="Passenger changed mind"
                    value="Passenger changed mind"
                  />
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleCancelBooking}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeSharedTripCancelModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {bookingDetails?.driver &&
          bookingDetails?.status === "Dropped off" &&
          bookingDetails.rideType === "Shared Ride" &&
          !submitted && (
            <ScrollView style={styles.completedContainer}>
              <Text style={{ fontWeight: "700", fontSize: 24 }}>
                Payment Summary
              </Text>

              <View style={styles.driverDetails}>
                {bookingDetails.driver?.profilePic ? (
                  <Image
                    source={{ uri: bookingDetails.driver.profilePic }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                  />
                ) : (
                  <Image
                    source={imagePath.defaultpic}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="contain"
                  />
                )}

                <View style={styles.driverInfo}>
                  <Text>Driver: {bookingDetails.driver.name}</Text>
                  <Text>Vehicle: {bookingDetails.vehicleType}</Text>
                  {bookingDetails.driver.vehicleInfo2 && (
                    <Text style={{ fontWeight: "700" }}>
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
                <Text>Pick up: {pickupAddress}</Text>
                <Text>Destination: {destinationAddress}</Text>
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

              <Text style={{ fontWeight: "700", fontSize: 18 }}>
                Select Payment Method
              </Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectedPaymentMethod}
                  onValueChange={(itemValue) => {
                    console.log("Selected payment method:", itemValue);
                    setSelectedPaymentMethod(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Payment Method" value="" />
                  <Picker.Item label="Cash" value="Cash" />
                  <Picker.Item label="GCash" value="GCash" />
                </Picker>
              </View>

              {selectedPaymentMethod === "GCash" && (
                <View>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>
                    Upload GCash Receipt
                  </Text>

                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      backgroundColor: "gainsboro",
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      marginTop: 10,
                      alignItems: "center",
                    }}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image.uri }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <Text style={{ textAlign: "center" }}>
                        Click to upload
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <Text style={{ fontWeight: 20, fontWeight: "bold" }}>
                Rate Your Driver
              </Text>
              <Text style={{ fontWeight: 16, fontWeight: "bold" }}>
                Overall Experience
              </Text>
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

              <View style={{ paddingBottom: 60, paddingTop: 20 }}>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

        {bookingCopassengerDetails?.driver &&
          bookingCopassengerDetails.rideType === "Shared Ride" &&
          bookingCopassengerDetails.rideAction === "Join" &&
          (bookingCopassengerDetails.status === "accepted" ||
            bookingCopassengerDetails.status === "Arrived" ||
            bookingCopassengerDetails.status === "On board") && (
            <View style={styles.acceptedContainer}>
              <View style={styles.acceptedHeader}>
                <Text style={styles.acceptedText}>
                  {bookingCopassengerDetails &&
                    bookingCopassengerDetails.status && (
                      <Text>
                        {bookingCopassengerDetails.status === "accepted" &&
                          `The driver is on the way to pick you up. ${
                            driverDuration > 0
                              ? `driverDuration Time:  min.`
                              : "Calculating time..."
                          }`}
                        {bookingCopassengerDetails.status === "Arrived" &&
                          `The driver has arrived. ${
                            driverDuration > 0
                              ? `Arrival Time: min.`
                              : "Calculating time..."
                          }`}
                        {bookingCopassengerDetails.status === "On board" &&
                          `Your ride is in progress. ${
                            driverDuration > 0
                              ? `Estimated Time: min.`
                              : "Calculating time..."
                          }`}
                      </Text>
                    )}
                </Text>
              </View>
              <View style={styles.driverDetail}>
                {bookingDetails.driver?.profilePic ? (
                  <Image
                    source={{ uri: bookingDetails.driver.profilePic }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                  />
                ) : (
                  <Image
                    source={imagePath.defaultpic}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="contain"
                  />
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "80%",
                  }}
                >
                  <View style={{ padding: 10 }}>
                    {/* Ensure driver and driver name exists */}
                    <Text style={{ fontWeight: "700" }}>
                      {bookingCopassengerDetails.driver?.name ||
                        "No Name Available"}
                    </Text>
                    {/* Ensure driverRating exists */}
                    <Text style={{ fontWeight: "700" }}>
                      {bookingCopassengerDetails.driverRating?.averageRating ||
                        "No Rating"}
                    </Text>
                  </View>

                  <View style={{ padding: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleCopassengerMessage()}
                      style={styles.communicationContainer}
                    >
                      <Text style={styles.communicationText}>
                        <Icon
                          name="envelope"
                          size={18}
                          color="#000"
                          style={styles.communicationIcon}
                        />{" "}
                        Message
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View
                style={{
                  borderBottomColor: "#f3f3f3",
                  borderBottomWidth: 1,
                  padding: 15,
                }}
              >
                {bookingCopassengerDetails.driver?.vehicleInfo2 && (
                  <Text style={{ fontWeight: "700" }}>
                    Plate Number:{" "}
                    {bookingCopassengerDetails.driver.vehicleInfo2
                      ?.plateNumber || "Not Available"}
                  </Text>
                )}
                <Text style={{ fontWeight: "700" }}>
                  Total Fare: ₱{totalFare}
                </Text>
              </View>

              <View
                style={{
                  borderBottomColor: "#f3f3f3",
                  borderBottomWidth: 1,
                  padding: 15,
                }}
              >
                <Text>Pick up: {pickupAddress}</Text>
                <Text>Destination: {destinationAddress}</Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={openDropoffModal}
              >
                <Text style={styles.cancelButton}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isConfirmationModalVisible}
          onRequestClose={closeDropoffModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Cancel Booking</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel?
              </Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectReason}
                  onValueChange={(itemValue) => {
                    console.log("Selected payment method:", itemValue);
                    setSelectReason(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Reason" value="" />
                  <Picker.Item label="Long Wait Time" value="Long Wait Time" />
                  <Picker.Item label="Vehicle Issue" value="Vehicle issue" />
                  <Picker.Item
                    label="Found Alternative Ride"
                    value="Found Alternative Ride"
                  />
                  <Picker.Item label="Booking error" value="Booking error" />
                  <Picker.Item
                    label="Passenger changed mind"
                    value="Passenger changed mind"
                  />
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleCoPassengerCancelBooking}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeDropoffModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {bookingCopassengerDetails?.driver &&
          bookingCopassengerDetails.status === "Dropped off" &&
          bookingCopassengerDetails.rideType === "Shared Ride" &&
          bookingCopassengerDetails.rideAction === "Join" &&
          !submitted && (
            <View style={styles.completedContainer}>
              <Text style={{ fontWeight: "700", fontSize: 24 }}>
                Payment Summary
              </Text>

              <View style={styles.driverDetails}>
                {bookingDetails.driver?.profilePic ? (
                  <Image
                    source={{ uri: bookingDetails.driver.profilePic }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                  />
                ) : (
                  <Image
                    source={imagePath.defaultpic}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.driverInfo}>
                  <Text>Driver: {bookingCopassengerDetails.driver.name}</Text>
                  <Text>Vehicle: {bookingCopassengerDetails.vehicleType}</Text>
                  {bookingCopassengerDetails.driver.vehicleInfo2 && (
                    <Text style={{ fontWeight: "700" }}>
                      Plate Number:{" "}
                      {
                        bookingCopassengerDetails.driver.vehicleInfo2
                          .plateNumber
                      }
                    </Text>
                  )}
                </View>
              </View>

              <Text>
                Date:{" "}
                {moment(bookingCopassengerDetails.createdAt).format(
                  "MMMM DD, YYYY"
                )}
              </Text>

              <View style={styles.location}>
                <Text>Pick up: {pickupAddress}</Text>
                <Text>Destination: {destinationAddress}</Text>
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

              <Text style={{ fontWeight: "700", fontSize: 18 }}>
                Select Payment Method
              </Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectedPaymentMethod}
                  onValueChange={(itemValue) => {
                    console.log("Selected payment method:", itemValue); 
                    setSelectedPaymentMethod(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Payment Method" value="" />
                  <Picker.Item label="Cash" value="Cash" />
                  <Picker.Item label="GCash" value="GCash" />
                </Picker>
              </View>

              {selectedPaymentMethod === "GCash" && (
                <View>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>
                    Upload GCash Receipt
                  </Text>

                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      backgroundColor: "gainsboro",
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                  {image && (
                    <Image
                      source={{ uri: image.uri }}
                      style={{ width: 100, height: 50 }}
                    />
                  )}
                </View>
              )}

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

              <TouchableOpacity
                style={styles.button}
                onPress={handleSharedSubmitPayment}
              >
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
    elevation: 5,
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
    borderRadius: 10,
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  sharedTabContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  joinTabContent: {
    height: 200,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 20,
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
    padding: 10,
    backgroundColor: "powderblue",
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
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
  driverDetail: {
    display: "flex",
    flexDirection: "row",
    borderBottomColor: "#f3f3f3",
    borderBottomWidth: 1,
    padding: 15,
    width: "100%",
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
    width: "100%",
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

  ratings: {
    flexDirection: "row",
    paddingVertical: 10,
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
    color: "blue",
    fontWeight: "bold",
    fontSize: 16,
  },
  dropdownContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
  },
  picker: {
    padding: 10,
    width: "100%",
  },
  modalConfirm: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center", // Center the modal vertically
    alignItems: "center", // Align modal to the right
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center", // Center the modal vertically
    alignItems: "flex-end", // Align modal to the right
  },
  modalContainer: {
    width: "90%",
    maxHeight: "100%",
    padding: 20,
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    backgroundColor: "white",
  },
  modalDetailsContainer: {
    width: "100%",
    maxHeight: "100%",
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    backgroundColor: "white",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalMessage: {
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row", // Arrange items in a row
    justifyContent: "flex-end", // Align buttons to the right side
    alignItems: "center", // Vertically center the buttons (optional)
    paddingVertical: 20,
    gap: 10,
  },
  confirmButton: {
    backgroundColor: "black",
    padding: 10,
    width: "20%",
    alignItems: "center",
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },
  arrivalMessageText: {
    color: "white",
  },

  createSection: {
    marginTop: 10,
    marginBottom: 20, // Space between create button and ride list
  },
  rideListSection: {
    marginTop: 10,
  },
  rideItem: {
    justifyContent: "space-between",
    flexDirection: "row",
    borderBottomColor: "#f3f3f3",
    borderBottomWidth: 1,
    paddingVertical: 15,
  },
});

export default Home;
