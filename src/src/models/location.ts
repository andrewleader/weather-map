import PointInfo from "./pointInfo";

export class Location {
  name: string;
  pointInfo: PointInfo;
  pointId: string;
  position: {lat:number, lng:number};

  constructor(name: string, pointInfoStr: string) {
    this.name = name;
    var split = pointInfoStr.split(',');
    this.pointInfo = {
      cwa: split[0],
      gridX: parseInt(split[1]),
      gridY: parseInt(split[2])
    };

    this.pointId = this.pointInfo.cwa + ',' + this.pointInfo.gridX + ',' + this.pointInfo.gridY;

    this.position = {
      lat: parseFloat(split[3]),
      lng: parseFloat(split[4])
    };
  }
}