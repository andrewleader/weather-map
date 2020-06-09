import PointInfo from "../models/pointInfo";

export interface GridpointForecastPeriod {
  number: number; // Starting with 1
  name: string; // Like "Today", "Tonight", or "Sunday Night"
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  windSpeed: string; // Like "10 mph"
  windDirection: string; // Like "WSW"
  icon: string; // Like https://api.weather.gov/icons/land/day/snow,100?size=medium
  shortForecast: string; // Like "Rain and Snow" or "Rain and Snow Likely" or "Heavy Snow"
  detailedForecast: string; // Like "Rain and snow. Cloudy. High near 35, with temperatures falling to around 33 in the afternoon. West southwest wind around 10 mph. Chance of precipitation is 100%. New snow accumulation of 1 to 3 inches possible."
}

interface GridpointForecastProperties {
  periods: GridpointForecastPeriod[];
}

export default class Api {
  static async get(path:string) {
    const fullUrl = "https://api.weather.gov" + path;

    const resp = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/geo+json',
        'User-Agent': 'followthatleader@outlook.com'
      }
    });

    if (resp.ok) {
      return (await resp.json()).properties;
    }

    throw new Error(resp.statusText);
  }

  static async getForecastAsync(pointInfo: PointInfo) {
    return await Api.get(`/gridpoints/${pointInfo.cwa}/${pointInfo.gridX},${pointInfo.gridY}/forecast`) as GridpointForecastProperties;
  }
}