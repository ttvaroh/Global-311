import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
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
    return currentUser && pin.approvals.includes(currentUser.$id);
  };

  // Check if current user has already declined this pin
  const hasUserDeclined = (pin) => {
    return currentUser && pin.declines.includes(currentUser.$id);
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

  // Handle pin decline
  const handleDeclinePin = async () => {
    if (!selectedPin || !currentUser) return;

    try {
      await mapService.declinePin(selectedPin.$id);
      const updatedPins = await fetchPins();
      const updatedPin = updatedPins.find((p) => p.$id === selectedPin.$id);
      setSelectedPin(updatedPin);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to decline pin");
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

  return (
    <View style={{ flex: 1 }}>
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
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{pin.title}</Text>
                <Text style={styles.calloutDescription}>{pin.description}</Text>
                <Text style={styles.calloutInfo}>
                  Status:{" "}
                  {pin.status.charAt(0).toUpperCase() + pin.status.slice(1)}
                </Text>
                <Text style={styles.calloutInfo}>
                  Approvals: {pin.approvals.length} | Declines:{" "}
                  {pin.declines.length}
                </Text>
                <Text style={styles.calloutAction}>Tap for more details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Pin</Text>

            <TextInput
              style={styles.input}
              placeholder="Pin Title"
              value={pinTitle}
              onChangeText={setPinTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Pin Description"
              value={pinDescription}
              onChangeText={setPinDescription}
              multiline
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddPin}
              >
                <Text style={styles.buttonText}>Add Pin</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedPin.title}</Text>

              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailText}>{selectedPin.description}</Text>

              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailText}>
                {selectedPin.status.charAt(0).toUpperCase() +
                  selectedPin.status.slice(1)}
              </Text>

              <Text style={styles.detailLabel}>Verification:</Text>
              <View style={styles.verificationContainer}>
                <View style={styles.verificationItem}>
                  <Text style={styles.verificationCount}>
                    {selectedPin.approvals.length}
                  </Text>
                  <Text style={styles.verificationLabel}>Approvals</Text>
                </View>

                <View style={styles.verificationItem}>
                  <Text style={styles.verificationCount}>
                    {selectedPin.declines.length}
                  </Text>
                  <Text style={styles.verificationLabel}>Declines</Text>
                </View>
              </View>

              {/* Verification Actions */}
              {currentUser && currentUser.$id !== selectedPin.userId && (
                <View style={styles.verificationActions}>
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      styles.approveButton,
                      hasUserApproved(selectedPin) && styles.activeButton,
                    ]}
                    onPress={handleApprovePin}
                    disabled={hasUserApproved(selectedPin)}
                  >
                    <Text style={styles.buttonText}>
                      {hasUserApproved(selectedPin) ? "Approved" : "Approve"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      styles.declineButton,
                      hasUserDeclined(selectedPin) && styles.activeButton,
                    ]}
                    onPress={handleDeclinePin}
                    disabled={hasUserDeclined(selectedPin)}
                  >
                    <Text style={styles.buttonText}>
                      {hasUserDeclined(selectedPin) ? "Declined" : "Decline"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Admin Actions */}
              <View style={styles.adminActions}>
                {selectedPin.status !== "resolved" && (
                  <TouchableOpacity
                    style={[styles.adminButton, styles.resolveButton]}
                    onPress={handleMarkResolved}
                  >
                    <Text style={styles.buttonText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.adminButton, styles.deleteButton]}
                  onPress={handleDeletePin}
                >
                  <Text style={styles.buttonText}>Delete Pin</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchPins}>
        <Text style={styles.refreshButtonText}>🔄</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={handleAddPin}>
        <Text style={styles.refreshButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// Extended Styles
const styles = StyleSheet.create({
  loadingContainer: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  addButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  resolveButton: {
    backgroundColor: "#4CAF50",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  refreshButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  refreshButtonText: {
    fontSize: 24,
  },
  callout: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    marginBottom: 5,
  },
  calloutInfo: {
    fontSize: 12,
    color: "#666",
  },
  calloutAction: {
    marginTop: 5,
    fontStyle: "italic",
    fontSize: 12,
    color: "#2196F3",
  },
  detailLabel: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
  },
  detailText: {
    marginBottom: 10,
  },
  verificationContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
  },
  verificationItem: {
    alignItems: "center",
  },
  verificationCount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  verificationLabel: {
    fontSize: 12,
    color: "#666",
  },
  verificationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  verifyButton: {
    padding: 10,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  declineButton: {
    backgroundColor: "#FF9800",
  },
  activeButton: {
    opacity: 0.6,
  },
  adminActions: {
    marginTop: 5,
    marginBottom: 10,
  },
  adminButton: {
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
  },
});

export default MapScreen;
