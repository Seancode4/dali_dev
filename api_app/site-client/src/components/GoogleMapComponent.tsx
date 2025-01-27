import React from "react";
import { useEffect, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "600px",
};

export class Location {
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  key: string;

  distance: number; // miles
  city: string;
  state: string;
  category: string;
  description: string;
  reviewScore: number;
  reviewCount: number;

  constructor(
    name: string,
    position: { lat: number; lng: number },
    key: string,
    distance: number, // miles
    city: string,
    state: string,
    category: string,
    description: string,
    reviewScore: number,
    reviewCount: number
  ) {
    this.name = name;
    this.position = position;
    this.key = key;

    this.distance = distance;

    this.city = city;
    this.state = state;
    this.category = category;
    this.description = description;
    this.reviewScore = reviewScore;
    this.reviewCount = reviewCount;
  }
}

interface Props {
  markers: Location[];
  center: { lat: number; lng: number };
  route?: { lat: number; lng: number }[];
  zoom: number;
}

const MarkerComponent = ({ markers }: { markers: Location[] }) => {
  const [selectedMarker, setSelectedMarker] = useState<Location | null>(null);

  if (markers[0]) {
    return (
      <div>
        {markers.map((marker, index) => (
          <Marker
            key={index}
            title={marker.name}
            position={marker.position}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}
        {/*
  NAME, Category
  City, State/Country
  5#, 200 reviews
  Distance from route
  Concatenated Description
 (save lat long)
  */}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)} // Close InfoWindow
          >
            <div className="card" cssstyle="width: 18rem;">
              <div className="card-body">
                <h5 className="card-title">{selectedMarker.name}</h5>
                <h6 className="card-subtitle mb-2 text-body-secondary">
                  {selectedMarker.reviewScore} ★
                </h6>
                <h6 className="card-subtitle mb-2 text-body-secondary"></h6>
                <p className="card-text">
                  {selectedMarker.category}. {selectedMarker.description}
                </p>
                {/* <a href="#" className="card-link">
                  Get more info
                </a> */}
                {/* <a href="#" className="card-link">
                  Another link
                </a> */}
              </div>
            </div>
          </InfoWindow>
        )}
      </div>
    );
  }
};

const RouteComponent = (route?: { lat: number; lng: number }[]) => {
  if (route) {
    return (
      <Polyline
        path={route}
        options={{ strokeColor: "#FF0000", strokeWeight: 4 }}
      />
    );
  }
};

function GoogleMapComponent({ markers, center, route, zoom }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyD2UPNqOS_alKzCf8Yp35ka7TBS_vQxgkQ",
  });

  const [map, setMap] = React.useState(null);

  useEffect(() => {
    console.log("Markers updated:", markers);
  }, [markers]); // Logs whenever markers update

  const onLoad = React.useCallback(function callback(map) {
    console.log("new load");
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <MarkerComponent markers={markers} />
      {RouteComponent(route)}
      <></>
    </GoogleMap>
  ) : (
    <></>
  );
}

export default React.memo(GoogleMapComponent);

/*
import React, { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = { lat: 37.7749, lng: -122.4194 }; // Default center (San Francisco, for example)

interface Location {
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  key: string;
}

interface Props {
  markers: [Location];
  //   setSelectedMarker: (id: number) => void;
}

const GoogleMapComponent = ({ markers }: Props) => {
  const onLoad = useCallback((map) => {
    console.log("Map Loaded:", map);
  }, []);

  return (
    <LoadScript googleMapsApiKey="AIzaSyD2UPNqOS_alKzCf8Yp35ka7TBS_vQxgkQ">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        {markers.map((marker, index) => (
          <Marker
            key={index}
            title={marker.name}
            position={marker.position}
            onClick={() => console.log(index)} // Pass the marker id or any unique identifier
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;

*/
