import moment from "moment-timezone";

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
    description: "Fishery Management Area 1"
  },
  {
    fma: "FMA-02",
    description: "Fishery Management Area 2"
  },
  {
    fma: "FMA-03",
    description: "Fishery Management Area 3"
  },
  {
    fma: "FMA-04",
    description: "Fishery Management Area 4"
  },
  {
    fma: "FMA-05",
    description: "Fishery Management Area 5"
  },
  {
    fma: "FMA-06",
    description: "Fishery Management Area 6"
  },
  {
    fma: "FMA-07",
    description: "Fishery Management Area 7"
  },
  {
    fma: "FMA-08",
    description: "Fishery Management Area 8"
  },
  {
    fma: "FMA-09",
    description: "Fishery Management Area 9"
  },
  {
    fma: "FMA-10",
    description: "Fishery Management Area 10"
  },
  {
    fma: "FMA-11",
    description: "Fishery Management Area 11"
  },
  {
    fma: "FMA-12",
    description: "Fishery Management Area 12"
  },
]