import {
  Area,
  WeatherObservation,
  WeatherForecast,
} from "../models/index.js";

const OPEN_METEO_BASE_URL =
  process.env.OPEN_METEO_BASE_URL ||
  "https://api.open-meteo.com/v1/forecast";

async function findArea(areaId) {
  const area = await Area.findOne({ areaId }).lean();

  if (!area) {
    const error = new Error(`Area not found: ${areaId}`);
    error.statusCode = 404;
    throw error;
  }

  return area;
}

function getCoordinates(area) {
  const latitude =
    area?.centroid?.latitude ??
    area?.location?.latitude ??
    area?.latitude;

  const longitude =
    area?.centroid?.longitude ??
    area?.location?.longitude ??
    area?.longitude;

  if (
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) {
    const error = new Error(
      `Area ${area.areaId} does not have valid latitude/longitude coordinates`
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

async function fetchOpenMeteoWeather(area) {
  const { latitude, longitude } = getCoordinates(area);

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "rain",
      "weather_code",
      "pressure_msl",
      "wind_speed_10m",
    ].join(","),

    hourly: [
      "precipitation",
      "rain",
      "precipitation_probability",
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "pressure_msl",
      "weather_code",
    ].join(","),

    past_days: "1",
    forecast_days: "2",

    temperature_unit: "celsius",
    wind_speed_unit: "ms",
    precipitation_unit: "mm",

    timezone: "UTC",
  });

  const response = await fetch(`${OPEN_METEO_BASE_URL}?${params}`);

  if (!response.ok) {
    const body = await response.text();

    const error = new Error(
      `Open-Meteo request failed: ${response.status} ${body}`
    );

    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

function sumValues(values, startIndex, count) {
  if (!Array.isArray(values)) {
    return 0;
  }

  return values
    .slice(startIndex, startIndex + count)
    .reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function averageValues(values, startIndex, count) {
  if (!Array.isArray(values)) {
    return 0;
  }

  const selected = values
    .slice(startIndex, startIndex + count)
    .filter((value) => Number.isFinite(Number(value)));

  if (!selected.length) {
    return 0;
  }

  return (
    selected.reduce((sum, value) => sum + Number(value), 0) /
    selected.length
  );
}

function getCurrentHourIndex(hourly) {
  if (!hourly?.time?.length) {
    return 0;
  }

  const now = Date.now();

  let closestIndex = 0;
  let closestDifference = Infinity;

  hourly.time.forEach((time, index) => {
    const difference = Math.abs(new Date(time).getTime() - now);

    if (difference < closestDifference) {
      closestDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function buildObservation(area, weather) {
  const hourly = weather.hourly || {};
  const currentIndex = getCurrentHourIndex(hourly);

  const precipitation = hourly.precipitation || [];
  const rain = hourly.rain || [];

  const rainfall1h =
    Number(
      precipitation[currentIndex] ??
        rain[currentIndex] ??
        weather.current?.precipitation ??
        0
    ) || 0;

  const rainfall3h = sumValues(
    precipitation,
    Math.max(0, currentIndex - 2),
    3
  );

  const rainfall6h = sumValues(
    precipitation,
    Math.max(0, currentIndex - 5),
    6
  );

  const rainfall24h = sumValues(
    precipitation,
    Math.max(0, currentIndex - 23),
    24
  );

  const observedAt =
    hourly.time?.[currentIndex] ||
    new Date().toISOString();

  return {
    areaId: area._id,
    observedAt: new Date(observedAt),

    rainfallIntensity: rainfall1h,

    rainfall1h,
    rainfall3h,
    rainfall6h,
    rainfall24h,

    precipitationProbability:
      Number(
        hourly.precipitation_probability?.[currentIndex] ?? 0
      ) || 0,

    temperatureC:
      Number(
        weather.current?.temperature_2m ??
          hourly.temperature_2m?.[currentIndex]
      ) || 0,

    humidityPercent:
      Number(
        weather.current?.relative_humidity_2m ??
          hourly.relative_humidity_2m?.[currentIndex]
      ) || 0,

    windSpeedMps:
      Number(
        weather.current?.wind_speed_10m ??
          hourly.wind_speed_10m?.[currentIndex]
      ) || 0,

    pressureHpa:
      Number(
        weather.current?.pressure_msl ??
          hourly.pressure_msl?.[currentIndex]
      ) || 0,

    weatherCondition: String(
      weather.current?.weather_code ??
        hourly.weather_code?.[currentIndex] ??
        ""
    ),

    source: "open-meteo",
  };
}

function buildForecast(area, weather) {
  const hourly = weather.hourly || {};
  const currentIndex = getCurrentHourIndex(hourly);

  const precipitation = hourly.precipitation || [];

  const forecast3h = sumValues(
    precipitation,
    currentIndex + 1,
    3
  );

  const forecast6h = sumValues(
    precipitation,
    currentIndex + 1,
    6
  );

  const validFrom =
    hourly.time?.[currentIndex + 1] ||
    new Date().toISOString();

  const validUntil =
    hourly.time?.[currentIndex + 6] ||
    validFrom;

  const precipitationProbability = Math.max(
    ...(
      hourly.precipitation_probability?.slice(
        currentIndex + 1,
        currentIndex + 7
      ) || [0]
    ).map((value) => Number(value) || 0)
  );

  return {
    areaId: area._id,

    forecastGeneratedAt: new Date(),

    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),

    forecast3h,
    forecast6h,

    precipitationProbability,

    temperatureC:
      averageValues(
        hourly.temperature_2m,
        currentIndex + 1,
        6
      ) || 0,

    humidityPercent:
      averageValues(
        hourly.relative_humidity_2m,
        currentIndex + 1,
        6
      ) || 0,

    windSpeedMps:
      averageValues(
        hourly.wind_speed_10m,
        currentIndex + 1,
        6
      ) || 0,

    source: "open-meteo",
  };
}

async function refreshAreaWeather(area) {
  const weather = await fetchOpenMeteoWeather(area);

  const observation = buildObservation(area, weather);
  const forecast = buildForecast(area, weather);

  await Promise.all([
    WeatherObservation.create(observation),
    WeatherForecast.create(forecast),
  ]);

  return {
    observation,
    forecast,
  };
}

export async function getAreaWeather(areaId) {
  const area = await findArea(areaId);

  /*
   * Fetch fresh Open-Meteo data and persist it in MongoDB.
   */
  const freshWeather = await refreshAreaWeather(area);

  const [observations, forecasts] = await Promise.all([
    WeatherObservation.find({
      areaId: area._id,
    })
      .sort({ observedAt: -1 })
      .limit(50)
      .lean(),

    WeatherForecast.find({
      areaId: area._id,
    })
      .sort({ forecastGeneratedAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return {
    areaId: area.areaId,
    areaName: area.name,

    current: freshWeather.observation,
    forecast: freshWeather.forecast,

    observations,
    forecasts,
  };
}

export async function getCurrentWeather(areaId) {
  const area = await findArea(areaId);

  /*
   * Always refresh before returning current weather.
   * MongoDB remains our persistent weather history.
   */
  const freshWeather = await refreshAreaWeather(area);

  return {
    areaId: area.areaId,
    areaName: area.name,

    observation: freshWeather.observation,
    forecast: freshWeather.forecast,
  };
}