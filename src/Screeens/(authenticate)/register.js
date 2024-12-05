import React, { useState } from "react";
import { View, TouchableOpacity, TextInput, Text, StyleSheet, Alert } from "react-native"; // Add Alert import
import axios from 'axios';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Signup = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [number, setNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");

  const handleSignupAndRequestOtp = async () => {
    try {
      console.log("Signing up with email:", email);
  
      const emailCheckResponse = await axios.post(
        'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/check-email', 
        { email }
      );
  
      if (emailCheckResponse.data.exists) {
        Alert.alert('This email is already registered.');
        return;
      }
  
      console.log("Requesting OTP with email:", email);
      const otpResponse = await axios.post(
        'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/generate-otp',
        { email, name }
      );
  
      console.log("OTP Response:", otpResponse.data);
  
      if (otpResponse.status === 200) {
        navigation.navigate('Otp', { email, name, userData: { name, email, password, number, birthday, address } });
        console.log("Navigating to OTP screen with email:", email);
      } else {
        Alert.alert('Error', 'Failed to generate OTP. Please try again.');
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
      Alert.alert('Error', errorMessage);
    }
  };
  
  

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <Text style={styles.titleText}>Signup</Text>
        <Text> Lets get started with your account</Text>
      </View>
      <View style={styles.forms}>
        <TextInput
          label="Full Name"
          placeholder="Full Name"
          value={name}
          onChangeText={(name) => setName(name)}
          style={styles.input}
        />
        <TextInput
          label="Email"
          placeholder="Email"
          value={email}
          onChangeText={(email) => setEmail(email)}
          style={styles.input}
        />
        <TextInput
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={(password) => setPassword(password)}
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          label="Number"
          placeholder="Phone Number"
          value={number}
          onChangeText={(number) => setNumber(number)}
          style={styles.input}
        />
        <TextInput
          label="Birthday"
          placeholder="Birthday"
          value={birthday}
          onChangeText={(birthday) => setBirthday(birthday)}
          style={styles.input}
        />
        <TextInput
          label="Address"
          placeholder="Address"
          value={address}
          onChangeText={(address) => setAddress(address)}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSignupAndRequestOtp} style={styles.button}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <View style={styles.backToLogin}>
          <Text>Already have an account? <Text style={styles.blueText} onPress={handleBackToLogin}>Login</Text></Text>
        </View>
      </View>
      <Text style={styles.terms}>
        By signing up to create an account I accept App's <Text style={styles.blueText}>Terms of use and Policy privacy</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  title: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 70,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "700",
  },
  forms: {
    width: "100%",
    marginBottom: 130,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  button: {
    width: "100%",
    height: 40,
    backgroundColor: "powderblue",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    marginBottom: 10,
    marginTop: 30,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  backToLogin: {
    justifyContent: "center",
    alignItems: "center",
  },
  terms: {
    textAlign: 'center',
    width: 300,
  },
  blueText: {
    color: "blue",
  }
});

export default Signup;
