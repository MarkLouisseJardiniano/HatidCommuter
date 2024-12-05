import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const Contact = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state for async operations
  const [error, setError] = useState(null); // Add error state

  // Fetch sample contacts when the component mounts
  const fetchSampleContacts = async () => {
    try {
      const response = await axios.get(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/contact/sample"
      );
      console.log("Sample Contacts Response:", response.data); // Debugging
      return response.data; // Return sample contacts
    } catch (error) {
      console.error("Error fetching sample contacts:", error);
      setError("Failed to load sample contacts"); // Set error state
      return []; // Return empty array if there's an error
    }
  };

  // Fetch user contacts based on the userId
  const fetchContacts = async () => {
    if (!userId) return [];
    setLoading(true); // Set loading to true when fetching contacts
    try {
      const response = await axios.get(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/contact/user/${userId}`
      );
      const fetchedContacts = response.data.length > 0 ? response.data : [];
      return fetchedContacts; // Return user contacts
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("Failed to load user contacts");
      return []; // Return empty array if there's an error
    }
  };

  // Fetch userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId); // Set userId if available
        }
      } catch (err) {
        console.error("Error fetching user ID:", err);
      }
    };

    fetchUserId();
  }, []);

  // Fetch both sample and user contacts and combine them
  useEffect(() => {
    const fetchAllContacts = async () => {
      setLoading(true); // Set loading to true when fetching contacts

      // Fetch sample contacts and user contacts concurrently
      const [sampleContacts, userContacts] = await Promise.all([
        fetchSampleContacts(),
        fetchContacts(),
      ]);

      // Combine both contacts and update state
      setContacts([...sampleContacts, ...userContacts]);

      setLoading(false); // Set loading to false once fetch is done
    };

    fetchAllContacts(); // Trigger both fetches
  }, [userId]);

  // Render each contact
  const renderContact = useCallback(
    ({ item }) => (
      <View style={styles.contactContainer}>
        <View style={styles.contactContent}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.number}</Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading contacts...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text> // Display error message
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id || item.id || item.name} // Ensure unique key for list items
          renderItem={renderContact}
          initialNumToRender={10}
          windowSize={5}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts available</Text>
          }
        />
      )}

      <TouchableOpacity onPress={() => navigation.navigate("AddContact")} style={styles.button}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  contactContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  contactContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  contactPhone: {
    fontSize: 16,
    color: "#666",
  },
  button: {
    width: 250,
    height: 40,
    backgroundColor: "powderblue",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
    marginTop: 20,
  },
});

export default Contact;
