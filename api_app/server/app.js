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

let savedTrips = {};

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
    console.log("origin destination failed");
    return;
  }

  // // duration in seconds -> hours
  const duration = (
    response.data.routes[0].legs[0].duration.value /
    60 /
    60
  ).toFixed(2);
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

    locations = locations.concat(
      await findLocations(lat, long, "attractions,restaurants")
    );
    // const category = "attractions";
    // const radius = 25;
    // const url = `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${lat}%2C${long}&key=${TRIP_API_KEY}&category=${category}&radius=${radius}&radiusUnit=mi&language=en`;
    // const tripResponse = await axios.get(url);

    // output = tripResponse.data.data;

    // let maxTemp = 0;
    // for (const poi of output) {
    //   if (maxTemp < 6) {
    //     locationId = poi["location_id"];
    //     distance = poi["distance"] / 60;
    //     locations.push([locationId, distance]);
    //     // locations.push(await getLocation(locationId, distance));
    //     maxTemp += 1;
    //   }
    // }
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

app.get("/api/stop/:lat/:lng/:category", async (req, res) => {
  const lat = encodeURIComponent(req.params.lat);
  const lng = encodeURIComponent(req.params.lng);
  const category = encodeURIComponent(req.params.category);

  res.json({ locations: await findLocations(lat, lng, category) });
});

// app.get("/api/food/:lat/:lng", async (req, res) => {
//   const lat = encodeURIComponent(req.params.lat);
//   const lng = encodeURIComponent(req.params.lng);

//   res.json({ locations: await findLocations(lat, lng, "restaurants") });
// });

const findLocations = async (lat, long, category) => {
  const radius = 25;
  const url = `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${lat}%2C${long}&key=${TRIP_API_KEY}&category=${category}&radius=${radius}&radiusUnit=mi&language=en`;
  let tripResponse;
  try {
    tripResponse = await axios.get(url);
  } catch (error) {
    console.log("find locations failed");
    console.error(error);
    return [];
  }

  output = tripResponse.data.data;
  let maxTemp = 0;
  locations = [];
  for (const poi of output) {
    if (maxTemp < 6) {
      locationId = poi["location_id"];
      distance = poi["distance"];
      locations.push([locationId, distance, category]);
      // locations.push(await getLocation(locationId, distance));
      maxTemp += 1;
    }
  }
  return locations;
};

// takes in location id and distance, returns location data
app.get("/api/tripadvisor/:locationId/:distance", async (req, res) => {
  const locationId = encodeURIComponent(req.params.locationId);
  const distance = encodeURIComponent(req.params.distance);

  const response = await getLocation(locationId, distance);
  if (response == -1) {
    res.json({ success: false });
  } else {
    res.json({ success: true, location: response });
  }
});

app.post("/api/save/:trip", (req, res) => {
  const tripCode = encodeURIComponent(req.params.trip);
  const data = req.body;
  savedTrips[tripCode] = data;
  res.send("success");
});

app.get("/api/load/:trip", (req, res) => {
  const tripCode = encodeURIComponent(req.params.trip);
  if (savedTrips[tripCode]) {
    res.send(savedTrips[tripCode]);
  } else {
    console.log(savedTrips);
    res.send("fail");
  }
});

const getLocation = async (locationId, distance) => {
  const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${TRIP_API_KEY}`;

  let locationResponse;
  try {
    locationResponse = await axios.get(url);
  } catch (error) {
    console.error(error);
    console.log("find location failed");
    return -1;
  }

  let hasRequired = true;

  // require what??
  // const required = ["name", "ancestors", "num_reviews"];
  // for (const i in required) {
  //   if (locationResponse.data.hasOwnProperty(required[i])) {
  //     console.log(required[i]);
  //     hasRequired = false;
  //   }
  // }

  let type = "attractions";
  if (locationResponse.data.hasOwnProperty("cuisine")) {
    type = "restaurants";
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
    try {
      if (location.type == "attractions") {
        location.category =
          locationResponse.data["groups"][0]["categories"][0]["localized_name"];
      } else {
        location.category =
          locationResponse.data["cuisine"][0]["localized_name"];
      }
    } catch {
      location.category = "";
    }
    location.description = locationResponse.data["description"] ?? "";

    if (location.description.length > 150) {
      location.description = location.description.substring(0, 150) + "...";
    }

    location.position = {
      lat: parseFloat(locationResponse.data["latitude"]),
      lng: parseFloat(locationResponse.data["longitude"]),
    };

    location.reviewCount = locationResponse.data["num_reviews"];
    location.imageCount = locationResponse.data["photo_count"];

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

    // internal score max would be 5 + 1 - 0 + 1
    location.internalScore =
      parseFloat(location.reviewScore) + parseFloat(location.distance) / 10;
    // (parseInt(location.imageCount) > 0 ? 1 : 0);

    location.internalScore = Math.max(
      0,
      Math.min(1, location.internalScore / 5)
    );

    // 3x difference in score
    location.internalScore = Math.max(
      0,
      1 - (1 - location.internalScore) * 3 - 0.1
    );

    if (location.internalScore > 0.6 && location.imageCount > 0) {
      const img = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?key=${TRIP_API_KEY}&language=en&limit=1`;
      try {
        const imageResponse = await axios.get(img);
        imageUrl = imageResponse.data.data[0].images.small.url;
        location.imageUrl = imageUrl;
        location.loadedImage = true;
        location.internalScore = Math.min(1, location.internalScore + 0.1);
      } catch (error) {
        console.error(error);
        location.imageUrl = "";
        console.log("could not get image");
      }
    }

    location.type = type;
    // console.log(location);
    return location;
  } else {
    console.log("missing data");
    console.log(locationResponse.data);
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
  internalScore = 0;
  type = "";
  imageCount = 0;
  loadedImage = false;
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
