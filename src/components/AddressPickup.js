import React from "react";
import { StyleSheet, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_MAP_KEY } from "../constants/googleMapKey";

const AddressPickup = ({ placeholderText, fetchAddress }) => {
  const onPressAddress = (data, details) => {
    if (!details || !details.address_components) {
      console.error("Invalid address details");
      return;
    }

    let resLength = details.address_components.length;
    let zipCode = "";

    let filtersResCity = details.address_components.filter((val) => {
      if (val.types.includes("locality") || val.types.includes("sublocality")) {
        return val;
      }
      if (val.types.includes("postal_code")) {
        zipCode = val.long_name || "";
      }
      return false;
    });

    let dataTextCityObj =
      filtersResCity.length > 0
        ? filtersResCity[0]
        : details.address_components[
            resLength > 1 ? resLength - 2 : resLength - 1
          ];

    let cityText = dataTextCityObj?.long_name || dataTextCityObj?.short_name || "";

    const lat = details.geometry?.location?.lat;
    const lng = details.geometry?.location?.lng;

    if (lat && lng) {
      fetchAddress(lat, lng, zipCode, cityText);
    } else {
      console.error("Invalid latitude or longitude");
    }
  };

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={placeholderText}
        onPress={onPressAddress}
        fetchDetails={true}
        query={{
          key: GOOGLE_MAP_KEY,
          language: "en",
        }}
        styles={{
          textInputContainer: styles.containerStyle,
          textInput: styles.textInputStyle,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerStyle: {
    backgroundColor: "white",
  },
  textInputStyle: {
    height: 48,
    color: "black",
    fontSize: 16,
    backgroundColor: "#f3f3f3",
  },
});

export default AddressPickup;
