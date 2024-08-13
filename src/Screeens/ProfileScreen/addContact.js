import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";

const AddContact = () => {
  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");

  const handleSave = () => {
    Alert.alert("Saved");
  };
  return (
    <View style={styles.container}>
      <TextInput
        label="Name"
        placeholder="Name"
        value={name}
        onChangeText={(name) => setName(name)}
        mode="flat"
        style={styles.input}
        underlineColor="transparent"
      />
      <TextInput
        label="Number"
        placeholder="Phone Number"
        value={number}
        onChangeText={(number) => setNumber(number)}
        mode="flat"
        style={styles.input}
        underlineColor="transparent"
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
    marginTop: 280,
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
