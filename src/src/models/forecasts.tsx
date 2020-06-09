import Api, { GridpointForecastPeriod, GridpointForecastProperties } from "../api/api";
import PointInfo from "./pointInfo";

class SnowAccumulation {
  low: number;
  high: number;

  constructor(low: number, high: number) {
    this.low = low;
    this.high = high;
  }

  toString() {
    if (this.low == 0 && this.high == 0) {
      return `0"`;
    }
    if (this.low == this.high) {
      return `${this.low}"`;
    }
    return `${this.low}-${this.high}"`;
  }

  static combine(first:SnowAccumulation, second:SnowAccumulation) {
    return new SnowAccumulation(first.low + second.low, first.high + second.high);
  }
}

export class ForecastPeriod {
  snowAccumulation: SnowAccumulation;
  source: GridpointForecastPeriod;

  constructor(source:GridpointForecastPeriod, prevForecastPeriod?: ForecastPeriod) {
    this.source = source;

    if (source.detailedForecast.indexOf("New snow accumulation of around one inch possible") !== -1) {
      this.snowAccumulation = new SnowAccumulation(1, 1);
    } else {
      const reg = /New snow accumulation of (\d+) to (\d+)/;
      const match = reg.exec(source.detailedForecast);
      if (match) {
        this.snowAccumulation = new SnowAccumulation(parseInt(match[1]), parseInt(match[2]));
      } else {
        this.snowAccumulation = new SnowAccumulation(0, 0);
      }
    }
  }
}

export class ForecastFullDay {
  snowAccumulation: SnowAccumulation;
  name: string;
  day?: ForecastPeriod;
  night: ForecastPeriod;
  prev?: ForecastFullDay;
  overnight?: SnowAccumulation;
  oneDay?: SnowAccumulation;
  twoDays?: SnowAccumulation;
  icon: string;
  morningTemp?: number;
  afternoonTemp?: number;
  windSpeed: string;

  constructor(day: ForecastPeriod | undefined, night: ForecastPeriod, prevForecastFullDay?: ForecastFullDay) {
    this.day = day;
    this.night = night;
    this.prev = prevForecastFullDay;

    if (day) {
      this.icon = day.source.icon;
      this.afternoonTemp = day.source.temperature;
      this.windSpeed = day.source.windSpeed;
    } else {
      this.icon = night.source.icon;
      this.windSpeed = night.source.windSpeed;
    }

    if (prevForecastFullDay) {
      this.morningTemp = prevForecastFullDay.night.source.temperature;
      this.overnight = prevForecastFullDay.night.snowAccumulation;
      if (prevForecastFullDay.day) {
        this.oneDay = prevForecastFullDay.snowAccumulation;
        if (prevForecastFullDay.oneDay) {
          this.twoDays = SnowAccumulation.combine(this.oneDay, prevForecastFullDay.oneDay);
        }
      }
    }

    this.name = day ? day.source.name : night.source.name;

    const dayLow = day ? day.snowAccumulation.low : 0;
    const dayHigh = day ? day.snowAccumulation.high : 0;

    this.snowAccumulation = new SnowAccumulation(dayLow + night.snowAccumulation.low, dayHigh + night.snowAccumulation.high);
  }

  getTempString() {
    if (this.morningTemp) {
      return this.morningTemp + " - " + this.afternoonTemp;
    } else if (this.afternoonTemp) {
      return this.afternoonTemp;
    } else {
      return "";
    }
  }

  getSummaryString() {
    return this.getTempString() + ", " + this.windSpeed;
  }

  getSource() {
    return this.day?.source ?? this.night.source;
  }

  getTemperature() {
    if (this.prev) {
      return `${this.prev.night.source.temperature}°-${this.day!.source.temperature}°`;
    }
    return `${this.getSource().temperature}°`;
  }
}

export class ForecastData {
  days: ForecastFullDay[];
  rawData: GridpointForecastProperties;

  constructor(days: ForecastFullDay[], rawData: GridpointForecastProperties) {
    this.days = days;
    this.rawData = rawData;
  }

  static async getAsync(pointInfo: PointInfo) {
    const data = await Api.getForecastAsync(pointInfo);
    return this.getFromData(data);
  }

  static getFromData(rawData: GridpointForecastProperties) {
    const data = rawData 
    const periods = data.periods.map(period => new ForecastPeriod(period));
    const days: ForecastFullDay[] = [];

    let dayPeriod: ForecastPeriod | undefined;
    periods.forEach(period => {
      if (period.source.isDaytime) {
        dayPeriod = period;
      } else {
        let prev:ForecastFullDay|undefined = undefined;
        if (days.length > 0) {
          prev = days[days.length - 1];
        }
        days.push(new ForecastFullDay(dayPeriod, period, prev));
      }
    });

    return new ForecastData(days, data);
  }
}