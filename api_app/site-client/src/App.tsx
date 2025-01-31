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

  // distance, time
  const [trip, setTrip] = useState([-1, -1]);

  const [tripCode, setTripCode] = useState(generateCode());

  // const replaceMarkers = (newMarkers: Location[]) => {
  //   const finalMarkers = [];
  //   for (const i in newMarkers) {
  //     if (newMarkers[i].reviewScore > 2) {
  //       finalMarkers.push(newMarkers[i]);
  //     }
  //   }
  //   console.log("replacing markers");
  //   if (finalMarkers.length > 1) {
  //     setMarkers(finalMarkers);
  //   } else {
  //     setMarkers(newMarkers);
  //   }
  // };

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function generateCode() {
    const chars = "QWERTYUIOPASDFGHJKLZXCVBNM";
    let output = "";
    for (let i = 0; i < 4; i++) {
      output += chars[Math.floor(Math.random() * 26)];
    }
    return output;
  }

  const addMarker = (marker: Location) => {
    if (marker.reviewScore > 2) {
      setMarkers((prevMarkers) => [...prevMarkers, marker]);
    }
  };

  const addStop = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const hours = formData.get("hours");
    const formCategory = formData.get("category") as string;

    let category;
    if (formCategory == "Attractions & Restaurants") {
      category = "attractions,restaurants";
    } else if (formCategory == "Attractions Only") {
      category = "attractions";
    } else {
      category = "restaurants";
    }

    if (hours == null || isNaN(Number(hours))) {
      return;
    }
    if (0 <= Number(hours) && Number(hours) <= trip[1] && route) {
      // percentage into the trip:
      let portion = Number(hours) / trip[1];
      let point = route[Math.floor(portion * (route.length - 1))];
      axios
        .get(
          "http://localhost:3000/api/stop/" +
            point["lat"] +
            "/" +
            point["lng"] +
            "/" +
            category
        )
        .then((data) => {
          console.log("res");
          console.log(data.data.locations);
          for (const i in data.data.locations) {
            getTripLocation(
              data.data.locations[i][0],
              data.data.locations[i][1]
            );
            sleep(10);
          }
        });
    }
    if (e.currentTarget as HTMLFormElement) {
      (e.currentTarget as HTMLFormElement).reset();
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
        setMarkers([]);
        setTrip([data.data.distance, data.data.duration]);

        for (const i in data.data.locations) {
          getTripLocation(data.data.locations[i][0], data.data.locations[i][1]);
          sleep(10);
        }
        // replaceMarkers(data.data.locations);
      });
  };

  const getTripLocation = async (locationId: string, distance: string) => {
    axios
      .get(
        "http://localhost:3000/api/tripadvisor/" + locationId + "/" + distance
      )
      .then((data) => {
        if (data.data.success) {
          addMarker(data.data.location);
        }
      });
  };

  const saveTrip = async () => {
    console.log("save trip");
    console.log(tripCode);
    // send over the center of the map and list of markers and trip code
    let obj = {
      center: center,
      markers: markers,
      route: route,
      trip: trip,
      zoom: zoom,
    };
    axios.post("http://localhost:3000/api/save/" + tripCode, obj);
    // .then((data) => {
    //   if (data.data.success) {
    //     addMarker(data.data.location);
    //   }
    // });
  };

  const loadTrip = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const tripCode = formData.get("tripCode") as string;

    axios.get("http://localhost:3000/api/load/" + tripCode).then((data) => {
      if (data.data == "fail") {
        console.log("No trip found");
      } else {
        setCenter(data.data.center);
        setMarkers(data.data.markers);
        setRoute(data.data.route);
        setTrip(data.data.trip);
        setZoom(data.data.zoom);
        setTripCode(tripCode);
      }
    });
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-10 ">
          <h1> Welcome to Stop Finder!</h1>
        </div>
        <div className="col-md-2 mt-2">
          <button
            type="submit"
            className="btn btn-outline-dark"
            onClick={saveTrip}
          >
            {" "}
            Save Trip: {tripCode}
          </button>
        </div>
      </div>

      <GoogleMapComponent
        markers={markers}
        center={center}
        route={route}
        zoom={zoom}
      />

      <form onSubmit={apiCall} className="mt-3">
        <div className="row">
          <div className="col-md-5 ">
            <input
              type="text"
              className="form-control"
              name="origin"
              placeholder="Leave from..."
            />
          </div>
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              name="destination"
              placeholder="To go to..."
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary">
              Find Route
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={addStop} className="mt-2">
        <div className="row">
          <div className="col-md-3 ">
            <input
              type="text"
              className="form-control"
              name="hours"
              placeholder={
                "Find stops in... hours " +
                (trip[0] == -1 ? "" : `(${trip[1]} hour trip)`)
              }
              disabled={trip[0] == -1}
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-control"
              id="exampleFormControlSelect1"
              disabled={trip[0] == -1}
              name="category"
            >
              <option>Attractions & Restaurants</option>
              <option>Attractions Only</option>
              <option>Restaurants Only</option>
            </select>
          </div>

          <div className="col-md-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={trip[0] == -1}
            >
              Add Stop
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={loadTrip} className="mt-2">
        <div className="row">
          <div className="col-md-2 ">
            <input
              type="text"
              className="form-control"
              name="tripCode"
              placeholder={"Have a saved trip code?"}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary">
              Load Trip
            </button>
          </div>
          <div className="col-md-6" />
        </div>
      </form>

      {/* <form onSubmit={loadTrip} className="mt-2">
        <div className="row">
          <div className="col-md-2 ">
            <input
              type="text"
              className="form-control"
              name="hours"
              placeholder={"Have a saved trip code?"}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary">
              Load Trip
            </button>
          </div>
          <div className="col-md-6" />
          <div className="col-md-2">
            <h6>Trip Code: {tripCode}</h6>
          </div>
        </div>
      </form> */}
    </div>
  );
}

export default App;

{
  /* <form onSubmit={apiCall}>
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
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </div>
      </form> */
}
