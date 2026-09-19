// src/engine/rainfallScore.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

function score(value, maximum) {
    if (value == null || value < 0) {
        return 0;
    }

    return clamp((value / maximum) * 100);
}

export function calculateRainfallScore(weather) {

    /*
     * All rainfall values are converted to 0–100.
     *
     * The thresholds below are V1 baseline values.
     * They can later be calibrated using historical flood data.
     */

    const intensityScore =
        score(
            weather.rainfallIntensity,
            40
        );

    const rain1hScore =
        score(
            weather.rainfall1h,
            50
        );

    const rain3hScore =
        score(
            weather.rainfall3h,
            100
        );

    const rain6hScore =
        score(
            weather.rainfall6h,
            150
        );

    const rain24hScore =
        score(
            weather.rainfall24h,
            250
        );

    const forecast3hScore =
        score(
            weather.forecast3h,
            75
        );

    const forecast6hScore =
        score(
            weather.forecast6h,
            100
        );

    const probabilityScore =
        clamp(
            weather.precipitationProbability || 0
        );


    /*
     * Weighted rainfall score
     */

    const rainfallScore =
        intensityScore * 0.25 +
        rain1hScore * 0.20 +
        rain3hScore * 0.15 +
        rain6hScore * 0.10 +
        rain24hScore * 0.10 +
        forecast3hScore * 0.05 +
        forecast6hScore * 0.10 +
        probabilityScore * 0.05;


    return clamp(rainfallScore);
}