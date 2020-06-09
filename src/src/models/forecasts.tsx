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
  precipPercent: number; // Number from 0-100

  constructor(day: ForecastPeriod | undefined, night: ForecastPeriod, prevForecastFullDay?: ForecastFullDay) {
    this.day = day;
    this.night = night;
    this.prev = prevForecastFullDay;

    if (day) {
      this.icon = day.source.icon;
      this.afternoonTemp = day.source.temperature;
      this.windSpeed = day.source.windSpeed;
      this.precipPercent = this.parsePrecipPercent(day);
    } else {
      this.icon = night.source.icon;
      this.windSpeed = night.source.windSpeed;
      this.precipPercent = this.parsePrecipPercent(night);
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

  private parsePrecipPercent(forecastPeriod: ForecastPeriod) {
    // API doesn't return percents, but the image URL contains the percip percents
    var myReg = /,\d\d\d?/g;
    var matches = forecastPeriod.source.icon.match(myReg);
    if (matches) {
      var max = 0;
      matches.forEach(m => {
        var trimmed = m.substr(1);
        var percent = parseInt(trimmed);
        if (percent > max) {
          max = percent;
        }
      });
      return max;
    } else {
      // Sometimes for longer-range forecast they don't include the chance
      if (forecastPeriod.source.icon.indexOf("showers") !== -1) {
        return 50;
      }
      return 0;
    }
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

  getTempRating() {
    if (this.afternoonTemp) {

      // Anything within 60-70 is perfect
      if (this.afternoonTemp >= 60 && this.afternoonTemp <= 75) {
        return 1;
      }

      if (this.afternoonTemp > 70) {
        // Anything higher than 90 gets a score of 0
        return this.getTempRatingRelativeTo(this.afternoonTemp, 75, 90);
      } else {
        // Anything lower than 40 gets a score of 0
        return this.getTempRatingRelativeTo(this.afternoonTemp, 60, 40);
      }
    } else {
      return 1;
    }
  }

  getPrecipRating() {
    return 1 - this.precipPercent / 100;
  }

  getOverallRating() {
    return this.getTempRating() * this.getPrecipRating();
  }

  private getTempRatingRelativeTo(forecastedTemp: number, tempAtOneRating: number, tempAtZeroRating: number) {
    // For example, 70 degrees gets a 1, 90 degrees gets a 0... it's 85 degrees, that should become 0.25 (so 90 - 85 = 5, and then 5/20 = 0.25).
    // And on the other end, 60 gets a 1, 40 gets a 0... it's 45 degrees, so 40-45 = 5, and then 5/20, so 0.25
    var diff = Math.abs(tempAtZeroRating - forecastedTemp);
    var fraction = diff / Math.abs(tempAtZeroRating - tempAtOneRating);
    if (fraction > 1) {
      return 1;
    } else if (fraction < 0) {
      return 0;
    } else {
      return fraction;
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