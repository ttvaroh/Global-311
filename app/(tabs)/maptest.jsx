import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import MapScreen from "../../components/MapScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";

const MapTest = () => {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(false);

  // Request permission and get initial location when component mounts
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied"
        );
        return;
      }

      setLoading(true);
      try {
        // Get current location
        let location = await Location.getCurrentPositionAsync({});
        setCoordinates({
          ...coordinates,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log("Error getting location:", error);
        Alert.alert("Error", "Could not get your current location");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Function to handle address search
  const handleAddressSubmit = async () => {
    if (!address.trim()) {
      Alert.alert("Error", "Please enter an address");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Geocode the address
      const results = await Location.geocodeAsync(address);

      if (results.length > 0) {
        setCoordinates({
          ...coordinates,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });
      } else {
        Alert.alert("Not Found", "Could not find the location you entered");
      }
    } catch (error) {
      console.log("Error geocoding address:", error);
      Alert.alert("Error", "Failed to search for this address");
    } finally {
      setLoading(false);
    }
  };

  // Function to get current location
  const getCurrentLocation = async () => {
    setLoading(true);

    try {
      let location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        ...coordinates,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log("Error getting current location:", error);
      Alert.alert("Error", "Could not get your current location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row p-2.5 bg-primary border-primary">
        <TextInput
          className="flex-1 h-10 border border-white rounded px-2.5 bg-white"
          placeholder="Enter an address"
          value={address}
          onChangeText={setAddress}
          returnKeyType="search"
          onSubmitEditing={handleAddressSubmit}
        />
        <TouchableOpacity
          className="ml-2.5 bg-secondary px-4 justify-center rounded"
          onPress={handleAddressSubmit}
          disabled={loading}
        >
          <Text className="text-white font-bold">Search</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-primary py-2.5 items-center border-b"
        onPress={getCurrentLocation}
        disabled={loading}
      >
        <Text className="text-white font-bold">Use My Location</Text>
      </TouchableOpacity>

      {loading && (
        <View className="absolute top-24 self-center bg-black/70 px-5 py-2.5 rounded-full z-50">
          <Text className="text-white font-bold">Loading...</Text>
        </View>
      )}

      <MapScreen
        latitude={coordinates.latitude}
        longitude={coordinates.longitude}
        latitudeDelta={coordinates.latitudeDelta}
        longitudeDelta={coordinates.longitudeDelta}
      />
    </SafeAreaView>
  );
};

export default MapTest;
