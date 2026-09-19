// src/engine/terrainScore.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

function inverseScore(value, best, worst) {

    if (value == null) {
        return 50;
    }

    if (value <= best) {
        return 100;
    }

    if (value >= worst) {
        return 0;
    }

    return clamp(
        ((worst - value) / (worst - best)) * 100
    );
}

export function calculateTerrainScore(terrain) {

    /*
     * Lower elevation generally means greater
     * potential for water accumulation.
     *
     * NOTE:
     * Elevation should ideally be calculated
     * relative to the surrounding area rather
     * than using an absolute city-wide threshold.
     */

    const elevationScore =
        inverseScore(
            terrain.elevationMeters,
            0,
            1000
        );


    /*
     * Lower slope means water drains more slowly.
     *
     * 0% slope  -> very high risk
     * 10%+      -> low contribution
     */

    const slopeScore =
        inverseScore(
            terrain.slopePercent,
            0,
            10
        );


    /*
     * Percentage of the area that is low lying.
     */

    const lowLyingScore =
        clamp(
            terrain.lowLyingAreaPercent || 0
        );


    /*
     * Flow accumulation represents how much
     * surface water tends to collect in the area.
     */

    const flowAccumulationScore =
        clamp(
            terrain.flowAccumulation || 0
        );


    /*
     * Floodplain areas receive additional risk.
     */

    const floodplainScore =
        terrain.floodplain === true
            ? 100
            : 0;


    /*
     * Weighted terrain score.
     */

    const terrainScore =
        elevationScore * 0.25 +
        slopeScore * 0.25 +
        lowLyingScore * 0.25 +
        flowAccumulationScore * 0.15 +
        floodplainScore * 0.10;


    return clamp(terrainScore);
}