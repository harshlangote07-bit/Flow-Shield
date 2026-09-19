function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

/*
 * Soil type influence on flooding.
 *
 * Lower infiltration = higher flood risk.
 */
function getSoilTypeScore(soilType) {
    switch (String(soilType || "").toLowerCase()) {

        case "clay":
            return 90;

        case "clayey":
            return 90;

        case "silty clay":
            return 85;

        case "silt":
            return 75;

        case "loam":
            return 50;

        case "sandy loam":
            return 30;

        case "sand":
            return 15;

        case "gravel":
            return 5;

        case "rock":
            return 10;

        default:
            return 50;
    }
}

/*
 * Infiltration rate:
 *
 * Very low infiltration -> high flood risk
 * High infiltration      -> low flood risk
 *
 * mm/hour
 */
function getInfiltrationScore(infiltrationRate) {

    if (
        infiltrationRate == null ||
        infiltrationRate < 0
    ) {
        return 50;
    }

    if (infiltrationRate <= 2) {
        return 100;
    }

    if (infiltrationRate <= 5) {
        return 85;
    }

    if (infiltrationRate <= 10) {
        return 65;
    }

    if (infiltrationRate <= 20) {
        return 40;
    }

    if (infiltrationRate <= 40) {
        return 20;
    }

    return 5;
}

/*
 * Soil saturation directly increases
 * flood risk.
 *
 * 0%   -> dry
 * 100% -> completely saturated
 */
function getSaturationScore(saturation) {

    if (
        saturation == null ||
        saturation < 0
    ) {
        return 50;
    }

    return clamp(saturation);
}

/*
 * Drainage class.
 */
function getDrainageClassScore(drainageClass) {

    switch (
        String(drainageClass || "").toLowerCase()
    ) {

        case "very poor":
            return 100;

        case "poor":
            return 85;

        case "somewhat poor":
            return 70;

        case "moderate":
            return 50;

        case "well":
            return 25;

        case "very well":
            return 5;

        default:
            return 50;
    }
}


/*
 * Main soil flood-risk calculation.
 */
export function calculateSoilScore(soil = {}) {

    const soilTypeScore =
        getSoilTypeScore(
            soil.soilType
        );

    const infiltrationScore =
        getInfiltrationScore(
            soil.infiltrationRate
        );

    const saturationScore =
        getSaturationScore(
            soil.soilSaturation
        );

    const drainageClassScore =
        getDrainageClassScore(
            soil.drainageClass
        );


    /*
     * Weighted soil score.
     *
     * Soil saturation gets the highest
     * weight because it represents the
     * current ability of the ground to
     * absorb additional rainfall.
     */
    const soilScore =
        soilTypeScore * 0.20 +
        infiltrationScore * 0.30 +
        saturationScore * 0.35 +
        drainageClassScore * 0.15;


    return clamp(soilScore);
}