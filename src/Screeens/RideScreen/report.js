import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert,Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import imagePath from '../../constants/imagePath';
const Report = ({route}) => {
  
  const [selectedOption, setSelectedOption] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const { driverId } = route.params;
  const [userId, setUserId] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
const [profile, setProfile] = useState(null);

useEffect(() => {
  const fetchIds = async () => {
    try {
      const storedBookingId = await AsyncStorage.getItem('bookingId');
      const storedUserId = await AsyncStorage.getItem('userId');

      if (storedBookingId) {
        setBookingId(storedBookingId);
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
    console.log("Booking ID:", bookingId);
    console.log("Driver ID:", driverId);
    console.log("User ID:", userId);
    console.log("Selected Report Option:", selectedOption);
    console.log("Description:", description);
  
    if (!bookingId || !driverId || !userId) {
      Alert.alert("Error", "IDs for booking, driver, and user are required.");
      console.log("Error: Missing required IDs.");
      return;
    }
  
    if (!selectedOption) {
      Alert.alert("Error", "Please select a report type and enter a description.");
      console.log("Error: Missing report type or description.");
      return;
    }
  
    try {
      console.log("Sending report data:", {
        bookingId,
        driverId,
        userId,
        report: selectedOption,
        description
      });
  
      const response = await axios.post('https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/violate/violation', {
        bookingId,
        driverId: driverId,
        userId,
        report: selectedOption,
        description
      });
  
      console.log("Response from API:", response.data);
  
      if (response.data.status === 'ok') {
        Alert.alert("Success", "Report submitted successfully.");
        console.log("Report submitted successfully.");
        setSelectedOption('');
        setDescription('');
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit the report.");
        console.log("Error: " + (response.data.message || "Failed to submit the report."));
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
