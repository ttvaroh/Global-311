import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

const MapScreen = () => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: 37.78825,
            longitude: -122.4324,
          }}
          title="Pin Title"
          description="Pin Description"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MapScreen;

// import React, { Component } from "react";
// import { StyleSheet, View } from "react-native";
// import Mapbox, { MapView } from "@rnmapbox/maps";

// Mapbox.setAccessToken(
//   "sk.eyJ1IjoidHR2YXJvaDI1NjcyOCIsImEiOiJjbTg0bHZjNnEwZzhkMnFwZ2lyMDV2aWwzIn0.gG0PIHSLPJIlfxOQXGg1Aw"
// );

// const styles = StyleSheet.create({
//   page: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F5FCFF",
//   },
//   container: {
//     height: 300,
//     width: 300,
//     backgroundColor: "tomato",
//   },
//   map: {
//     flex: 1,
//   },
// });

// const MapScreen = () => {
//   // componentDidMount() {
//   //     Mapbox.setTelemetryEnabled(false);
//   // }
//   return (
//     <View style={styles.page}>
//       <View style={styles.container}>
//         <MapView style={styles.map} />
//       </View>
//     </View>
//   );
// };

// export default MapScreen;
