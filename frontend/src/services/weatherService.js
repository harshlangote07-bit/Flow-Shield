const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const OPENWEATHER_BASE_URL =
    "https://api.openweathermap.org/data/2.5";

const RAINVIEWER_API_URL =
    "https://api.rainviewer.com/public/weather-maps.json";

export async function getRainViewerData() {
    const response = await fetch(RAINVIEWER_API_URL);

    if (!response.ok) {
        throw new Error("Unable to fetch RainViewer radar data.");
    }

    return response.json();
}

export async function getRainForecast(lat, lon) {
    if (!OPENWEATHER_API_KEY) {
        throw new Error("OpenWeather API key is missing.");
    }

    const url =
        `${OPENWEATHER_BASE_URL}/forecast` +
        `?lat=${lat}` +
        `&lon=${lon}` +
        `&appid=${OPENWEATHER_API_KEY}` +
        `&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.message || "Unable to fetch OpenWeather forecast."
        );
    }

    return response.json();
}

export async function getCurrentWeather(lat, lon) {
    if (!OPENWEATHER_API_KEY) {
        throw new Error("OpenWeather API key is missing.");
    }

    const url =
        `${OPENWEATHER_BASE_URL}/weather` +
        `?lat=${lat}` +
        `&lon=${lon}` +
        `&appid=${OPENWEATHER_API_KEY}` +
        `&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.message || "Unable to fetch current weather."
        );
    }

    return response.json();
}

export function getRadarStatus(radarData) {
  const pastFrames = radarData?.radar?.past || [];

  if (pastFrames.length === 0) {
    return {
      status: "unavailable",
      label: "Radar unavailable",
    };
  }

  const latestFrame = pastFrames[pastFrames.length - 1];

  return {
    status: "available",
    label: "Radar data available",
    timestamp: latestFrame.time,
  };
}