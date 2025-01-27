const GOOGLE_API_KEY = "AIzaSyD2UPNqOS_alKzCf8Yp35ka7TBS_vQxgkQ";
const TRIP_API_KEY = "1B94970065FF4BA88925137D80F358A1";

const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const polyline = require("@mapbox/polyline");

app.use(express.json());
app.use(cors());

// cd ../
// cd client -> npm run dev
// nodemon server/index.js

// POST -> Saves the route and saved locations
// GET -> retrieves previous route and saved locations -> firebase?? nah dict

// server should do a ranking algorithm based on reviews to indicate best stops (minimze distnace)

// time based stops

app.get("/", (req, res) => {
  res.send("hello");
});

app.get("/api/route/:origin/:destination", async (req, res) => {
  const origin = encodeURIComponent(req.params.origin);
  const destination = encodeURIComponent(req.params.destination);

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_API_KEY}`;
  const response = await axios.get(url);

  let encodedPoints;
  try {
    encodedPoints = response.data.routes[0].overview_polyline.points;
  } catch {
    return;
  }

  // // duration in seconds -> minutes
  const duration = response.data.routes[0].legs[0].duration.value / 60;
  // // meters -> miles
  const totalDistance =
    response.data.routes[0].legs[0].distance.value * 0.000621371;

  const points = polyline.decode(encodedPoints);

  const getCheckpoints = (array, x) => {
    const ret = [];
    const interval = Math.floor((array.length + 1) / (x + 1));
    let idx = interval;
    while (idx < array.length) {
      ret.push(array[idx]);
      idx += interval;
    }
    if (x != 2 && x != 1 && (x != 3 || points.length % 2 == 1)) {
      ret.pop();
    }
    return ret;
  };

  const checkpoints = getCheckpoints(points, 4);

  let output;
  let locations = [];
  for (const p of checkpoints) {
    const lat = p[0];
    const long = p[1];
    const category = "attractions";
    const radius = 25;
    const url = `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${lat}%2C${long}&key=${TRIP_API_KEY}&category=${category}&radius=${radius}&radiusUnit=mi&language=en`;
    const tripResponse = await axios.get(url);

    output = tripResponse.data.data;

    let maxTemp = 0;
    for (const poi of output) {
      if (maxTemp < 6) {
        locationId = poi["location_id"];
        distance = poi["distance"];
        locations.push(await getLocation(locationId, distance));
        maxTemp += 1;
      }
    }
  }

  res.json({
    center: points[Math.floor(points.length / 2)],
    route: points,
    distance: totalDistance,
    duration: duration,
    locations: locations,
  });
  // res.send(checkpoints);
});

const getLocation = async (locationId, distance) => {
  // want to get distance from route, name, reviews, what it is (category?), location
  const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${TRIP_API_KEY}`;
  const locationResponse = await axios.get(url);

  let hasRequired = true;

  // require what??
  const required = ["name", "ancestors", "num_reviews", "groups"];

  for (const i in required) {
    if (!locationResponse.data.hasOwnProperty(required[i])) {
      console.log(required[i]);
      hasRequired = false;
    }
  }

  const round = (x) => {
    return Math.round(x * 100) / 100;
  };

  if (hasRequired) {
    const location = new Location();
    location.name = locationResponse.data["name"];
    location.distance = round(distance);
    location.city = locationResponse.data["ancestors"][0]["name"];
    location.state = locationResponse.data["ancestors"][1]["name"];
    location.category =
      locationResponse.data["groups"][0]["categories"][0]["localized_name"] ??
      "";
    location.description = locationResponse.data["description"] ?? "";

    location.position = {
      lat: parseFloat(locationResponse.data["latitude"]),
      lng: parseFloat(locationResponse.data["longitude"]),
    };

    location.reviewCount = locationResponse.data["num_reviews"];

    // reviewscore
    if (location.reviewCount == 0) {
      location.reviewScore = 0;
    } else {
      const scores = locationResponse.data["review_rating_count"];
      location.reviewScore =
        (parseInt(scores["1"]) +
          parseInt(scores["2"]) * 2 +
          parseInt(scores["3"]) * 3 +
          parseInt(scores["4"]) * 4 +
          parseInt(scores["5"]) * 5) /
        location.reviewCount;
    }
    location.reviewScore = location.reviewScore.toFixed(2);
    return location;
  } else {
    console.log("missing data");
  }
  // let location = Location();
  // location.name = locationResponse.data["name"];
  // location.distance = distance;
  // locationlocationResponse.data["name"];
};

// state is country if not in us
class Location {
  name = "";
  distance = ""; // miles
  city = "";
  state = "";
  category = "";
  description = "";
  lat = 0;
  long = 0;
  reviewScore = 0;
  reviewCount = 0;
}

/// JUNK:
const courses = [
  { id: 1, name: "c1" },
  { id: 2, name: "c2" },
];

app.get("/api/courses", (req, res) => {
  res.send([1, 2322, 3]);
});

app.get("/api/courses/:id", (req, res) => {
  // let or const
  const course = courses.find((c) => c.id === parseInt(req.params.id));
  if (!course) res.status(404).send("Course with given id not found");
  res.send(course);
});

app.post("/api/courses", (req, res) => {
  // add if statement for input validation, then return -> joi
  const course = {
    id: courses.length + 1,
    name: req.body.name,
  };
  courses.push(course);
  res.send(course);
});

// updates
app.put("/api/courses/:id", (req, res) => {
  const course = courses.find((c) => c.id === parseInt(req.params.id));
  if (!course) res.status(404).send("Course with given id not found");

  course.name = req.body.name;
  res.send(course);
});

// app.get('/api/courses/:year/:month', (req, res) => {
//     res.send(req.params)
//     // req.query -> ?key=value
// })

module.exports = app;
