// src/engine/waterBodyScore.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

function score(value, maximum) {
    if (value == null || value < 0 || maximum <= 0) {
        return 0;
    }

    return clamp((value / maximum) * 100);
}

function getOverflowScore(overflowRisk) {
    switch (String(overflowRisk || "").toLowerCase()) {
        case "critical":
            return 100;

        case "high":
            return 80;

        case "moderate":
            return 50;

        case "low":
            return 20;

        default:
            return 0;
    }
}

/*
 * Convert predicted water-body status
 * into a risk score.
 */
function getPredictedStatusScore(status) {
    switch (String(status || "").toLowerCase()) {
        case "overflow":
            return 100;

        case "critical":
            return 90;

        case "warning":
            return 60;

        case "normal":
            return 10;

        default:
            return 0;
    }
}

/*
 * Get the highest predicted water level
 * from current, 3h and 6h predictions.
 */
function getWorstPrediction(prediction) {
    if (!prediction) {
        return {
            levelMeters: 0,
            capacityPercent: 0,
            status: "unknown"
        };
    }

    const predictions = [
        {
            levelMeters:
                prediction.current?.predictedLevelMeters ?? 0,

            capacityPercent:
                prediction.current?.capacityPercent ?? 0,

            status:
                prediction.current?.status ?? "unknown"
        },

        {
            levelMeters:
                prediction.forecast3h?.predictedLevelMeters ?? 0,

            capacityPercent:
                prediction.forecast3h?.capacityPercent ?? 0,

            status:
                prediction.forecast3h?.status ?? "unknown"
        },

        {
            levelMeters:
                prediction.forecast6h?.predictedLevelMeters ?? 0,

            capacityPercent:
                prediction.forecast6h?.capacityPercent ?? 0,

            status:
                prediction.forecast6h?.status ?? "unknown"
        }
    ];

    return predictions.reduce(
        (worst, current) => {

            if (
                current.capacityPercent >
                worst.capacityPercent
            ) {
                return current;
            }

            return worst;
        },
        predictions[0]
    );
}

export function calculateWaterBodyScore(
    waterBodies = []
) {
    if (
        !Array.isArray(waterBodies) ||
        waterBodies.length === 0
    ) {
        return {
            score: 0,
            bodies: []
        };
    }

    const bodies = waterBodies.map(waterBody => {

        const distance =
            waterBody.distanceMeters ?? 10000;

        const area =
            waterBody.areaKm2 ?? 0;

        /*
         * NEW:
         *
         * waterLevelPrediction.js should provide
         * the predicted water-level result.
         */
        const prediction =
            waterBody.waterLevelPrediction;

        const worstPrediction =
            getWorstPrediction(prediction);

        /*
         * Current observed water level.
         *
         * Used as fallback when prediction
         * is unavailable.
         */
        const observedWaterLevel =
            waterBody.waterLevelPercent ?? 0;

        /*
         * Use the higher of:
         *
         * 1. Current observed level
         * 2. Predicted capacity
         *
         * This prevents the prediction from
         * accidentally reducing an already-high
         * observed water level.
         */
        const waterLevelScore =
            Math.max(
                clamp(observedWaterLevel),
                clamp(worstPrediction.capacityPercent)
            );

        /*
         * Distance influence:
         *
         * 0m      -> 100
         * 500m    -> 75
         * 1000m   -> 50
         * 1500m   -> 25
         * 2000m+  -> 0
         */
        const proximityScore =
            clamp(
                100 -
                (distance / 20)
            );

        /*
         * Larger water bodies can have
         * greater flood influence.
         */
        const sizeScore =
            score(area, 5);

        /*
         * Existing/current overflow risk.
         */
        const overflowScore =
            getOverflowScore(
                waterBody.overflowRisk
            );

        /*
         * NEW:
         *
         * Future predicted status.
         *
         * Example:
         *
         * Current -> NORMAL
         * 3h      -> WARNING
         * 6h      -> OVERFLOW
         *
         * predictedStatusScore = 100
         */
        const predictedStatusScore =
            getPredictedStatusScore(
                worstPrediction.status
            );

        /*
         * Historical overflow.
         */
        const historicalOverflowScore =
            waterBody.historicalOverflow === true
                ? 80
                : 0;

        /*
         * Drainage connectivity.
         */
        const connectivityScore =
            waterBody.drainageConnected === true
                ? 100
                : 0;

        /*
         * Calculate influence of this
         * water body.
         *
         * Water level is now based on both
         * current and predicted conditions.
         */
        const rawScore =
            proximityScore * 0.25 +
            waterLevelScore * 0.25 +
            sizeScore * 0.10 +
            overflowScore * 0.10 +
            predictedStatusScore * 0.15 +
            historicalOverflowScore * 0.05 +
            connectivityScore * 0.10;

        /*
         * Distance acts as the final influence
         * multiplier.
         */
        const distanceMultiplier =
            proximityScore / 100;

        const contribution =
            clamp(
                rawScore *
                distanceMultiplier
            );

        return {
            id: waterBody.id,

            name: waterBody.name,

            type: waterBody.type,

            distanceMeters: distance,

            /*
             * Current observed level.
             */
            waterLevelPercent:
                Number(
                    observedWaterLevel.toFixed(2)
                ),

            /*
             * NEW:
             * Worst predicted capacity.
             */
            predictedWaterLevelPercent:
                Number(
                    worstPrediction.capacityPercent.toFixed(2)
                ),

            /*
             * NEW:
             * Predicted level in metres.
             */
            predictedWaterLevelMeters:
                Number(
                    worstPrediction.levelMeters.toFixed(3)
                ),

            /*
             * NEW:
             * NORMAL / WARNING / CRITICAL / OVERFLOW
             */
            predictedStatus:
                worstPrediction.status,

            overflowRisk:
                waterBody.overflowRisk ||
                "unknown",

            historicalOverflow:
                waterBody.historicalOverflow === true,

            drainageConnected:
                waterBody.drainageConnected === true,

            contribution:
                Number(
                    contribution.toFixed(2)
                )
        };
    });

    /*
     * Multiple water bodies use diminishing returns.
     *
     * Example:
     *
     * Lake = 70
     * Canal = 50
     *
     * We DON'T simply do 120.
     */
    let combinedScore = 0;

    for (const body of bodies) {

        combinedScore =
            100 -
            (100 - combinedScore) *
            (1 - body.contribution / 100);
    }

    return {
        score:
            Number(
                clamp(combinedScore).toFixed(2)
            ),

        bodies:
            bodies.sort(
                (a, b) =>
                    b.contribution -
                    a.contribution
            )
    };
}