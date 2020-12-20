import moment from "moment-timezone";
import { getFMA } from "./fmaMapper";

export const guid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function getRandomInRange(from, to, fixed) {
  return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
}

const randomCoordinates2 = () => {
  let coordinates = {
    lat: getRandomInRange(14.5, 14.6, 5),
    long: getRandomInRange(120.7, 120.8, 5),
  };

  return coordinates;
};

export function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}

export const formatReport = (report: any) => {
  let data;

  console.log(report);

  if (report.payload) {
    let reportData = report.payload;
    data = {
      id: guid(),
      details: reportData.desc,
      device_id: reportData.uid,
      type: reportData.mode === "if" ? "illegal_fishing" : "emergency",
      name:
        reportData.mode === "if" ? "ILLEGAL FISHING REPORT" : "EMERGENCY ALERT",
      title:
        reportData.mode === "if"
          ? "ILLEGAL FISHING REPORT"
          : "EMERGENCY DISTRESS SIGNAL",
      address: reportData.addr.trim() !== "" ? reportData.addr : "N/A",
      reportee: reportData.name,
      source_platform: "node",
      date: moment().tz("Asia/Taipei").format("MMMM D YYYY,hh:mm:ss A"),
      coordinates: randomCoordinates2(),
      report_type: "AUTO",
      status: "PENDING",
    };
  } else {
    data = {
      id: guid(),
      details: report.details,
      device_id: report.device_id,
      type: report.type,
      name:
        report.type === "illegal_fishing"
          ? "ILLEGAL FISHING REPORT"
          : "EMERGENCY ALERT",
      title:
        report.type === "illegal_fishing"
          ? "ILLEGAL FISHING REPORT"
          : "EMERGENCY DISTRESS SIGNAL",
      address: "N/A",
      reportee: "Anonymous",
      source_platform: "node",
      date: moment().tz("Asia/Taipei").format("MMMM D YYYY,hh:mm:ss A"),
      coordinates: randomCoordinates2(),
      report_type: "MANUAL",
      status: "PENDING",
    };
  }

  return data;
};

export const fmaData = [
  {
    fma: "FMA-01",
    description: "Fishery Management Area 1",
  },
  {
    fma: "FMA-02",
    description: "Fishery Management Area 2",
  },
  {
    fma: "FMA-03",
    description: "Fishery Management Area 3",
  },
  {
    fma: "FMA-04",
    description: "Fishery Management Area 4",
  },
  {
    fma: "FMA-05",
    description: "Fishery Management Area 5",
  },
  {
    fma: "FMA-06",
    description: "Fishery Management Area 6",
  },
  {
    fma: "FMA-07",
    description: "Fishery Management Area 7",
  },
  {
    fma: "FMA-08",
    description: "Fishery Management Area 8",
  },
  {
    fma: "FMA-09",
    description: "Fishery Management Area 9",
  },
  {
    fma: "FMA-10",
    description: "Fishery Management Area 10",
  },
  {
    fma: "FMA-11",
    description: "Fishery Management Area 11",
  },
  {
    fma: "FMA-12",
    description: "Fishery Management Area 12",
  },
];

export const dateFiller: any = () => {
  let months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let currentYear = moment().format("YYYY");
  let mappedDates = months.map((x: any) => {
    return {
      date: moment(new Date(`${x}-1-${currentYear}`)).format("MM-DD-YYYY"),
      activityCount: 0,
    };
  });

  return mappedDates;
};

// distance between coordinates by geodata source

export function measureCoordDistance(lat1, lon1, lat2, lon2, unit) {
  lat1 = parseFloat(lat1);
  lon1 = parseFloat(lon1);
  lat2 = parseFloat(lat2);
  lon2 = parseFloat(lon2);

  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === "K") {
      dist = dist * 1.609344;
    }
    if (unit === "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
}

// preprocess incidents

export const formatIncidents = (incident: any) => {
  let allEvents = incident;

  let response = [];

  allEvents.forEach((event: any, index: number) => {
    let eventData = event;
    let previousEvent = event;

    if (index > 0) {
      previousEvent = allEvents[index - 1];
    }

    if (event.updates) {
      let processedUpdates = event.updates.map((update: any) => {
        return {
          date: update.date,
          coordinates: update.coordinates,
          // detect if all location updates are in the
          //same FMA as the origin FMA of the report
          fma_flagged:
            getFMA([update.coordinates.long, update.coordinates.lat]) ===
            event.fma
              ? true
              : false,
          fma: getFMA([update.coordinates.long, update.coordinates.lat]),

          // get distance between coordinates from origin in Kilometers
          distanceFromOrigin: measureCoordDistance(
            event.coordinates.lat,
            event.coordinates.long,
            update.coordinates.lat,
            update.coordinates.long,
            "K"
          ),
          // get distance between coordinates from last point in Kilometers
          distanceFromLastPoint: measureCoordDistance(
            previousEvent.coordinates.lat,
            previousEvent.coordinates.long,
            update.coordinates.lat,
            update.coordinates.long,
            "K"
          ),
        };
      });

      eventData.updates = processedUpdates;
    }

    response.push(eventData);
  });

  return response;
};
