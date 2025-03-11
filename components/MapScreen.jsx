import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import Mapbox, { MapView } from "@rnmapbox/maps";

Mapbox.setAccessToken(
  "sk.eyJ1IjoidHR2YXJvaDI1NjcyOCIsImEiOiJjbTg0bHZjNnEwZzhkMnFwZ2lyMDV2aWwzIn0.gG0PIHSLPJIlfxOQXGg1Aw"
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  container: {
    height: 300,
    width: 300,
    backgroundColor: "tomato",
  },
  map: {
    flex: 1,
  },
});

const MapScreen = () => {
  // componentDidMount() {
  //     Mapbox.setTelemetryEnabled(false);
  // }
  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <MapView style={styles.map} />
      </View>
    </View>
  );
};

export default MapScreen;
