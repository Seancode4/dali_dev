// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";

import Alert from "./components/Alert";
import GoogleMapComponent from "./components/GoogleMapComponent";
import { Location } from "./components/GoogleMapComponent";

// import ReactMap from "./components/ReactMap";
// import Button from "./components/Button";
import { useState } from "react";

function App() {
  const [center, setCenter] = useState({
    lat: 43.7037945517928,
    lng: -72.29468078803328,
  });
  const [zoom, setZoom] = useState(18);

  const [route, setRoute] = useState<
    { lat: number; lng: number }[] | undefined
  >(undefined);

  const [markers, setMarkers] = useState<Location[]>([]);

  const replaceMarkers = (newMarkers: Location[]) => {
    const finalMarkers = [];
    for (const i in newMarkers) {
      if (newMarkers[i].reviewScore > 2) {
        finalMarkers.push(newMarkers[i]);
      }
    }
    console.log("replacing markers");
    if (finalMarkers.length > 1) {
      setMarkers(finalMarkers);
    } else {
      setMarkers(newMarkers);
    }
  };

  const apiCall = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    let origin = formData.get("origin");
    let destination = formData.get("destination");

    axios
      .get("http://localhost:3000/api/route/" + origin + "/" + destination)
      .then((data) => {
        setCenter({ lat: data.data.center[0], lng: data.data.center[1] });
        const points = data.data.route;
        setRoute(points.map(([lat, lng]: [number, number]) => ({ lat, lng })));

        setZoom(8);

        replaceMarkers(data.data.locations);
      });
  };

  return (
    <div>
      <h1>Welcome!</h1>

      <GoogleMapComponent
        markers={markers}
        center={center}
        route={route}
        zoom={zoom}
      />
      <form onSubmit={apiCall}>
        <div className="form-row">
          <div className="col">
            <input
              type="text"
              className="form-control"
              name="origin"
              placeholder="Leave from..."
            />
          </div>
          <div className="col">
            <input
              type="text"
              className="form-control"
              name="destination"
              placeholder="To go to..."
            />
          </div>
          <div className="col">
            <button type="submit">Submit</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default App;
