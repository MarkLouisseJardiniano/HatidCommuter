import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const VehicleOptions = ({ onSelectVehicle }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    onSelectVehicle(vehicle);
  };

  return (
    <View style={styles.vehicleOptionsContainer}>
      <Text>Suggested Vehicles</Text>
      <TouchableOpacity
        style={[styles.vehicleOption, selectedVehicle === 'Tricycle' && styles.selectedOption]}
        onPress={() => handleSelectVehicle('Tricycle')}
      >
        <Text>Tricycle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.vehicleOption, selectedVehicle === 'Jeep' && styles.selectedOption]}
        onPress={() => handleSelectVehicle('Jeep')}
      >
        <Text>Jeep</Text>
      </TouchableOpacity>
      {selectedVehicle && (
        <TouchableOpacity style={styles.bookButton}>
          <Text>Book {selectedVehicle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  vehicleOptionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  vehicleOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  bookButton: {
    backgroundColor: 'lightblue',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  
});

export default VehicleOptions;
