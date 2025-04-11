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

      // Get all pins from the service
      const allPins = await mapService.getAllPins();
      console.log("Total pins fetched:", allPins.length);

      // The probable field that contains user ID information
      // Based on your initial code, these are the fields we should check
      const ownerFields = ["userId"];
      console.log("User in profile screen:", JSON.stringify(user, null, 2));

      // Function to check if a pin belongs to the current user
      const isPinFromCurrentUser = (pin) => {
        const currentUserId = String(user.$id);

        // Log the actual values for debugging
        console.log("Comparing:", {
          pin: pin.$id,
          pinUserId: pin.userId,
          currentUserId: currentUserId,
        });

        // Try multiple formats of the user ID
        const possibleUserIds = [
          String(user.$id),
          String(user.id),
          String(user._id),
          user.$id,
          user.id,
          user._id,
        ].filter(Boolean); // Filter out undefined values

        // Check each potential ownership field with each potential ID format
        for (const field of ownerFields) {
          if (pin[field]) {
            for (const possibleId of possibleUserIds) {
              if (String(pin[field]) === String(possibleId)) {
                console.log(`Match found! Field: ${field}, ID: ${possibleId}`);
                return true;
              }
            }
          }
        }

        return false;
      };

      // Filter pins to only include those belonging to the current user
      const userPins = allPins.filter((pin) => {
        console.log("Comparing pin:", {
          pinId: pin.$id,
          pinUserId: pin.userId,
          currentUserId: user.$id,
          matches: String(pin.userId) === String(user.$id),
        });
        return isPinFromCurrentUser(pin);
      });

      console.log(
        `Filtered ${allPins.length} pins to ${userPins.length} user pins`
      );

      // If we found no pins, log more info for debugging
      if (userPins.length === 0 && allPins.length > 0) {
        console.log(
          "DEBUGGING: No user pins found. Checking pin ownership fields:"
        );
        allPins.forEach((pin, index) => {
          if (index < 5) {
            // Just log first 5 pins to avoid console spam
            console.log(`Pin ID: ${pin.$id}`);
            ownerFields.forEach((field) => {
              console.log(`  ${field}: ${pin[field] || "not set"}`);
            });
            console.log(`  Current user ID: ${user.$id}`);
          }
        });
      }

      // Set pins state to only the user's pins
      setPins(userPins);

      // Store debug info for troubleshooting
      setDebugInfo({
        userId: user.$id,
        totalPins: allPins.length,
        userPins: userPins.length,
      });

      return userPins;
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
    Alert.alert(
      "Debug Info",
      `User ID: ${user.$id}\nTotal Pins in System: ${debugInfo.totalPins}\nYour Pins: ${debugInfo.userPins}\n\nIf your pins aren't showing correctly, check the console logs for detailed information.`
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
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-row justify-between items-center px-4 py-2 bg-secondary">
        <Text className="text-white font-bold">My Pins ({pins.length})</Text>
        <TouchableOpacity
          className="bg-primary px-3 py-1 rounded"
          onPress={showDebugInfo}
        >
          <Text className="text-white">Debug</Text>
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
            subtitle="Create some pins on the map to see them here"
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
