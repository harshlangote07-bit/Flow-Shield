import {
    Area,
    LandUseData
} from "../models/index.js";

async function findArea(areaId) {
    const area = await Area.findOne({
        areaId,
        isActive: true
    }).lean();

    if (!area) {
        const error = new Error(`Area not found: ${areaId}`);
        error.statusCode = 404;
        throw error;
    }

    return area;
}

export async function getAreaLandUse(areaId) {
    const area = await findArea(areaId);

    return await LandUseData.findOne({
        areaId: area._id
    }).lean();
}

export async function getLandUseRisk(areaId) {
    const landUse =
        await getAreaLandUse(areaId);

    if (!landUse) {
        return {
            areaId,
            available: false,
            score: 0
        };
    }

    const impervious =
        Number(
            landUse.imperviousSurfacePercent || 0
        );

    const builtUp =
        Number(landUse.builtUpPercent || 0);

    const road =
        Number(landUse.roadPercent || 0);

    const vegetation =
        Number(landUse.vegetationPercent || 0);

    /*
     * Impervious/built-up/road increase runoff.
     * Vegetation reduces runoff.
     */

    const score =
        impervious * 0.50 +
        builtUp * 0.30 +
        road * 0.20 -
        vegetation * 0.20;

    return {
        ...landUse,
        score: Number(
            Math.max(0, Math.min(100, score)).toFixed(2)
        )
    };
}