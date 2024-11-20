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
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  useEffect(() => {
    const fetchIds = async () => {
      try {
        const storedBookingId = await AsyncStorage.getItem('bookingId');
        console.log("Stored Booking ID: ", storedBookingId);
        const storedDriverId = await AsyncStorage.getItem('driverId');
        const storedUserId = await AsyncStorage.getItem('userId');

        console.log("Fetched IDs:", { storedBookingId, storedDriverId, storedUserId });

        if (storedBookingId) {
          setBookingId(storedBookingId);
        }
        if (storedDriverId) {
          setDriverId(storedDriverId);
          
          // Fetch the driver's name based on the driverId
          const response = await axios.get(`https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/driver/driver/${storedDriverId}`);
          if (response.data && response.data.name) {
            setDriverName(response.data.name);
            setPlateNumber(response.data.vehicleInfo2.plateNumber);
            setVehicleType(response.data.vehicleInfo2.vehicleType)
          } else {
            setDriverName('Unknown Driver'); // Fallback if no name is found
          }
        }
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Error fetching IDs or driver's name:", error);
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
      const response = await axios.post('https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/violate/violation', {
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
    <View style={{flexDirection: "row",  alignItems: "center",    }}>
    <View style={styles.circle} />
      <View style={{ justifyContent: 'center',}}>
      <Text style={styles.driverName}>{driverName}</Text>
      <View style={{flexDirection: "row"}}>
      <Text style={styles.driverName}>{vehicleType}</Text>
      <Text style={styles.driverName}>{plateNumber}</Text>
      </View>
      </View>
    </View>
  


      <View style={styles.subsOption}>
      <Text style={{    fontSize: 20, fontWeight: 'bold',}}>What went wrong?</Text>
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
          <Text style={styles.optionText}>Late Arrival</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Vehicle Condition')}
          <Text style={styles.optionText}>Vehicle Condition</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Rudeness')}
          <Text style={styles.optionText}>Rude Behavior</Text>
        </View>
        <View style={styles.selection}>
          {renderRadioButton('Rudeness')}
          <Text style={styles.optionText}>Other</Text>
        </View>
      </View>
      <Text style={{    fontSize: 20, fontWeight: 'bold',}}>Additional Details</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Please provide any additional information about the incident..."
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
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 30,
    marginLeft: 30,
    marginTop: 0,
    marginRight: '5%',
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
    flexDirection: 'column',
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subsOption: {
    flexDirection: 'column',

  },
  selection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
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
