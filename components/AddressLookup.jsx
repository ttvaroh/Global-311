import React, { useState, useEffect, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";

const AddressLookup = forwardRef(
  (
    {
      value,
      onChangeText,
      onSelectAddress,
      placeholder = "Search for an address or place",
      label = "Enter Location",
      showCancelButton = true,
      onCancel,
      containerStyle,
      inputStyle,
      errorStyle,
      listContainerStyle,
      buttonStyle,
      buttonTextStyle,
      ...textInputProps
    },
    ref
  ) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    // Fetch address suggestions from Nominatim (OpenStreetMap)
    const fetchNominatimSuggestions = async (query) => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Make request to Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`,
          {
            headers: {
              "User-Agent": "Global-311", // Required by OSM usage policy
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        const formattedSuggestions = data.map((item) => ({
          id: item.place_id.toString(),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          formattedAddress: item.display_name,
          type: item.type,
          importance: item.importance,
        }));

        // Sort by importance (higher values first)
        formattedSuggestions.sort((a, b) => b.importance - a.importance);

        setSuggestions(formattedSuggestions);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setError("Failed to fetch address suggestions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the address input to avoid excessive API calls
    useEffect(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      const timeout = setTimeout(() => {
        fetchNominatimSuggestions(value);
      }, 500); // Wait 500ms after user stops typing

      setDebounceTimeout(timeout);

      return () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
      };
    }, [value]);

    // Handle selection of an address from suggestions
    const handleSelectAddress = (address) => {
      Keyboard.dismiss();
      onChangeText(address.formattedAddress);
      setSuggestions([]);
      if (onSelectAddress) {
        onSelectAddress({
          latitude: address.latitude,
          longitude: address.longitude,
          address: address.formattedAddress,
        });
      }
    };

    // Handle manual submission
    const handleManualSubmit = async () => {
      if (!value?.trim()) {
        setError("Please enter an address");
        return;
      }

      setIsLoading(true);
      setError(null);
      Keyboard.dismiss();

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=1`,
          {
            headers: {
              "User-Agent": "MapPinApp", // Replace with your app name
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.length > 0) {
          if (onSelectAddress) {
            onSelectAddress({
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
              address: data[0].display_name,
            });
          }
        } else {
          setError(
            "No location found for this address. Please try a different search."
          );
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        setError(
          "Failed to locate address. Please try again or be more specific."
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Function to render each suggestion item
    const renderSuggestionItem = ({ item }) => {
      // Split the formatted address to create a more readable display
      // OpenStreetMap addresses are very detailed but often too long
      const parts = item.formattedAddress.split(", ");
      const mainPart = parts.slice(0, 2).join(" ") + ", " + parts[2];
      const secondaryPart = parts.slice(3).join(", ");
      return (
        <TouchableOpacity
          className="p-3 border-b border-gray-700"
          onPress={() => handleSelectAddress(item)}
        >
          <Text className="text-white font-medium">{mainPart}</Text>
          {secondaryPart && (
            <Text className="text-gray-400 text-xs">{secondaryPart}</Text>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View className={`w-full ${containerStyle || ""}`}>
        {label && <Text className="text-white font-bold mb-2">{label}</Text>}

        <TextInput
          ref={ref}
          className={`border border-white rounded p-2.5 mb-2 text-white ${
            inputStyle || ""
          }`}
          placeholder={placeholder}
          placeholderTextColor="gray"
          value={value}
          onChangeText={onChangeText}
          {...textInputProps}
        />

        {error ? (
          <Text className={`text-red-500 mb-2 ${errorStyle || ""}`}>
            {error}
          </Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" className="my-2" />
        ) : null}

        {suggestions.length > 0 && (
          <View
            className={`border border-gray-600 rounded mb-4 max-h-48 ${
              listContainerStyle || ""
            }`}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestionItem}
            />
          </View>
        )}
      </View>
    );
  }
);

export default AddressLookup;
