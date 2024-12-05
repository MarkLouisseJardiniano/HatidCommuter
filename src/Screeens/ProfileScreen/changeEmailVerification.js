import React, { useState } from "react";
import { View, Text,StyleSheet, TextInput, Button, Alert, Image } from "react-native";
import axios from "axios";
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChangeEmailVerification = ({ route, navigation }) => {
    const { email, newEmail } = route.params; 
    const [otp, setOtp] = useState("");
    const [isDisabled, setIsDisabled] = useState(false);
    const [timer, setTimer] = useState(0);

    const handleVerifyOtp = async () => {
        try {
          console.log(email);
          console.log(newEmail);
          const response = await axios.post(
            "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/verify-email-change-otp",
            { email, newEmail, otp }
          );
      
          if (response.data.status === 'ok') {
            await AsyncStorage.setItem('email', newEmail);
            console.log('New email saved in AsyncStorage');
            navigation.navigate("EditProfile", {email});
          } else {
            
            Alert.alert('Error', response.data.message || 'Unknown error occurred.');
          }
        } catch (error) {
          console.error('Error verifying OTP:', error.response || error);
          const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            'Unknown server error. Please try again.';
          Alert.alert('Error', message);
        }
      };
      
      const handleResendOtp = async () => {
        if (!email || !newEmail) {
          Alert.alert('Validation Error', 'Email and new email are required to resend OTP.');
          return;
        }
      
        try {
          const response = await axios.post(
            'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/generate-email-change-otp',
            { email, newEmail }
          );
      
          if (response.status === 200) {
            setIsDisabled(true);
            let countdown = 120;
            setTimer(countdown);
      
            const interval = setInterval(() => {
              countdown -= 1;
              setTimer(countdown);
      
              if (countdown <= 0) {
                clearInterval(interval);
                setIsDisabled(false);
              }
            }, 1000);
          } else {
            Alert.alert('Error', response.data.message || 'Failed to resend OTP.');
          }
        } catch (error) {
          const errorMessage =
            error.response?.data?.error || error.message || 'An error occurred. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      };
      
  return (
    <View style={{ flex: 1, padding: 40, backgroundColor: "white" }}>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={imagePath.verification}
          style={{
            height: 200,
            width: 200,
            paddingVertical: 150,
            justifyContent: "center",
            alignItems: "center",
          }} 
        />
        <Text
          style={{
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: 20,
          }}
        >
          Email Verification
        </Text>
        <Text           style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            width: "70%",
            fontSize: 16,
            paddingVertical: 20,
          }}>We have sent the verification code to your email address</Text>
      </View>

      <TextInput
  value={otp}
  onChangeText={setOtp}
  placeholder="Enter OTP"
  keyboardType="numeric"
  style={{
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "gray", 
    marginBottom: 10,
    width: "100%",
  }}
/>
<View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 20 }}>
  <Text>Didn’t Receive the Code? </Text>
  <TouchableOpacity
        disabled={isDisabled}
        onPress={handleResendOtp}
        style={{
          padding: 10,
          borderRadius: 5,
        }}
      >
        <Text
          style={{
            color: isDisabled ? "gray" : "blue", // Change color based on the button state
            textAlign: "center",
          }}
        >
          {isDisabled ? `Resend in ${timer}s` : "Resend"}
        </Text>
      </TouchableOpacity>
</View>

<TouchableOpacity>
    <Text style={{ color: "white", backgroundColor: "powderblue", padding: 10, textAlign: "center", borderRadius: 10 }} onPress={handleVerifyOtp}>Confirm</Text>
  </TouchableOpacity>

    </View>
  )
}

export default ChangeEmailVerification

const styles = StyleSheet.create({})