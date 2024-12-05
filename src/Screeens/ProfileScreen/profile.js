import axios from 'axios';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import imagePath from '../../constants/imagePath';

const Profile = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [email,setEmail] = useState("")
  const [profilePic, setProfilePic] = useState("");
  const handleLogout = async () => {
    try {
      // Remove items from AsyncStorage
      await AsyncStorage.removeItem('KeepLoggedIn');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
  
      console.log('Logged out successfully');
      navigation.navigate('LoginStack'); 
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Logout Failed', 'Failed to log out. Please try again.');
    }
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


    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.post('https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/userdata', { token });
        if (res.data.status === 'ok') {
          setUserData(res.data.data);
          setEmail(res.data.data.email)
          setProfilePic(res.data.data.profilePic);

          console.log(userData)
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, 5000); 
    return () => clearInterval(intervalId);
  }, []);

  return (
<View style={styles.rowContainer}>
  <View style={styles.fullWidthBox}>
    {userData && userData.profilePic ? (
      <Image
        source={{ uri: userData.profilePic }}
        style={styles.profileImage}
        resizeMode="cover"
      />
    ) : (
      <Image
        source={imagePath.defaultpic}
        style={styles.defaultImage}
        resizeMode="contain"
      />
    )}
    {userData ? (
      <View>
        <Text style={styles.userName}>{userData.name}</Text>
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

  <View style={{ flex: 1 }} /> 

  <View style={styles.buttonPosition}>
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Text style={styles.buttonText}>Log Out</Text>
    </TouchableOpacity>
  </View>
</View>

  );
};

const styles = StyleSheet.create({
  profileImage: {
    height: 80,
    width: 80,
    borderRadius: 50,
    
  },
  defaultImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
    borderWidth: 0.2,
    borderColor: 'black',
  },
  rowContainer: {
    flex: 1,
    backgroundColor: 'white', 
  },
  fullWidthBox: {
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    backgroundColor: "lightblue",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 40,
  },
  userName: {
    fontWeight: '700',
    fontSize: 20,
  },
  divider: {
    borderBottomColor: '#f3f3f3',
    borderBottomWidth: 1, 
    padding: 15,
  },
  myProfile: {
  paddingTop:40,
  paddingLeft: 40
  },
  profileTitle: {
    fontSize: 24,
  },
  profileContents: {

  },
  dividerText: {
    fontSize: 16,
    marginLeft: 60,
  },
  buttonPosition: {
    paddingBottom: 40,
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
