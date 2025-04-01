import useAppwrite from "../../lib/useAppwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
// In your component
const handleAddressSearch = async () => {
  const { user, setUser } = useGlobalContext();
  address ={user?.username}
  

  const getCoordinatesFromAddress = async (searchAddress) => {
    if (!searchAddress?.trim()) {
      Alert.alert("Error", "Please enter an address");
      return null;
    }

    setLoading(true);

    try {
      const encodedAddress = encodeURIComponent(searchAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'ReactNativeApp/1.0'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        return { 
          latitude: parseFloat(data[0].lat), 
          longitude: parseFloat(data[0].lon),
          title: data[0].display_name.split(',')[0],
          description: data[0].display_name
        };
      }
      
      Alert.alert("Location not found", "Could not find this address");
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      Alert.alert("Error", "Something went wrong with the address lookup");
      return null;
    } finally {
      setLoading(false);
    }
  };
  coordinates = await getCoordinatesFromAddress(address);
  if (coordinates) {
    console.log(`Found location at: ${coordinates.latitude}, ${coordinates.longitude}`);
    
    // Use coordinates to update your map
    mapRef.current?.animateToRegion({
      ...coordinates,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }, 1000);
  } else {
    // Handle the error case
    Alert.alert("Error", "Could not find this location");
  }

};