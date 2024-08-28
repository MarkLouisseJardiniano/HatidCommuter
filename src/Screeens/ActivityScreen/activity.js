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
    // Simulate fetching userId from AsyncStorage or another source
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId'); //stored userId
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

        console.log('Fetching activities for userId:', userId); // Log userId

        const res = await axios.get(
          `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/activities/${userId}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        ); 

        console.log('API Response:', res); // Log the response

        if (res.data && res.data.data) {
          const activityData = res.data.data;
          setActivities(activityData);
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
  }, [userId]); // Fetch activities by userId


  const renderItem = useCallback(({ item }) => (
    <View style={styles.activityContainer}>
      <View style={styles.activityContent}>
        <View style={styles.activity}>
          <View style={styles.circle} />
          <View style={styles.driverData}>
            <Text>{item.name}</Text>
            <View style={styles.vehicleData}>
                  <Text>Vehicle{item.vehicleInfo2?.vehicleType}</Text>
                  <Text>Plate{item.vehicleInfo2?.plateNumber}</Text>
                  </View>
          </View>
          <View style={styles.rightSection}>
            <View style={styles.statusContainer}>
              <Text>{item.status}</Text>
            </View>
            <Text>Fare {item?.fare ? item.fare.toFixed(2) : '0.00'}</Text>

          </View>
        </View>
      </View>
      <View style={styles.locationContainer}>
        <Text>Pick Up Location: ({item.pickupLocation?.latitude}, {item.pickupLocation?.longitude})</Text>
        <Text>Drop Off Location: ({item.destinationLocation?.latitude}, {item.destinationLocation?.longitude})</Text>
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
    backgroundColor: "powderblue",
    borderRadius: 10,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 1, 
    shadowRadius: 6,
    marginBottom: 10,
  },
  activity: {
    flexDirection: 'row',
  },
  driverData: {
    marginRight: 90,
    justifyContent: 'center'
  },
  vehicleData: {
    flexDirection: 'row',
    gap: 20
  },
  rightSection: {
    flexDirection: 'column'
  },
  activityContent: {
    marginBottom: 10,
  },
  statusContainer: {
    backgroundColor: 'white',
    paddingTop: 2,
    paddingBottom: 2,
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
