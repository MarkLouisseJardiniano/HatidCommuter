import axios from 'axios';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

const Profile = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);

  const HandleLogOut = () => {
    Alert.alert("Button Pressed", "You clicked the button!");
  };

  const handleEdit = () => {
    navigation.navigate("EditProfile");
  };

  const handlePlaces = () => {
    navigation.navigate("SavedPlaces");
  };

  const handleContact = () => {
    navigation.navigate("Contact");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.post('https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/userdata', { token });
        if (res.data.status === 'ok') {
          setUserData(res.data.data);
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={styles.rowContainer}>
      <View style={styles.fullWidthBox}>
        <View style={styles.circle} />
        {userData ? (
          <View>
            <Text style={styles.userName}> {userData.name}</Text>
          </View>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>

      <View style={styles.myProfile}>
        <Text style={styles.profileTitle}>My Profile</Text>
      </View>
      <View style={styles.profileContents}>
        <TouchableOpacity style={styles.divider} onPress={handleEdit}>
          <Text style={styles.dividerText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.divider} onPress={handlePlaces}>
          <Text style={styles.dividerText}>Saved Places</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.divider} onPress={handleContact}>
          <Text style={styles.dividerText}>Emergency Contact</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonPosition}>
        <TouchableOpacity onPress={HandleLogOut} style={styles.button}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    backgroundColor: 'white', // Set background color to white
  },
  fullWidthBox: {
    height: 150,
    flexDirection: "row",
    backgroundColor: "lightblue",
    alignItems: "center",
    gap: 20,
  },
  userName: {
    marginTop: 30,
    fontWeight: '700',
    fontSize: 24,
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 30, // Ensure the circle is properly rounded
    marginLeft: 30,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    borderBottomColor: '#f3f3f3',
    borderBottomWidth: 1, 
    padding: 15,
  },
  myProfile: {
    marginLeft: 40,
    marginTop: 40,
  },
  profileTitle: {
    fontSize: 24,
  },
  profileContents: {
    marginTop: 20,
    marginBottom: 20, // Adjusted for better layout
  },
  dividerText: {
    fontSize: 16,
    marginLeft: 60,
  },
  buttonPosition: {
    marginTop: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 250,
    height: 40,
    backgroundColor: "lightblue",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
});

export default Profile;
