import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SavedPlaces = () => {
  return (
    <View style={styles.container}>
      <View style={styles.places}>
        <Ionicons name="home" size={30} />
        <Text style={styles.placeItems}>Add Home</Text>
      </View>
      <View style={styles.places}>
        <Ionicons name="briefcase" size={30} />
        <Text style={styles.placeItems}>Add Work</Text>
      </View>
      <View style={styles.places}>
        <Ionicons name="add" size={30} />
        <Text style={styles.placeItems}>Add New</Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginLeft: 40,
    marginTop: 20,
    flexDirection: "column",
  },
  places: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    marginTop: 30,
  },
  placeItems: {
    color: "blue",
    fontWeight: "700",
  },
});

export default SavedPlaces;
