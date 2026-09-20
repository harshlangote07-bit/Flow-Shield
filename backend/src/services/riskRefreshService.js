import { Area } from "../models/index.js";
import { calculateAreaRisk } from "./riskService.js";

let refreshInProgress = false;

export async function refreshAllAreasRisk() {
  if (refreshInProgress) {
    console.log("Risk refresh already in progress. Skipping.");
    return;
  }

  refreshInProgress = true;

  try {
    const areas = await Area.find({
      isActive: true
    })
      .select("areaId name")
      .lean();

    console.log(
      `Starting risk refresh for ${areas.length} areas...`
    );

    let successful = 0;
    let failed = 0;

    for (const area of areas) {
      try {
        await calculateAreaRisk(area.areaId);

        successful++;

        console.log(
          `Risk refreshed: ${area.areaId}`
        );
      } catch (error) {
        failed++;

        console.error(
          `Risk refresh failed for ${area.areaId}:`,
          error.message
        );
      }
    }

    console.log(
      `Risk refresh completed: ${successful} successful, ${failed} failed`
    );
  } finally {
    refreshInProgress = false;
  }
}

export function startRiskRefreshScheduler() {
  const intervalMinutes = Number(
    process.env.RISK_UPDATE_INTERVAL_MINUTES || 30
  );

  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(
    `Risk scheduler started. Interval: ${intervalMinutes} minutes`
  );

  // Calculate once when backend starts
  refreshAllAreasRisk();

  // Continue calculating periodically
  setInterval(() => {
    refreshAllAreasRisk();
  }, intervalMs);
}