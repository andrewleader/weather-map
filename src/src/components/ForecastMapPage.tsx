import React, { useEffect } from 'react';
import { makeStyles, Typography, Slider, Tooltip } from '@material-ui/core';
import ForecastMap from './ForecastMap';
import db from '../db';
import { Location } from '../models/location';
import { ForecastData } from '../models/forecasts';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Api from '../api/api';
import PointInfo from '../models/pointInfo';

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
  const [addLocationLatLng, setAddLocationLatLng] = React.useState<undefined | {lat:Number,lng:number}>();
  const addLocationOpen = addLocationLatLng !== undefined;
  const [addingLocation, setAddingLocation] = React.useState(false);
  const [newLocationName, setNewLocationName] = React.useState("");

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
      updated: Date.now() / 1000
    }, { merge: true });
  }

  useEffect(() => {
    load();
  }, []);

  const getDayOfWeek = (relativeDay:number) => {
    if (relativeDay === 0) {
      return "Today";
    } else if (relativeDay === 1) {
      return "Tomorrow";
    } else {
      var date = new Date();
      date.setDate(date.getDate() + relativeDay);
      switch (date.getDay()) {
        case 0:
          return "Sunday";
        case 1:
          return "Monday";
        case 2:
          return "Tuesday";
        case 3:
          return "Wednesday";
        case 4:
          return "Thursday";
        case 5:
          return "Friday";
        default:
          return "Saturday";
      }
    }
  }

  function ValueLabelComponent(props:{
    children: any,
    open?: boolean,
    value: number
  }) {
    const { children, open, value } = props;
  
    return (
      <Tooltip open={open} enterTouchDelay={0} placement="top" title={getDayOfWeek(value)}>
        {children}
      </Tooltip>
    );
  }

  const onRequestAddLocation = (latLng:{lat:number, lng:number}) => {
    setAddLocationLatLng(latLng);
  }

  const handleCloseAddLocation = () => {
    setAddLocationLatLng(undefined);
  }

  const handleCommitAddLocation = async () => {
    if (newLocationName.trim().length === 0) {
      alert("You must enter a name!");
      return;
    }

    setAddingLocation(true);

    try {
      var pointInfo = await Api.get("/points/" + addLocationLatLng!.lat + "," + addLocationLatLng!.lng) as PointInfo;
      var homeSnapshot = await db.collection('forecastGroups').doc('home').get();
      var locations:any = homeSnapshot!.data()!.locations;
      if (locations[newLocationName]) {
        alert("That name is already being used");
        return;
      }
      locations[newLocationName] = `${pointInfo.cwa},${pointInfo.gridX},${pointInfo.gridY},${addLocationLatLng!.lat},${addLocationLatLng!.lng}`;
      await homeSnapshot.ref.update({
        locations
      });
      window.location.reload();
    } catch (e) {
      alert(e);
    } finally {
      setAddingLocation(false);
    }
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.dayContainer}>
        <Typography>
          {getDayOfWeek(day)}
        </Typography>
        <Slider
          value={day}
          onChange={(e, newVal) => setDay(newVal as number)}
          ValueLabelComponent={ValueLabelComponent}
          step={1}
          marks
          min={0}
          max={6}/>
      </div>
      <div className={classes.mapContainer}>
        <ForecastMap currentDay={new Date()} locations={locations} day={day} onRequestAddLocation={onRequestAddLocation}/>
      </div>
      <Dialog open={addLocationOpen} onClose={handleCloseAddLocation} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {addLocationLatLng?.lat}, {addLocationLatLng?.lng}. Note that this adds the location for EVERYONE. Give the location a name.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddLocation} color="primary" disabled={addingLocation}>
            Cancel
          </Button>
          <Button onClick={handleCommitAddLocation} color="primary" disabled={addingLocation}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}