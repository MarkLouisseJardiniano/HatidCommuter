import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
} from "react-native";

const Rental = () => {
  return (

    <View style={styles.container}>
      <View style={styles.rentalContainer}>
        <Text style={styles.rentalName}>DCLOR</Text>
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
  rentalContainer: {
    width: 370,
    height: 80,
    backgroundColor: "lightgray",
    borderRadius: 10,
  },
  rentalName: {
    marginTop: 23,
    marginLeft: 40,
    fontSize: 24,
    fontWeight: "700",
  },
});
export default Rental;
