import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, TextInput, Alert, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import axios from 'axios';
import imagePath from "../../constants/imagePath";
const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const userData = { email, password };
      const res = await axios.post('https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/login', userData);
  
      console.log('Login Response:', res.data);
  
      if (res.data.status === 'ok') {
        const { token, userId } = res.data.data;
  
        if (!userId) {
          throw new Error('User ID is missing in the response');
        }
  
        await AsyncStorage.setItem('KeepLoggedIn', 'true');
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userId', userId);
  
        console.log('Token:', token);
        console.log('User ID:', userId);
        navigation.replace("TabNav");
  
      } else {
        Alert.alert('Login Failed', res.data.message);
      }
  
    } catch (error) {
      console.error("Login Error:", error);
  
      if (error.response && error.response.data && error.response.data.message) {
        const message = error.response.data.message;
  
        if (message.includes("suspended")) {
          Alert.alert("Account Suspended", message);
        } else if (message.includes("Invalid Credentials") || message.includes("Invalid email or password")) {
          Alert.alert("Login Failed", "Invalid email or password. Please try again.");
        } else {
          Alert.alert("Login Failed", message);
        }
      } else {
        Alert.alert("Login Failed", "An error occurred. Please try again.");
      }
    }
  };


  const handleBackToSignUp = () => {
    navigation.navigate("Signup");
  }

  const handleForgot = () => {
    navigation.navigate("Forgot");
  }

  return (
    <View style={styles.container}>
        <Image
            source={imagePath.logo}
            style={{width: 250, height: 250, alignItems: "center",}}
            resizeMode="contain"
          />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Text style={styles.forgotPassword} onPress={handleForgot}>Forgot Password</Text>
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.backToSignUp}>Dont have an account? <Text   style={styles.blueText} onPress={handleBackToSignUp}>Signup</Text></Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 100,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  button: {
    width: '100%',
    backgroundColor: 'powderblue',
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  forgotPassword: {
 alignSelf: 'flex-end'
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  blueText: {
    color: "blue",
  },
  backToSignUp: {
    alignItems: 'center',
    justifyContent:'center',
    marginBottom: 300,
  }
});

export default Login;
