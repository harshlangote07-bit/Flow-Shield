// src/engine/waterLevelPrediction.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}


/*
 * Converts rainfall over a catchment into
 * estimated runoff volume.
 *
 * rainfall (mm)
 * × catchment area (m²)
 * × runoff coefficient
 * ÷ 1000
 *
 * Result = m³
 */
function calculateRunoffVolume(
    rainfallMm,
    catchmentAreaM2,
    runoffCoefficient
) {

    if (
        rainfallMm <= 0 ||
        catchmentAreaM2 <= 0
    ) {
        return 0;
    }

    return (
        rainfallMm *
        catchmentAreaM2 *
        runoffCoefficient
    ) / 1000;
}


/*
 * Converts runoff volume into water-level
 * increase using the water body's surface area.
 *
 * volume / surface area = height in metres
 */
function calculateWaterLevelIncrease(
    runoffVolumeM3,
    surfaceAreaM2
) {

    if (surfaceAreaM2 <= 0) {
        return 0;
    }

    return (
        runoffVolumeM3 /
        surfaceAreaM2
    );
}


/*
 * Convert m³/s into volume for a given
 * number of hours.
 */
function flowToVolume(
    flowM3PerSecond,
    hours
) {

    return (
        flowM3PerSecond *
        hours *
        60 *
        60
    );
}


/*
 * Calculate the expected water-level change
 * for one time period.
 */
function calculatePeriodChange(
    rainfallMm,
    hours,
    waterBody
) {

    /*
     * 1. Rainfall runoff
     */

    const runoffVolume =
        calculateRunoffVolume(
            rainfallMm,
            waterBody.catchmentAreaM2,
            waterBody.runoffCoefficient
        );


    /*
     * 2. Additional inflow
     */

    const naturalInflow =
        flowToVolume(
            waterBody.inflowM3PerSecond,
            hours
        );


    /*
     * 3. Drainage-connected inflow
     */

    const drainageInflow =
        waterBody.drainageConnected
            ? flowToVolume(
                waterBody.drainageInflowM3PerSecond,
                hours
            )
            : 0;


    /*
     * 4. Outflow
     */

    const outflow =
        flowToVolume(
            waterBody.outflowM3PerSecond,
            hours
        );


    /*
     * 5. Evaporation
     */

    const evaporationVolume =
        (
            waterBody.evaporationMmPerHour *
            hours *
            waterBody.surfaceAreaM2
        ) / 1000;


    /*
     * 6. Net volume change
     */

    const netVolumeChange =
        runoffVolume +
        naturalInflow +
        drainageInflow -
        outflow -
        evaporationVolume;


    /*
     * 7. Convert volume to water-level change
     */

    const levelChange =
        calculateWaterLevelIncrease(
            netVolumeChange,
            waterBody.surfaceAreaM2
        );


    return {
        rainfallMm,
        hours,

        runoffVolumeM3:
            runoffVolume,

        naturalInflowM3:
            naturalInflow,

        drainageInflowM3:
            drainageInflow,

        outflowM3:
            outflow,

        evaporationVolumeM3:
            evaporationVolume,

        netVolumeChangeM3:
            netVolumeChange,

        waterLevelChangeMeters:
            levelChange
    };
}


/*
 * Main water-level prediction function.
 */
export function predictWaterLevel(
    waterBody,
    weather
) {

    /*
     * Current level
     */

    const currentLevel =
        waterBody.currentWaterLevelMeters;


    /*
     * Calculate current-period change.
     *
     * We use the latest 1-hour rainfall
     * as the current rainfall period.
     */

    const currentPeriod =
        calculatePeriodChange(
            weather.rainfall1h || 0,
            1,
            waterBody
        );


    /*
     * Calculate next 3-hour forecast.
     */

    const next3Hours =
        calculatePeriodChange(
            weather.forecast3h || 0,
            3,
            waterBody
        );


    /*
     * Calculate next 6-hour forecast.
     *
     * forecast6h represents total expected
     * rainfall over the next 6 hours.
     */

    const next6Hours =
        calculatePeriodChange(
            weather.forecast6h || 0,
            6,
            waterBody
        );


    /*
     * Predicted level after current rainfall.
     */

    const currentPredictedLevel =
        currentLevel +
        currentPeriod.waterLevelChangeMeters;


    /*
     * Predicted level after next 3 hours.
     */

    const predictedLevel3h =
        currentPredictedLevel +
        next3Hours.waterLevelChangeMeters;


    /*
     * Predicted level after next 6 hours.
     */

    const predictedLevel6h =
        currentPredictedLevel +
        next6Hours.waterLevelChangeMeters;


    /*
     * Never allow predicted water level
     * to go below zero.
     */

    const safeCurrentLevel =
        Math.max(0, currentPredictedLevel);

    const safeLevel3h =
        Math.max(0, predictedLevel3h);

    const safeLevel6h =
        Math.max(0, predictedLevel6h);


    /*
     * Determine water-body status.
     */

    const currentStatus =
        getWaterBodyStatus(
            safeCurrentLevel,
            waterBody
        );

    const status3h =
        getWaterBodyStatus(
            safeLevel3h,
            waterBody
        );

    const status6h =
        getWaterBodyStatus(
            safeLevel6h,
            waterBody
        );


    /*
     * Calculate capacity percentage.
     */

    const currentCapacity =
        calculateCapacityPercent(
            safeCurrentLevel,
            waterBody.maximumWaterLevelMeters
        );

    const capacity3h =
        calculateCapacityPercent(
            safeLevel3h,
            waterBody.maximumWaterLevelMeters
        );

    const capacity6h =
        calculateCapacityPercent(
            safeLevel6h,
            waterBody.maximumWaterLevelMeters
        );


    return {

        waterBodyId:
            waterBody.id,

        current: {
            actualLevelMeters:
                currentLevel,

            predictedLevelMeters:
                Number(
                    safeCurrentLevel.toFixed(3)
                ),

            capacityPercent:
                Number(
                    currentCapacity.toFixed(2)
                ),

            status:
                currentStatus
        },

        forecast3h: {
            predictedLevelMeters:
                Number(
                    safeLevel3h.toFixed(3)
                ),

            capacityPercent:
                Number(
                    capacity3h.toFixed(2)
                ),

            status:
                status3h
        },

        forecast6h: {
            predictedLevelMeters:
                Number(
                    safeLevel6h.toFixed(3)
                ),

            capacityPercent:
                Number(
                    capacity6h.toFixed(2)
                ),

            status:
                status6h
        },

        calculations: {
            currentPeriod,
            next3Hours,
            next6Hours
        }
    };
}


/*
 * Water-body status based on its
 * actual physical thresholds.
 */
function getWaterBodyStatus(
    level,
    waterBody
) {

    if (
        level >=
        waterBody.maximumWaterLevelMeters
    ) {
        return "OVERFLOW";
    }

    if (
        level >=
        waterBody.dangerWaterLevelMeters
    ) {
        return "CRITICAL";
    }

    if (
        level >=
        waterBody.normalWaterLevelMeters
    ) {
        return "WARNING";
    }

    return "NORMAL";
}


/*
 * Calculate percentage of maximum
 * water level.
 */
function calculateCapacityPercent(
    level,
    maximumLevel
) {

    if (!maximumLevel || maximumLevel <= 0) {
        return 0;
    }

    return clamp(
        (level / maximumLevel) * 100
    );
}