import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import imagePath from '../../constants/imagePath';
import { useNavigation } from "@react-navigation/native";

const EditProfile = () => {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [emailValid, setEmailValid] = useState(null);
  const [userId, setUserId] = useState(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/; 
    setEmailValid(emailRegex.test(email));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      setProfilePic(result.assets[0].uri);
    }
  };

  const uploadImage = async (image) => {
    if (!image || !image.uri) {
      console.log('No image selected, proceeding without an image...');
      return null;
    }
    const fileName = image.uri.split('/').pop();
    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: fileName,
      type: 'image/jpeg',
    });

    try {
      const fileResponse = await axios.post(
        'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/upload-profilepic',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return fileResponse.data.signedUrl || null;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'There was an error uploading the image.');
      return null;
    }
  };


  const handleEdit = async () => {
    try {
      let signedUrl = null;
      if (image) {
        signedUrl = await uploadImage(image);
      }
      const newEmail = await AsyncStorage.getItem('email')
      console.log("new email", newEmail)
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/edituser/${userId}`,
        {
          profilePic: signedUrl || profilePic,
          name,
          number,
          email: newEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === 'ok') {
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        console.error('Server response:', res.data);
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error.response ? error.response.data : error.message);
      Alert.alert('Error', 'An error occurred while updating profile');
    }
  };


const fetchData = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error("User ID not found in AsyncStorage.");
        return;
      }

      const newEmail = await AsyncStorage.getItem('email');
      console.log("newEmail", newEmail)
  
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error("Token not found in AsyncStorage.");
        return;
      }
  
      const res = await axios.get(`https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (res.status === 200) {
        const userData = res.data;
        setUserId(userData._id);
        setProfilePic(userData.profilePic);
        setName(userData.name);
        setNumber(userData.number);
        setInitialEmail(userData.email);
        setEmail(newEmail);
  
      
        await AsyncStorage.setItem('email', userData.email);
  
        const storedEmail = await AsyncStorage.getItem('email');
        console.log('Stored Email from AsyncStorage:', storedEmail);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
  }
};
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('email');
  
      if (!storedEmail) {
        Alert.alert('Error', 'No registered email found.');
        return;
      }
  
      console.log("Verifying email from AsyncStorage:", storedEmail);
      console.log("Verifying new email:", newEmail);
      if (emailValid) {
        const otpResponse = await axios.post(
          'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/generate-email-change-otp',
          { email: storedEmail, newEmail }
        );
  
        console.log("OTP Response:", otpResponse.data);
        navigation.navigate('ChangeEmailVerification', { email: storedEmail, newEmail });
        console.log("Navigating to OTP screen with email:", storedEmail);
        console.log("Navigating to OTP screen with newEmail:", newEmail);
      } else {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.circle} onPress={pickImage}>
        {profilePic ? (
          <Image
            source={{ uri: profilePic }}
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

        <View style={styles.editIconContainer}>
          <Image source={imagePath.penIcon} style={styles.editIcon} />
        </View>
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
      <View style={styles.emailInputContainer}>
        <View style={styles.textInputWrapper}>
          <TextInput
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setNewEmail(text);
              setEmail(text);
              validateEmail(text);
            }}
            style={styles.inputWithIcon}
          />
          {email === initialEmail && (
            <Image source={imagePath.greenCheckIcon} style={styles.iconInsideInput} />
          )}
          {email !== initialEmail && emailValid === false && (
            <Image source={imagePath.redCautionIcon} style={styles.iconInsideInput} />
          )}
          {email !== initialEmail && emailValid && (
            <TouchableOpacity onPress={handleVerify} style={styles.verifyInsideInput}>
              <Text style={{ fontSize: 16 }}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.buttonPosition}>
      <TouchableOpacity
  onPress={handleEdit}
  style={[styles.button, { opacity: emailValid || email === initialEmail ? 1 : 0.5 }]}
  disabled={!emailValid && email !== initialEmail}
>
  <Text style={styles.buttonText}>Save</Text>
</TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
emailInputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  textInputWrapper: {
    position: "relative",
  },
  inputWithIcon: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
    paddingRight: 40, 
  },
  iconInsideInput: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -10 }], 
    width: 20,
    height: 20,
  },
  verifyInsideInput: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -10 }], 
    width: "12%",
    height: 20,
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
  },
  defaultImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
    borderWidth: 0.2,
    borderColor: 'lightgray',
  },

  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderRadius: 15,
    backgroundColor: 'lightgray',
    padding: 5,
  },
  editIcon: {
    width: 20,
    height: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 40,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  buttonPosition: {
    marginTop: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 250,
    height: 40,
    backgroundColor: 'powderblue',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default EditProfile;
