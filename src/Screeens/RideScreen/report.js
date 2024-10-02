import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Report = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchIds = async () => {
      try {
        const storedBookingId = await AsyncStorage.getItem('bookingId');
        const storedDriverId = await AsyncStorage.getItem('driverId');
        const storedUserId = await AsyncStorage.getItem('userId');
  
        console.log("Fetched IDs:", { storedBookingId, storedDriverId, storedUserId });
  
        if (storedBookingId) {
          console.log("Booking ID fetched:", storedBookingId);
          setBookingId(storedBookingId);
        } else {
          console.log("No Booking ID found.");
        }
  
        if (storedDriverId) {
          console.log("Driver ID fetched:", storedDriverId);
          setDriverId(storedDriverId);
        } else {
          console.log("No Driver ID found.");
        }
  
        if (storedUserId) {
          console.log("User ID fetched:", storedUserId);
          setUserId(storedUserId);
        } else {
          console.log("No User ID found.");
        }
      } catch (error) {
        console.error("Error fetching IDs:", error);
      }
    };
  
    fetchIds();
  }, []);
  
  
  const handleReport = async () => {
    if (!bookingId || !driverId || !userId) {
      Alert.alert("Error", "IDs for booking, driver, and user are required.");
      return;
    }

    if (!selectedOption || !description) {
      Alert.alert("Error", "Please select a report type and enter a description.");
      return;
    }

    try {
      const response = await axios.post('https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/violate/violation', {
        bookingId,
        driverId,
        userId,
        report: selectedOption,
        description
      });

      if (response.data.status === 'ok') {
        Alert.alert("Success", "Report submitted successfully.");
        setSelectedOption('');
        setDescription('');
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit the report.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "An error occurred while submitting the report.");
    }
  };

  const renderRadioButton = (value) => (
    <TouchableOpacity
      style={styles.radioButton}
      onPress={() => setSelectedOption(value)}
    >
      <View
        style={[
          styles.radioButtonCircle,
          selectedOption === value && styles.radioButtonCircleSelected,
        ]}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.subsOption}>
        <View style={styles.selection}>
          {renderRadioButton('Harassment')}
          <Text style={styles.optionText}>Harassment</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Unsafe Driving')}
          <Text style={styles.optionText}>Unsafe Driving</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Lateness')}
          <Text style={styles.optionText}>Lateness</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Vehicle Condition')}
          <Text style={styles.optionText}>Vehicle Condition</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Rudeness')}
          <Text style={styles.optionText}>Rudeness</Text>
        </View>
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Leave your report here..."
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleReport}>
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexDirection: 'column',
    flex: 1,
  },
  subsOption: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioButtonCircleSelected: {
    backgroundColor: '#000',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Report;
