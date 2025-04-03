import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {} from "nativewind";
import MapView, { Marker, Callout } from "react-native-maps";
import { mapService } from "../lib/appwrite";
import { icons } from "../constants";

const MapScreen = ({
  latitude = 37.78825,
  longitude = -122.4324,
  latitudeDelta = 0.0922,
  longitudeDelta = 0.0421,
}) => {
  const mapRef = useRef(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Form data
  const [newPinCoords, setNewPinCoords] = useState(null);
  const [pinTitle, setPinTitle] = useState("");
  const [pinDescription, setPinDescription] = useState("");

  // Selected pin for detail view
  const [selectedPin, setSelectedPin] = useState(null);

  // Fetch user and pins on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const user = await mapService.getCurrentUser();
        setCurrentUser(user);

        // Get all pins
        await fetchPins();
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, []);

  // Animate to new region when coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        },
        1000
      );
    }
  }, [latitude, longitude, latitudeDelta, longitudeDelta]);

  // Fetch pins from Appwrite
  const fetchPins = async () => {
    try {
      setLoading(true);
      const allPins = await mapService.getAllPins();
      setPins(allPins);
      return allPins;
    } catch (error) {
      Alert.alert("Error", "Failed to load map pins");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle long press on map to add a new pin
  const handleLongPress = (event) => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to add pins");
      return;
    }

    const { coordinate } = event.nativeEvent;
    setNewPinCoords(coordinate);
    setAddModalVisible(true);
  };

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
        setNewPinCoords({
          ...newPinCoords,
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

  // Add a new pin to the database
  const handleAddPin = async () => {
    if (!newPinCoords) return;

    try {
      await mapService.addPin(
        newPinCoords.latitude,
        newPinCoords.longitude,
        pinTitle,
        pinDescription
      );

      // Clear form data
      setPinTitle("");
      setPinDescription("");
      setAddModalVisible(false);

      // Refresh pins
      fetchPins();

      Alert.alert("Success", "Pin added successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to add pin");
      console.error(error);
    }
  };

  // Show pin details modal
  const showPinDetails = (pin) => {
    setSelectedPin(pin);
    setDetailModalVisible(true);
  };

  // Check if current user has already approved this pin
  const hasUserApproved = (pin) => {
    return (
      currentUser && pin.approvals && pin.approvals.includes(currentUser.$id)
    );
  };

  // Handle pin approval
  const handleApprovePin = async () => {
    if (!selectedPin || !currentUser) return;

    try {
      await mapService.approvePin(selectedPin.$id);
      const updatedPins = await fetchPins();
      const updatedPin = updatedPins.find((p) => p.$id === selectedPin.$id);
      setSelectedPin(updatedPin);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to approve pin");
    }
  };

  // Handle pin deletion
  const handleDeletePin = async () => {
    if (!selectedPin || !currentUser) return;

    try {
      const canDelete = await mapService.canDeletePin(selectedPin.$id);

      if (!canDelete) {
        Alert.alert(
          "Insufficient Permissions",
          "You need to be the creator or have 2+ approvals to delete this pin"
        );
        return;
      }

      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this pin?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await mapService.deletePin(selectedPin.$id);
              setDetailModalVisible(false);
              fetchPins();
              Alert.alert("Success", "Pin deleted successfully");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete pin");
    }
  };

  // Handle marking pin as resolved
  const handleMarkResolved = async () => {
    if (!selectedPin || !currentUser) return;

    try {
      await mapService.markPinAsResolved(selectedPin.$id);
      const updatedPins = await fetchPins();
      const updatedPin = updatedPins.find((p) => p.$id === selectedPin.$id);
      setSelectedPin(updatedPin);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to mark pin as resolved");
    }
  };

  // Get pin color based on status
  const getPinColor = (pin) => {
    switch (pin.status) {
      case "resolved":
        return "green";
      case "disputed":
        return "orange";
      default:
        return "red";
    }
  };

  // Format status text safely with null/undefined check
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        }}
        onLongPress={handleLongPress}
      >
        {/* Original marker */}
        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
          title="My Location"
          description="Your current location"
          pinColor="blue"
        />

        {/* Render all pins from the database */}
        {pins.map((pin) => (
          <Marker
            key={pin.$id}
            coordinate={{
              latitude: pin.latitude,
              longitude: pin.longitude,
            }}
            title={pin.title}
            description={pin.description}
            pinColor={getPinColor(pin)}
            onCalloutPress={() => showPinDetails(pin)}
          >
            <Callout tooltip>
              <View className="w-50 bg-white rounded-lg p-2.5 shadow-md">
                <Text className="font-bold text-base mb-1">{pin.title}</Text>
                <Text className="mb-1">{pin.description}</Text>
                <Text className="text-xs text-gray-600">
                  Status: {formatStatus(pin.status)}
                </Text>
                <Text className="text-xs text-gray-600">
                  Approvals: {pin.approvals ? pin.approvals.length : 0}
                </Text>
                <Text className="mt-1 italic text-xs text-blue-500">
                  Tap for more details
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Loading indicator */}
      {loading && (
        <View className="absolute top-2.5 self-center bg-white p-2.5 rounded shadow-md">
          <Text>Loading pins...</Text>
        </View>
      )}

      {/* Add Pin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 justify-start items-center pt-60 bg-black/50">
          <View className="bg-primary rounded-lg p-5 w-4/5 max-h-4/5 shadow-lg">
            <Text className="text-lg font-bold mb-4 text-center text-white">
              Add New Pin
            </Text>
            <TextInput
              className="border border-white rounded p-2.5 mb-4 text-white"
              placeholder="Pin Title"
              placeholderTextColor="gray"
              value={pinTitle}
              onChangeText={setPinTitle}
            />
            <TextInput
              className="border border-white rounded p-2.5 mb-4 text-white"
              placeholder="Address"
              placeholderTextColor="gray"
              value={newPinCoords}
              onChangeText={setPinTitle}
            />
            <TextInput
              className="border border-white rounded p-2.5 mb-4 h-24 text-white"
              placeholder="Pin Description"
              placeholderTextColor="gray"
              value={pinDescription}
              onChangeText={setPinDescription}
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="p-2.5 rounded bg-secondary w-5/12 items-center"
                onPress={() => setAddModalVisible(false)}
              >
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2.5 rounded bg-secondary w-5/12 items-center"
                onPress={handleAddPin}
              >
                <Text className="text-white font-bold">Add Pin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pin Detail Modal */}
      {selectedPin && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-lg p-5 w-4/5 max-h-4/5 shadow-lg">
              <Text className="text-lg font-bold mb-4 text-center">
                {selectedPin.title}
              </Text>

              <Text className="font-bold mt-2.5 mb-1">Description:</Text>
              <Text className="mb-2.5">{selectedPin.description}</Text>

              <Text className="font-bold mt-2.5 mb-1">Status:</Text>
              <Text className="mb-2.5">{formatStatus(selectedPin.status)}</Text>

              <Text className="font-bold mt-2.5 mb-1">Verification:</Text>
              <View className="flex-row justify-around my-2.5 p-2.5 bg-gray-100 rounded">
                <View className="items-center">
                  <Text className="text-xl font-bold">
                    {selectedPin.approvals ? selectedPin.approvals.length : 0}
                  </Text>
                  <Text className="text-xs text-gray-600">People Agree</Text>
                </View>
              </View>

              {/* Verification Actions */}
              {currentUser && currentUser.$id !== selectedPin.userId && (
                <View className="flex-row justify-between my-4">
                  <TouchableOpacity
                    className={`p-2.5 rounded w-5/12 items-center ${
                      hasUserApproved(selectedPin)
                        ? "bg-green-500/60"
                        : "bg-green-500"
                    }`}
                    onPress={handleApprovePin}
                    disabled={hasUserApproved(selectedPin)}
                  >
                    <Text className="text-white font-bold">
                      {hasUserApproved(selectedPin)
                        ? "Approved"
                        : "Still There"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Admin Actions */}
              <View className="mt-1 mb-2.5">
                {(!selectedPin.status || selectedPin.status !== "resolved") && (
                  <TouchableOpacity
                    className="p-2.5 rounded w-full items-center bg-green-500 my-1"
                    onPress={handleMarkResolved}
                  >
                    <Text className="text-white font-bold">Mark Resolved</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  className="p-2.5 rounded w-full items-center bg-red-500 my-1"
                  onPress={handleDeletePin}
                >
                  <Text className="text-white font-bold">Delete Pin</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-blue-500 p-2.5 rounded items-center mt-2.5"
                onPress={() => setDetailModalVisible(false)}
              >
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Refresh button */}
      <TouchableOpacity
        className="absolute bottom-5 right-5 bg-white rounded-full w-12 h-12 justify-center items-center shadow-md"
        onPress={fetchPins}
      >
        <Text className="text-2xl">🔄</Text>
      </TouchableOpacity>

      {/* Add button - I noticed this was previously linked to handleAddPin but should probably open the modal instead */}
      <TouchableOpacity
        className="absolute bottom-20 right-5 bg-white rounded-full w-12 h-12 justify-center items-center shadow-md"
        onPress={() => {
          if (currentUser) {
            setAddModalVisible(true);
          } else {
            Alert.alert("Error", "You must be logged in to add pins");
          }
        }}
      >
        <Text className="text-2xl">+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MapScreen;
