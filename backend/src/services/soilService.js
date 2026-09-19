import {
    Area,
    SoilData
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

export async function getAreaSoil(areaId) {
    const area = await findArea(areaId);

    return await SoilData.findOne({
        areaId: area._id
    }).lean();
}

export async function getSoilRisk(areaId) {
    const soil = await getAreaSoil(areaId);

    if (!soil) {
        return {
            areaId,
            available: false,
            score: 0
        };
    }

    const saturation =
        Number(soil.soilSaturation || 0);

    const infiltration =
        Number(soil.infiltrationRate || 0);

    /*
     * Higher saturation = higher flood contribution.
     * Lower infiltration = higher flood contribution.
     */

    const saturationScore =
        Math.max(
            0,
            Math.min(100, saturation)
        );

    const infiltrationScore =
        Math.max(
            0,
            Math.min(
                100,
                100 - infiltration
            )
        );

    const score =
        saturationScore * 0.60 +
        infiltrationScore * 0.40;

    return {
        ...soil,
        score: Number(
            Math.max(0, Math.min(100, score)).toFixed(2)
        )
    };
}