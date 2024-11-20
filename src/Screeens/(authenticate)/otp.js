import React, { useState } from 'react';
import { View,Text, TextInput, Alert,Image } from 'react-native';
import axios from 'axios';
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native-gesture-handler";

const OtpVerificationScreen = ({ route, navigation }) => {
  const { email } = route.params; // Getting email from previous screen
  const [otp, setOtp] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [timer, setTimer] = useState(0);


  const handleVerifyOtp = async () => {
    try {
      // Send OTP verification request to the backend
      const response = await axios.post(
        'https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/otp/verify-otp',
        { email, otp }
      );

      navigation.navigate('CompletionMessage'); 

    } catch (error) {
    
    }
  };

  
  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Validation Error', 'Email is required to resend OTP.');
      return;
    }

    try {
      // Send OTP request
      const response = await axios.post(
        'https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/otp/generate-otp',
        { email }
      );

      if (response.status === 200) {
        
        // Disable the button and start the cooldown timer
        setIsDisabled(true);
        let countdown = 120; // 2 minutes (120 seconds)
        setTimer(countdown);

        const interval = setInterval(() => {
          countdown -= 1;
          setTimer(countdown);

          if (countdown <= 0) {
            clearInterval(interval);
            setIsDisabled(false); // Re-enable the button after 2 minutes
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
  borderBottomWidth: 1, // Bottom border only
  borderBottomColor: "gray", // Color of the bottom border
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
  );
};

export default OtpVerificationScreen;
