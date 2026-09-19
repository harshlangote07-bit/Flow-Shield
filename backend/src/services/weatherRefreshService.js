import { Area } from "../models/index.js";
import { getCurrentWeather } from "./weatherService.js";

let refreshInProgress = false;

export async function refreshAllAreasWeather() {
  if (refreshInProgress) {
    console.log("Weather refresh already in progress. Skipping.");
    return;
  }

  refreshInProgress = true;

  try {
    const areas = await Area.find({})
      .select("areaId")
      .lean();

    console.log(
      `Starting weather refresh for ${areas.length} areas...`
    );

    let successful = 0;
    let failed = 0;

    for (const area of areas) {
      try {
        await getCurrentWeather(area.areaId);

        successful++;

        console.log(
          `Weather refreshed: ${area.areaId}`
        );
      } catch (error) {
        failed++;

        console.error(
          `Weather refresh failed for ${area.areaId}:`,
          error.message
        );
      }
    }

    console.log(
      `Weather refresh completed: ${successful} successful, ${failed} failed`
    );
  } finally {
    refreshInProgress = false;
  }
}

export function startWeatherRefreshScheduler() {
  const intervalMinutes = Number(
    process.env.WEATHER_UPDATE_INTERVAL_MINUTES || 30
  );

  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(
    `Weather scheduler started. Interval: ${intervalMinutes} minutes`
  );

  // Refresh once when backend starts
  refreshAllAreasWeather();

  // Continue refreshing periodically
  setInterval(() => {
    refreshAllAreasWeather();
  }, intervalMs);
}