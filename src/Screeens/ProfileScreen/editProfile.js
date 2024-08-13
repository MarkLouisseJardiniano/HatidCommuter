import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity,Image, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const EditProfile = () => {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleEdit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(
        `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/edituser/${userId}`,
        {
          profilePic,
          name,
          number,
          email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.data.status === 'ok') {
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        console.error('Server response:', res.data);
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error('Error updating profile:', error.response ? error.response.data : error.message);
      Alert.alert("Error", "An error occurred while updating profile");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.post('https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/userdata', { token });
        if (res.data.status === 'ok') {
          const data = res.data.data;
          setUserData(data);
          setUserId(data._id);
          setProfilePic(data.profilePic);
          setName(data.name);
          setNumber(data.number);
          setEmail(data.email);
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.circle} onPress={pickImage}>
        {/* {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>Pick an Image</Text>
        )} */}
      </TouchableOpacity>

      <TextInput
        label="Name"
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        label="Number"
        placeholder="Phone Number"
        value={number}
        onChangeText={setNumber}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <View style={styles.buttonPosition}>
        <TouchableOpacity onPress={handleEdit} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 100,
    height: 100,
    backgroundColor: "gray",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    margin: 40,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 40,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  buttonPosition: {
    marginTop: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 250,
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

export default EditProfile;
