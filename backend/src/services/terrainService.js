import {
    Area,
    TerrainData
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

export async function getAreaTerrain(areaId) {
    const area = await findArea(areaId);

    const terrain = await TerrainData.findOne({
        areaId: area._id
    }).lean();

    return terrain;
}

export async function getTerrainRisk(areaId) {
    const terrain =
        await getAreaTerrain(areaId);

    if (!terrain) {
        return {
            areaId,
            available: false,
            score: 0
        };
    }

    /*
     * Terrain indicator:
     * low-lying + slope + floodplain + flow accumulation.
     *
     * This is preparation/normalization for the
     * engine, not a replacement for engine logic.
     */

    const lowLying =
        Number(terrain.lowLyingAreaPercent || 0);

    const slope =
        Number(terrain.slopePercent || 0);

    const floodplain =
        terrain.floodplain === true ? 100 : 0;

    const flowAccumulation =
        Number(terrain.flowAccumulation || 0);

    const slopeRisk =
        Math.max(
            0,
            Math.min(
                100,
                100 - slope * 10
            )
        );

    const flowRisk =
        Math.max(
            0,
            Math.min(100, flowAccumulation)
        );

    const score =
        lowLying * 0.35 +
        slopeRisk * 0.20 +
        floodplain * 0.30 +
        flowRisk * 0.15;

    return {
        ...terrain,
        score: Number(
            Math.max(0, Math.min(100, score)).toFixed(2)
        )
    };
}