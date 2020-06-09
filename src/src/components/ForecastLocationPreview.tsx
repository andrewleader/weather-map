import React from 'react';
import { Location } from '../models/location';

export default function ForecastLocationPreview(props:{
  location: Location,
  day: number
}) {

  var forecastDay = props.location.forecastData!.days[props.day];

  return (
    <div>
      <img src={forecastDay.icon} width="80" height="80"/>
      <p>{forecastDay.getSummaryString()}</p>
    </div>
  );
}