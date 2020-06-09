import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import ForecastMap from './ForecastMap';
import db from '../db';
import { Location } from '../models/location';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  mapContainer: {
    flexGrow: 1
  }
}));

export default function ForecastMapPage() {
  const classes = useStyles();
  const [locations, setLocations] = React.useState<Location[]>([]);

  const load = async () => {
    var homeSnapshot = await db.collection('forecastGroups').doc('home').get();
    var home:any = homeSnapshot.data();
    var locationsRaw:any = home.locations; // Map (key-value pair), where key is friendly name like Washington Pass, and value is string like "OTX,46,149"
    var locations:Location[] = [];
    for (var locationName in locationsRaw) {
      var location = new Location(locationName, locationsRaw[locationName]);
      locations.push(location);
      var existing = await db.collection('forecasts').doc(location.pointId).get();
      if (existing.exists && existing.data()!.updated >= new Date()) {

      } else {
        loadLocation(location);
      }
    }
    setLocations(locations);
  }

  const loadLocation = async (location:Location) => {

  }

  useEffect(() => {
    load();
  }, []);
  
  return (
    <div className={classes.root}>
      <h1>Day slider</h1>
      <div className={classes.mapContainer}>
        <ForecastMap currentDay={new Date()} locations={locations}/>
      </div>
    </div>
  );
}