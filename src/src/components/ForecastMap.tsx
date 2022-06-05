import React, { Component } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Location } from '../models/location';
import ForecastLocationPreview from './ForecastLocationPreview';
import ForecastMapPageState from '../models/forecastMapPageState';
import { observer } from 'mobx-react';

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

const ForecastMap = observer((props:{
  forecastMapPageState: ForecastMapPageState
}) => {
  const state = props.forecastMapPageState;
  const [map, setMap] = React.useState(null);
  const [google, setGoogle] = React.useState<any>(undefined);
 
  const onLoad = React.useCallback(function callback(map) {
    if (map.getBounds() === null || map.getBounds() === undefined) {
      var windowAny = window as any;
      setGoogle(windowAny.google);
      const bounds = new windowAny.google.maps.LatLngBounds(
        { lat: 49.1938, lng: -125.5518 },
        { lat: 45.9627, lng: -116.9385 }
      );
      console.log("Map onLoad");
      map.fitBounds(bounds);
      setMap(map)
      map.addListener('rightclick', onMapRightClick);
    }
  }, [])
 
  const onUnmount = React.useCallback(function callback(map) {
    setMap(null)
  }, []);

  const onMapRightClick = (event:any) => {
    var lat:number = event.latLng.lat();
    var lng:number = event.latLng.lng();
    state.requestAddLocation({
      lat: lat,
      lng
    });
  }

  const MapContents = observer(() => {
    if (google === undefined) {
      return null;
    }

    // https://developers.google.com/maps/documentation/javascript/reference/marker#Symbol

    return (
      <>
        {state.locations.map(location => (
          <Marker position={location.position}>
            <InfoWindow position={location.position}>
              <ForecastLocationPreview location={location} day={state.day}/>
            </InfoWindow>
          </Marker>
        ))}
      </>
    )
  });

  // Maps library docs: https://react-google-maps-api-docs.netlify.app/
  return (
    <LoadScript id="blah"
      googleMapsApiKey="AIzaSyCWGA_FdGTGxx0uH5rbJLXaEHOcJ93otA0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}>
        <MapContents/>
      </GoogleMap>
    </LoadScript>
  )
});

export default ForecastMap;