function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

/*
 * Higher impervious surface means
 * less rainwater can enter the soil.
 */
function getImperviousScore(percent) {
    if (percent == null || percent < 0) {
        return 50;
    }

    return clamp(percent);
}

/*
 * Built-up areas generally increase
 * surface runoff.
 */
function getBuiltUpScore(percent) {
    if (percent == null || percent < 0) {
        return 50;
    }

    return clamp(percent);
}

/*
 * Vegetation reduces runoff and
 * helps water infiltration.
 *
 * Therefore the score is inverted.
 */
function getVegetationScore(percent) {
    if (percent == null || percent < 0) {
        return 50;
    }

    return clamp(100 - percent);
}

/*
 * Open land generally provides more
 * infiltration than built-up land.
 *
 * Therefore the score is inverted.
 */
function getOpenLandScore(percent) {
    if (percent == null || percent < 0) {
        return 50;
    }

    return clamp(100 - percent);
}

/*
 * Roads are generally impervious and
 * can increase surface runoff.
 */
function getRoadScore(percent) {
    if (percent == null || percent < 0) {
        return 50;
    }

    return clamp(percent);
}


/*
 * Main land-use flood-risk calculation.
 */
export function calculateLandUseScore(landUse = {}) {

    const imperviousScore =
        getImperviousScore(
            landUse.imperviousSurfacePercent
        );

    const builtUpScore =
        getBuiltUpScore(
            landUse.builtUpPercent
        );

    const vegetationScore =
        getVegetationScore(
            landUse.vegetationPercent
        );

    const openLandScore =
        getOpenLandScore(
            landUse.openLandPercent
        );

    const roadScore =
        getRoadScore(
            landUse.roadPercent
        );


    /*
     * Weighted land-use score.
     *
     * Impervious surface has the highest
     * influence because it directly reduces
     * infiltration and increases runoff.
     */
    const landUseScore =
        imperviousScore * 0.35 +
        builtUpScore * 0.25 +
        vegetationScore * 0.15 +
        openLandScore * 0.10 +
        roadScore * 0.15;


    return clamp(landUseScore);
}