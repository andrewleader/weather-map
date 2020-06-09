import React, { useEffect } from 'react';
import { makeStyles, Typography, Slider } from '@material-ui/core';
import ForecastMap from './ForecastMap';
import db from '../db';
import { Location } from '../models/location';
import { ForecastData } from '../models/forecasts';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  dayContainer: {
    margin: theme.spacing(2)
  },
  mapContainer: {
    flexGrow: 1
  }
}));

export default function ForecastMapPage() {
  const classes = useStyles();
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [day, setDay] = React.useState(0);

  const load = async () => {
    var homeSnapshot = await db.collection('forecastGroups').doc('home').get();
    var home:any = homeSnapshot.data();
    var locationsRaw:any = home.locations; // Map (key-value pair), where key is friendly name like Washington Pass, and value is string like "OTX,46,149"
    var locations:Location[] = [];
    for (var locationName in locationsRaw) {
      var location = new Location(locationName, locationsRaw[locationName]);
      locations.push(location);
      var existing = await db.collection('forecasts').doc(location.pointId).get();
      var nowInSeconds = Date.now() / 1000;
      if (existing.exists && existing.data()!.updated >= (nowInSeconds - 60 * 40)) {
        location.forecastData = ForecastData.getFromData(JSON.parse(existing.data()!.data));
        console.log("cached");
      } else {
        await loadLocation(location);
      }
    }
    setLocations(locations);
  }

  const loadLocation = async (location:Location) => {
    var forecastData = await ForecastData.getAsync(location.pointInfo);
    location.forecastData = forecastData;

    db.collection('forecasts').doc(location.pointId).set({
      data: JSON.stringify(forecastData.rawData),
      updated: Date.now()
    }, { merge: true });
  }

  useEffect(() => {
    load();
  }, []);
  
  return (
    <div className={classes.root}>
      <div className={classes.dayContainer}>
        <Typography>
          Day {day}
        </Typography>
        <Slider
          value={day}
          onChange={(e, newVal) => setDay(newVal as number)}
          valueLabelDisplay="auto"
          step={1}
          marks
          min={0}
          max={6}/>
      </div>
      <div className={classes.mapContainer}>
        <ForecastMap currentDay={new Date()} locations={locations} day={day}/>
      </div>
    </div>
  );
}