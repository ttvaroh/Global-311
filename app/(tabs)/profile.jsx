import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";

import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getUserPosts, signOut, mapService } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { EmptyState, InfoBox } from "../../components";
import { useEffect, useState } from "react";

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts } = useAppwrite(() => getUserPosts(user.$id));
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  const fetchUserPins = async () => {
    try {
      setLoading(true);

      const allPins = await mapService.getAllPins();
      console.log("Total pins fetched:", allPins.length);

      // Create debug info to help us understand the data structure
      const debugData = {
        userId: user.$id,
        totalPins: allPins.length,
        pinFields: allPins.length > 0 ? Object.keys(allPins[0]) : [],
        samplePin: allPins.length > 0 ? allPins[0] : null,
      };

      console.log("Debug data:", JSON.stringify(debugData, null, 2));
      setDebugInfo(debugData);

      // For now, show all pins so we can see what's available
      setPins(allPins);
      return allPins;
    } catch (error) {
      console.error("Error fetching pins:", error);
      Alert.alert("Error", "Failed to load pins: " + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPins();
  }, []);

  const navigateToMap = () => {
    router.push("/map-test");
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace("/sign-in");
  };

  const showDebugInfo = () => {
    const message = JSON.stringify(debugInfo, null, 2);
    console.log("Debug Info:", message);
    Alert.alert(
      "Debug Info",
      `User ID: ${user.$id}\nTotal Pins: ${
        debugInfo.totalPins
      }\nPin Fields: ${debugInfo.pinFields?.join(", ")}`
    );
  };

  const PinCard = ({ pin }) => (
    <TouchableOpacity
      className="bg-secondary rounded-lg p-4 mb-4 mx-2"
      onPress={() => {
        router.push({
          pathname: "/map-test",
          params: { pinId: pin.$id },
        });
      }}
    >
      <Text className="text-white font-bold text-lg mb-2">
        {pin.title || "Unnamed Pin"}
      </Text>
      <Text className="text-white mb-3">
        {pin.description || "No description"}
      </Text>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white text-sm opacity-80">
            Lat: {pin.latitude?.toFixed(4) || "N/A"}
          </Text>
          <Text className="text-white text-sm opacity-80">
            Long: {pin.longitude?.toFixed(4) || "N/A"}
          </Text>
        </View>
        <View>
          <Text className="text-white text-sm opacity-80">
            Approvals: {pin.approvals?.length || 0}
          </Text>
          {/* Display who created this pin - helpful for debugging */}
          {pin.userId && (
            <Text className="text-white text-sm opacity-80">
              User: {pin.userId}
            </Text>
          )}
          {pin.creator && (
            <Text className="text-white text-sm opacity-80">
              Creator: {pin.creator}
            </Text>
          )}
          {pin.createdBy && (
            <Text className="text-white text-sm opacity-80">
              By: {pin.createdBy}
            </Text>
          )}
        </View>
      </View>
      {/* Add a button to check if this pin belongs to current user */}
      <TouchableOpacity
        className="mt-2 bg-primary p-2 rounded"
        onPress={() => {
          const isCurrentUser =
            pin.userId === user.$id ||
            pin.creator === user.$id ||
            pin.createdBy === user.$id;
          Alert.alert(
            "Pin Details",
            `ID: ${pin.$id}\nIs yours: ${
              isCurrentUser ? "Yes" : "No"
            }\nYour ID: ${user.$id}`
          );
        }}
      >
        <Text className="text-white text-center">Check Ownership</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-row justify-between items-center px-4 py-2 bg-secondary">
        <Text className="text-white font-bold">Debug Mode</Text>
        <TouchableOpacity
          className="bg-primary px-3 py-1 rounded"
          onPress={showDebugInfo}
        >
          <Text className="text-white">Show Pin Data</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pins}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => <PinCard pin={item} />}
        refreshing={loading}
        onRefresh={fetchUserPins}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Pins Found"
            subtitle="No pins found in the database"
          />
        )}
        ListHeaderComponent={() => (
          <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
              onPress={logout}
              className="flex w-full items-end mb-10"
            >
              <Image
                source={icons.logout}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <View className="w-16 h-16 border border-secondary rounded-lg flex justify-center items-center">
              <Image
                source={{ uri: user?.avatar }}
                className="w-[90%] h-[90%] rounded-lg"
                resizeMode="cover"
              />
            </View>
            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />
            <View className="mt-5 flex flex-row">
              <InfoBox
                title={pins.length || 0}
                subtitle="Pins"
                titleStyles="text-xl"
                containerStyles="mr-10"
              />
              <InfoBox
                title="120k"
                subtitle="Followers"
                titleStyles="text-xl"
              />
            </View>

            {/* Map navigation button */}
            <TouchableOpacity
              onPress={navigateToMap}
              className="mt-6 bg-secondary px-8 py-3 rounded-lg"
            >
              <Text className="text-white font-bold">Back to Map</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Profile;
