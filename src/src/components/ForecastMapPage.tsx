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
import { observer } from "mobx-react";
import ForecastMapPageState from "../models/forecastMapPageState";

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

const ForecastMapPage = observer(() => {
  const classes = useStyles();
  const state = ForecastMapPageState.current;

  useEffect(() => {
    state.load();
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

  const handleCloseAddLocation = () => {
    state.closeAddLocation();
  }

  const handleCommitAddLocation = () => {
    state.completeAddLocation();
  }

  const addLocationOpen = state.addLocationLatLng !== undefined;
  
  return (
    <div className={classes.root}>
      <div className={classes.dayContainer}>
        <Typography>
          {getDayOfWeek(state.day)}
        </Typography>
        <Slider
          value={state.day}
          onChange={(e, newVal) => state.setDay(newVal as number)}
          ValueLabelComponent={ValueLabelComponent}
          step={1}
          marks
          min={0}
          max={6}/>
      </div>
      <div className={classes.mapContainer}>
        <ForecastMap forecastMapPageState={state}/>
      </div>
      <Dialog open={addLocationOpen} onClose={handleCloseAddLocation} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {state.addLocationLatLng?.lat}, {state.addLocationLatLng?.lng}. Note that this adds the location for EVERYONE. Give the location a name. {state.newLocationName}.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            value={state.newLocationName}
            onChange={(e) => state.newLocationName = e.target.value}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddLocation} color="primary" disabled={state.addingLocation}>
            Cancel
          </Button>
          <Button onClick={handleCommitAddLocation} color="primary" disabled={state.addingLocation}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default ForecastMapPage;