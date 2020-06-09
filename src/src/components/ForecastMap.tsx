import React, { Component } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Location } from '../models/location';

const containerStyle = {
  width: '100%',
  height: '100%'
};
 
// Not sure center (or zoom) is used... bounds seem to be used on the onLoad
const initialCenter = {
  lat: 47.3014638,
  lng: -120.9950614
};

const initialZoom = 8.56;

export default function ForecastMap(props:{
  currentDay: Date,
  locations: Location[]
}) {
  const [map, setMap] = React.useState(null)
 
  const onLoad = React.useCallback(function callback(map) {
    var windowAny = window as any;
    const bounds = new windowAny.google.maps.LatLngBounds(
      { lat: 49.1938, lng: -125.5518 },
      { lat: 45.9627, lng: -116.9385 }
    );
    map.fitBounds(bounds);
    setMap(map)
  }, [])
 
  const onUnmount = React.useCallback(function callback(map) {
    setMap(null)
  }, [])

  return (
    <LoadScript id="blah"
      googleMapsApiKey="AIzaSyCWGA_FdGTGxx0uH5rbJLXaEHOcJ93otA0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}>
        {props.locations.map(location => (
          <Marker key={location.name} position={location.position} label={location.name}/>
        ))}
        {/* <Marker position={{lat:48, lng:-120}} label="Home"/> */}
      </GoogleMap>
    </LoadScript>
  )
}