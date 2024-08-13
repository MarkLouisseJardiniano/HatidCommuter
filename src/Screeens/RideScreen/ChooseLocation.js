import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import AddressPickup from "../../components/AddressPickup";
import CustomBtn from "../../components/CustomBtn";
import { showError } from "../../helper/helperFunction";

const ChooseLocation = ({ route }) => {
  const navigation = useNavigation();

  const [state, setState] = useState({
    destinationCords: {},
  });

  const { destinationCords } = state;

  const checkValid = () => {
    if (Object.keys(destinationCords).length === 0) {
      showError("Please enter your destination location");
      return false;
    }
    return true;
  };

  const onDone = () => {
    const isValid = checkValid();
    if (isValid) {
      navigation.navigate("home", {
        destinationCords,
      });
    }
  };

  const fetchDestinationCords = (lat, lng, zipCode, cityText) => {
    console.log("Zip code:", zipCode);
    console.log("City text:", cityText);
    setState({
      ...state,
      destinationCords: {
        latitude: lat,
        longitude: lng,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: "white", flex: 1, padding: 24 }}
      >
        <View style={{ marginBottom: 16 }} />
        <AddressPickup
          placeholderText="Enter Destination Location"
          fetchAddress={fetchDestinationCords}
        />
        <CustomBtn
          btnText="Done"
          onPress={onDone}
          btnStyle={{ marginTop: 24 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChooseLocation;
