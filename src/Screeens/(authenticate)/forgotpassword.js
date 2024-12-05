import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from "react";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const navigation = useNavigation();

    const handleSignupAndRequestOtp = async () => {
        try {
            console.log("Signing up with email:", email);

            // Step 1: Verify if the email exists
            const emailCheckResponse = await axios.post(
                "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/check-email",
                { email }
            );

            if (!emailCheckResponse.data.exists) {
                Alert.alert("Validation Error", "This email is not registered.");
                return;
            }

            // Step 2: Store the email in AsyncStorage
            try {
                await AsyncStorage.setItem('user', JSON.stringify({ email }));
                console.log("Email stored in AsyncStorage:", email);
            } catch (storageError) {
                console.error("Error storing email in AsyncStorage:", storageError);
                Alert.alert('Error', 'Failed to store email locally. Please try again.');
                return;
            }

            console.log("Requesting OTP for email:", email);
            const otpResponse = await axios.post(
                'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/generate-changepassword-user-otp',
                { email }
            );

            console.log("OTP Response:", otpResponse.data);
            Alert.alert('Success', 'OTP sent successfully! Check your email for the OTP.');

            navigation.navigate('ChangepasswordOTP', { email });
            console.log("Navigated to OTP screen with email:", email);

        } catch (error) {
            console.error("Error during signup and OTP request:", error);

            if (error.response) {
                const { status, data } = error.response;
                if (status === 404) {
                    Alert.alert('Error', 'This email is not registered.');
                } else if (data && data.message) {
                    Alert.alert('Error', data.message);
                } else {
                    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                }
            } else {
                Alert.alert('Error', 'Network error. Please check your connection and try again.');
            }
        }
    };

    return (
        <View style={{ flex: 1, paddingVertical: 60, paddingHorizontal: 40, alignItems: "center", backgroundColor: "white" }}>
            <View style={{ width: "100%" }}>
                <Text style={{ fontWeight: "bold", fontSize: 28 }}>Forgot Password</Text>
                <Text>Enter your email to receive a one-time password.</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                />
                <TouchableOpacity onPress={handleSignupAndRequestOtp} style={{ backgroundColor: "powderblue", width: "100%", borderRadius: 10 }}>
                    <Text style={{ color: "black",     fontWeight: 'bold',
    fontSize: 18, padding: 10, textAlign: "center" }}>Send OTP</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ForgotPassword;

const styles = StyleSheet.create({
    input: {
        width: "100%",
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingBottom: 8,
        paddingTop: 20
    },
});
