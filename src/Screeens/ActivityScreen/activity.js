import { StyleSheet, Text, View, ScrollView,FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState , useCallback} from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
  
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          setError("User ID is not found.");
        }
      } catch (err) {
        console.error("Error fetching user ID:", err);
        setError("Error fetching user ID");
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        if (!userId) return;
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error("No token found");
        }

        console.log('Fetching activities for userId:', userId);

        const res = await axios.get(
          `https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/ride/activities/${userId}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        ); 

        console.log('API Response:', res); 
        if (res.data && res.data.data) {
          const activityData = res.data.data;
          const sortedActivities = await Promise.all(
            activityData.map(async (activity) => {
              const pickupAddress = await getAddress(
                activity.pickupLocation.latitude,
                activity.pickupLocation.longitude
              );
              const destinationAddress = await getAddress(
                activity.destinationLocation.latitude,
                activity.destinationLocation.longitude
              );

              return {
                ...activity,
                pickupAddress,
                destinationAddress,
              };
            })
          );
          const sortedByDate = sortedActivities.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          console.log('Sorted activities:', sortedActivities);
  
          setActivities(sortedByDate);
        } else {
          setError("No activities found.");
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
        setError("Error fetching activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]); 

  const getAddress = async (latitude, longitude) => {
    try {
      const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
      const geoResponse = await axios.get(reverseGeocodeUrl);
      if (geoResponse.data.features.length > 0) {
        let barangay = '';
        let district = '';

        const addressComponents = geoResponse.data.features[0].context;

        addressComponents.forEach((component) => {
          if (component.id.includes('locality')) {
            barangay = component.text;
          } else if (component.id.includes('place')) {
            district = component.text;
          }
        });

        return `${barangay}, ${district}` || 'Address not found';
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Address not found';
    }
  };


  const renderItem = useCallback(({ item }) => (
    <View style={styles.activityContainer}>
      <View style={styles.activityContent}>
        <View style={styles.activity}>
          <View style={styles.circle} />
          <View style={styles.driverData}>
            <Text style={{ fontSize: 16, fontWeight: "bold",}}>{item.name}</Text>
            <View style={styles.vehicleData}>
            <View style={{  flexDirection: 'row', gap: 10}}>
            <Text style={{ fontSize: 16,}}>{item.driver?.vehicleInfo2.vehicleType}</Text>
            <Text style={{ fontSize: 16,}}>{item.driver?.vehicleInfo2.plateNumber}</Text>
            </View>
                  
          
          <View style={styles.rightSection}>
            <View style={styles.statusContainer}>
              <Text style={{color: "white"}}>{item.status}</Text>
            </View>
            <Text  style={{ fontSize: 16, fontWeight: "bold",}}>Fare {item?.fare ? item.fare.toFixed(2) : '0.00'}</Text>
</View>
</View>
          </View>
        </View>
      </View>
      <View style={styles.locationContainer}>
      <Text style={{ fontSize: 16,}}>Pickup Address: {item.pickupAddress}</Text>
      <Text style={{ fontSize: 16,}}>Destination Address: {item.destinationAddress}</Text>
      </View>
    </View>
  ), []);

  return (
    <View style={styles.container}>
       <FlatList
    data={activities}
    keyExtractor={(item) => item._id}
    renderItem={renderItem}
  />
    </View>
  );
};

export default Activity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20
  },
  header: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 20,
  },
  activityContainer: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 2, 
    shadowColor: '#000', 
    borderTopColor: "lightgray", // change color to whatever you need
    borderTopWidth: 1, // adjust width as needed
    borderBottomColor: "lightgray", // change color to whatever you need
    borderBottomWidth: 1, 
    shadowRadius: 6,
    marginBottom: 10,
    borderLeftColor: "lightgray", // change color to whatever you need
    borderLeftWidth: 1, // adjust width as needed
    borderRightColor: "lightgray", // change color to whatever you need
    borderRightWidth: 1,
  },
  activity: {
    flexDirection: 'row',
  },
  driverData: {
    flexDirection: 'column',
    justifyContent: "space-between",
    
    

  },
  vehicleData: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    width: '85%',
    
    

  },
  rightSection: {
    flexDirection: 'column'
  },
  activityContent: {
    marginBottom: 10,
  },
  statusContainer: {
    backgroundColor: 'black',
    paddingTop: 2,
    paddingBottom: 3,
    paddingRight: 10,
    paddingLeft: 10,
    borderRadius: 10
  },
  locationContainer: {
    marginBottom: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});
