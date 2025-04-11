import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import {} from "nativewind";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { mapService } from "../lib/appwrite";
import { icons } from "../constants";
import CategoryDropdown from "./CategoryDropdown";
import { PRESET_CATEGORIES } from "../constants/categories";
import { useGlobalContext } from "../context/GlobalProvider";
import AddressLookup from "./AddressLookup";

const MapScreen = ({
  latitude = 37.78825,
  longitude = -122.4324,
  latitudeDelta = 0.0922,
  longitudeDelta = 0.0421,
}) => {
  const mapRef = useRef(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const { user: currentUser, loading: userLoading } = useGlobalContext();

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Form data
  const [newPinCoords, setNewPinCoords] = useState(null);
  const [pinTitle, setPinTitle] = useState("");
  const [pinDescription, setPinDescription] = useState("");
  const [currAddress, setCurrAddress] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Selected pin for detail view
  const [selectedPin, setSelectedPin] = useState(null);

  // Fetch user and pins on component mount
  useEffect(() => {
    if (currentUser) {
      fetchPins();
    }
  }, [currentUser]);

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

  // Add an effect to check permissions when a pin is selected
  useEffect(() => {
    const checkPermissions = async () => {
      if (selectedPin && currentUser) {
        try {
          // Check if user is the creator or has admin rights
          const isCreator =
            selectedPin.userId === currentUser.$id ||
            currentUser.isAdmin ||
            (await mapService.canDeletePin(selectedPin.$id));
          setIsCreator(isCreator);
        } catch (error) {
          console.error("Error checking permissions:", error);
          setIsCreator(false);
        }
      }
    };

    checkPermissions();
  }, [selectedPin, currentUser]);

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
    setAddressModalVisible(false);
  };

  const handleAddressSubmit = async () => {
    if (!currAddress.trim()) {
      Alert.alert("Error", "Please enter an address");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Geocode the address
      const results = await Location.geocodeAsync(currAddress);

      if (results.length > 0) {
        const newCoords = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };

        setNewPinCoords(newCoords);

        // Now we need to keep the modal open but switch to pin details
        setAddressModalVisible(false);
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
    if (!pinTitle.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    try {
      await mapService.addPin(
        newPinCoords.latitude,
        newPinCoords.longitude,
        pinTitle,
        selectedCategory.id,
        selectedCategory.name,
        pinDescription,
        currentUser.$id
      );
      // Clear form data
      setPinTitle("");
      setPinDescription("");
      setAddModalVisible(false);
      setCurrAddress("");
      setSelectedCategory(null);

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
  const hasUserConfirmed = (pin) => {
    return (
      currentUser && pin.approvals && pin.approvals.includes(currentUser.$id)
    );
  };

  // Handle pin approval
  const handleAgreePin = async () => {
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
          "You need to be the creator or have 2+ confirmations to delete this pin"
        );
        return;
      }

      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to resolve and delete this pin?",
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
                {pin.approvals && pin.approvals.length > 1 ? (
                  <Text className="text-xs text-gray-600">
                    {pin.approvals.length} People Agree
                  </Text>
                ) : (
                  ""
                )}
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
            {/* Category dropdown and other pin details */}
            <CategoryDropdown
              categories={PRESET_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              placeholder="Select a category"
            />
            <AddressLookup
              value={currAddress}
              onChangeText={setCurrAddress}
              onSelectAddress={(addressData) => {
                setNewPinCoords({
                  latitude: addressData.latitude,
                  longitude: addressData.longitude,
                });
                setCurrAddress(addressData.address);
                setAddressModalVisible(false);
              }}
              onCancel={() => setAddressModalVisible(false)}
              label="Search for an address"
              placeholder="Enter an address to add pin"
              containerStyle="mb-4"
            />
            <TextInput
              className="border border-white rounded p-2.5 mb-4 h-24 text-white"
              placeholder="Describe The Issue"
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

              {/* Admin Actions vs Viewer Actions */}
              {isCreator ? (
                <View className="mt-1 mb-2.5">
                  <TouchableOpacity
                    className="p-2.5 rounded w-full items-center bg-green-500 my-1"
                    onPress={handleDeletePin}
                  >
                    <Text className="text-white font-bold">Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row justify-between my-4">
                  <TouchableOpacity
                    className={`p-2.5 rounded w-5/12 items-center ${
                      hasUserConfirmed(selectedPin)
                        ? "bg-green-200"
                        : "bg-green-500"
                    }`}
                    onPress={handleAgreePin}
                    disabled={hasUserConfirmed(selectedPin)}
                  >
                    <Text className="text-white font-bold">
                      {hasUserConfirmed(selectedPin)
                        ? "Approved"
                        : "It's Still There"}
                    </Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity
                    className={`p-2.5 rounded w-5/12 items-center ${
                      hasUserConfirmed(selectedPin)
                        ? "bg-green-200"
                        : "bg-red-500"
                    }`}
                    onPress={handleAgreePin}
                    disabled={hasUserConfirmed(selectedPin)}
                  >
                    <Text className="text-white font-bold">It's Gone</Text>
                  </TouchableOpacity> */}
                </View>
              )}

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

      {/* Add button */}
      <TouchableOpacity
        className="absolute bottom-20 right-5 bg-white rounded-full w-12 h-12 justify-center items-center shadow-md"
        onPress={() => {
          if (currentUser) {
            setAddModalVisible(true);
            setAddressModalVisible(true);
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
