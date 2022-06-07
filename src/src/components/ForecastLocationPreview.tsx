import React from 'react';
import { Location } from '../models/location';
import { observer } from 'mobx-react';

const ForecastLocationPreview = observer((props:{
  location: Location,
  day: number
}) => {

  var url = `https://forecast.weather.gov/MapClick.php?lon=${props.location.position.lng}&lat=${props.location.position.lat}`;

  if (props.location.forecastData == null) {
    return (
      <a href={url}>Failed to load</a>
    );
  }

  var forecastDay = props.location.forecastData!.days[props.day];
  var overallRating = forecastDay.getOverallRating(); // Value from 0-1, with 1 being best
  console.log("Overall: " + overallRating);

  var colorG = 255;
  var colorR = 0;

  if (overallRating < 1) {
    if (overallRating >= 0.5) {
      // We'll increase the red color... red should be full 255 when at 0.5
      var multiplier = (0.5 - (overallRating - 0.5)) * 2; // When 1, this becomes 0. When 0.5, this becomes 1
      colorR = 255 * multiplier;
    } else {
      // We start decreasing green
      colorR = 255;
      var multiplier = overallRating * 2;
      colorG = 255 * multiplier;
    }
  }

  return (
    <div style={{backgroundColor: `rgb(${colorR},${colorG},0)`}}>
      <a href={url}><img src={forecastDay.icon} width="80" height="80"/></a>
      <p>{forecastDay.getSummaryString()}</p>
    </div>
  );
});

export default ForecastLocationPreview;