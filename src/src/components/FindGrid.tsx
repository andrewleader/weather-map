import React from 'react';
import PointInfo from '../models/pointInfo';
import TextField from '@material-ui/core/TextField';
import { Button } from '@material-ui/core';
import Api from '../api/api';

const FindGrid = () => {
  const [latLng, setLatLng] = React.useState<string>("47.428,-121.416");
  const [pointInfo, setPointInfo] = React.useState<PointInfo | undefined>(undefined);
  const [loadingPointInfo, setLoadingPointInfo] = React.useState<boolean>(false);

  const handleFindClicked = async () => {
    setPointInfo(undefined);
    setLoadingPointInfo(true);

    try {
      const newPointInfo = await Api.get("/points/" + latLng) as PointInfo;
      setPointInfo(newPointInfo);
    } catch {}

    setLoadingPointInfo(false);
  }

  return (
    <div style={{padding: "24px"}}>
      <TextField
        id="latLng"
        label="Latitude, Longitude"
        value={latLng}
        onChange={event => setLatLng(event.target.value)}/>
      <Button
        variant="contained"
        color="primary"
        onClick={handleFindClicked}
        disabled={loadingPointInfo}>
        Find
      </Button>

      {loadingPointInfo && (
        <p>Loading...</p>
      )}

      {pointInfo && (
        <>
          <h5>Point info</h5>
          <p><strong>CWA: </strong>{pointInfo.cwa}</p>
          <p><strong>gridX: </strong>{pointInfo.gridX}</p>
          <p><strong>gridY: </strong>{pointInfo.gridY}</p>
        </>
      )}
    </div>
  );

}

export default FindGrid;