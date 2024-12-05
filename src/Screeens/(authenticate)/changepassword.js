import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from "react";
import axios from "axios";

const Changepassword = ({ route, navigation }) => {
    const { email } = route.params;
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false); // Track loading state
    const handleChangePassword = async () => {
        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters long.");
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await axios.post(
                'https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/forget-password',
                { email, newPassword: password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
    
            console.log("Response:", response);  // Log the response from the server
            
            if (response.status === 200) {
                Alert.alert("Success", "Password successfully updated.");
                navigation.navigate("Login");
            } else {
                Alert.alert("Error", response.data.message || "An error occurred. Please try again.");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            
            if (error.response) {
                console.error("Error response data:", error.response.data);  // Log error response data
                Alert.alert("Error", error.response.data.message || "An error occurred. Please try again.");
            } else {
                Alert.alert("Error", "Network error. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <View style={{ flex: 1, paddingVertical: 80, paddingHorizontal: 40 }}>
            <Text style={{ fontWeight: "bold", fontSize: 28 }}>Reset Password</Text>
            <Text style={{ fontSize: 16 }}>Enter your new password.</Text>

            <View style={{ paddingVertical: 20 }}>
                <Text style={{ fontWeight: "bold", fontSize: 20 }}>New Password</Text>
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                />
            </View>

            <TouchableOpacity 
                onPress={handleChangePassword} 
                style={[styles.button, loading && { backgroundColor: "#ccc" }]} 
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={{ color: "black", textAlign: "center",     fontWeight: 'bold',
    fontSize: 18, }}>Reset Password</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default Changepassword;

const styles = StyleSheet.create({
    input: {
        width: "100%",
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingBottom: 8,
    },
    button: {
        padding: 10,
        backgroundColor: "powderblue",
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius:10
    },
});
