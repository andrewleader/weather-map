import { observable } from "mobx"
import { Location } from '../models/location';
import db from "../db";
import { ForecastData } from "./forecasts";
import Api from "../api/api";
import PointInfo from '../models/pointInfo';

export default class ForecastMapPageState {
  private static _current?:ForecastMapPageState;
  static get current() {
    if (this._current === undefined) {
      this._current = new ForecastMapPageState();
    }
    return this._current;
  }

  @observable day = 0;
  @observable locations:Location[] = [];
  @observable addLocationLatLng?:{lat:Number,lng:number};
  @observable addingLocation = false;
  @observable newLocationName = "";

  private _requestedLoad = false;
  async load() {
    if (this._requestedLoad) {
      return;
    }
    this._requestedLoad = true;

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
        await this.loadLocation(location);
      }
    }
    this.locations = locations;
    console.log("Locations: " + locations.length);
  }

  private async loadLocation(location:Location) {
    var forecastData = await ForecastData.getAsync(location.pointInfo);
    location.forecastData = forecastData;

    db.collection('forecasts').doc(location.pointId).set({
      data: JSON.stringify(forecastData.rawData),
      updated: Date.now() / 1000
    }, { merge: true });
  }

  closeAddLocation() {
    this.addLocationLatLng = undefined;
  }

  requestAddLocation(latLng:{lat:number,lng:number}) {
    this.addLocationLatLng = latLng;
  }

  async completeAddLocation() {
    if (this.newLocationName.trim().length === 0) {
      alert("You must enter a name!");
      return;
    }

    this.addingLocation = true;

    try {
      var pointInfo = await Api.get("/points/" + this.addLocationLatLng!.lat + "," + this.addLocationLatLng!.lng) as PointInfo;
      var homeSnapshot = await db.collection('forecastGroups').doc('home').get();
      var locations:any = homeSnapshot!.data()!.locations;
      if (locations[this.newLocationName]) {
        alert("That name is already being used");
        return;
      }
      locations[this.newLocationName] = `${pointInfo.cwa},${pointInfo.gridX},${pointInfo.gridY},${this.addLocationLatLng!.lat},${this.addLocationLatLng!.lng}`;
      await homeSnapshot.ref.update({
        locations
      });
      window.location.reload();
    } catch (e) {
      alert(e);
    } finally {
      this.addingLocation = false;
    }
  }

  setDay(day: number) {
    this.day = day;
  }
}