import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import React, { useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddContact = ({ navigation }) => {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const handleSave = async () => {
    if (!name || !number) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User ID is not found.");
        return;
      }

      const response = await axios.post("https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/contact/add", {
        userId,
        name,
        number,
      });

      if (response.status === 201) {
        Alert.alert("Success", "Contact saved successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to save contact.");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={(text) => setName(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Phone Number"
        value={number}
        onChangeText={(text) => setNumber(text)}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <View style={styles.buttonPosition}>
        <TouchableOpacity onPress={handleSave} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 20, // Adjusted for better positioning
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

export default AddContact;
