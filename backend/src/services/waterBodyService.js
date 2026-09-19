import {
    WaterBody,
    WaterLevelObservation,
    Area
} from "../models/index.js";


/*
|--------------------------------------------------------------------------
| Get all active water bodies for an area
|--------------------------------------------------------------------------
*/
export async function getWaterBodies(areaId) {
    if (!areaId) {
        const error = new Error("Area ID is required.");
        error.statusCode = 400;
        throw error;
    }

    const area = await Area.findOne({ areaId }).lean();

    if (!area) {
        const error = new Error(`Area not found: ${areaId}`);
        error.statusCode = 404;
        throw error;
    }

    return await WaterBody.find({
        areaId: area._id,
        isActive: true
    })
        .sort({ name: 1 })
        .lean();
}


/*
|--------------------------------------------------------------------------
| Get one water body
|--------------------------------------------------------------------------
*/
export async function getWaterBodyById(waterBodyId) {
    if (!waterBodyId) {
        const error = new Error("Water body ID is required.");
        error.statusCode = 400;
        throw error;
    }

    return await WaterBody.findOne({
        waterBodyId,
        isActive: true
    }).lean();
}


/*
|--------------------------------------------------------------------------
| Create water body
|--------------------------------------------------------------------------
*/
export async function createWaterBody(data) {
    if (!data || typeof data !== "object") {
        const error = new Error("Water body data is required.");
        error.statusCode = 400;
        throw error;
    }

    return await WaterBody.create(data);
}


/*
|--------------------------------------------------------------------------
| Update water body
|--------------------------------------------------------------------------
*/
export async function updateWaterBody(waterBodyId, data) {
    if (!waterBodyId) {
        const error = new Error("Water body ID is required.");
        error.statusCode = 400;
        throw error;
    }

    if (!data || typeof data !== "object") {
        const error = new Error("Update data is required.");
        error.statusCode = 400;
        throw error;
    }

    const updated = await WaterBody.findOneAndUpdate(
        {
            waterBodyId,
            isActive: true
        },
        {
            $set: data
        },
        {
            new: true,
            runValidators: true
        }
    ).lean();

    if (!updated) {
        const error = new Error(`Water body not found: ${waterBodyId}`);
        error.statusCode = 404;
        throw error;
    }

    return updated;
}


/*
|--------------------------------------------------------------------------
| Get latest water-level observation
|--------------------------------------------------------------------------
*/
export async function getLatestWaterLevel(waterBodyId) {
    if (!waterBodyId) {
        const error = new Error("Water body ID is required.");
        error.statusCode = 400;
        throw error;
    }

    const waterBody = await WaterBody.findOne({
        waterBodyId,
        isActive: true
    }).lean();

    if (!waterBody) {
        const error = new Error(`Water body not found: ${waterBodyId}`);
        error.statusCode = 404;
        throw error;
    }

    return await WaterLevelObservation.findOne({
        waterBodyId: waterBody._id
    })
        .sort({ observedAt: -1 })
        .lean();
}


/*
|--------------------------------------------------------------------------
| Get water-level history
|--------------------------------------------------------------------------
*/
export async function getWaterLevelHistory(
    waterBodyId,
    limit = 50
) {
    if (!waterBodyId) {
        const error = new Error("Water body ID is required.");
        error.statusCode = 400;
        throw error;
    }

    const parsedLimit = Number(limit);

    if (
        !Number.isFinite(parsedLimit) ||
        parsedLimit <= 0
    ) {
        const error = new Error("Limit must be a positive number.");
        error.statusCode = 400;
        throw error;
    }

    const waterBody = await WaterBody.findOne({
        waterBodyId,
        isActive: true
    }).lean();

    if (!waterBody) {
        const error = new Error(`Water body not found: ${waterBodyId}`);
        error.statusCode = 404;
        throw error;
    }

    return await WaterLevelObservation.find({
        waterBodyId: waterBody._id
    })
        .sort({ observedAt: -1 })
        .limit(Math.floor(parsedLimit))
        .lean();
}


/*
|--------------------------------------------------------------------------
| Add water-level observation
|--------------------------------------------------------------------------
*/
export async function addWaterLevelObservation(data) {
    if (!data || typeof data !== "object") {
        const error = new Error(
            "Water-level observation data is required."
        );

        error.statusCode = 400;
        throw error;
    }

    return await WaterLevelObservation.create(data);
}


/*
|--------------------------------------------------------------------------
| Get water-body risk/input data for an area
|--------------------------------------------------------------------------
|
| This service does NOT replace the flood-risk engine.
| It only prepares the water-body information that the engine/service
| layer needs.
|
|--------------------------------------------------------------------------
*/
export async function getAreaWaterBodyRisk(areaId) {
    const waterBodies = await getWaterBodies(areaId);

    const results = [];

    for (const waterBody of waterBodies) {
        const latest = await WaterLevelObservation.findOne({
            waterBodyId: waterBody._id
        })
            .sort({ observedAt: -1 })
            .lean();

        let currentCapacityPercent = 0;

        /*
        |--------------------------------------------------------------
        | Prefer the latest observed capacity percentage
        |--------------------------------------------------------------
        */
        if (
            latest &&
            latest.capacityPercent !== null &&
            latest.capacityPercent !== undefined &&
            Number.isFinite(Number(latest.capacityPercent))
        ) {
            currentCapacityPercent = Number(
                latest.capacityPercent
            );
        } else {
            /*
            |----------------------------------------------------------
            | Otherwise derive percentage from current/max level
            |----------------------------------------------------------
            */
            const currentLevel = Number(
                waterBody.currentWaterLevelMeters
            );

            const maximumLevel = Number(
                waterBody.maximumWaterLevelMeters
            );

            if (
                Number.isFinite(currentLevel) &&
                Number.isFinite(maximumLevel) &&
                maximumLevel > 0
            ) {
                currentCapacityPercent =
                    (currentLevel / maximumLevel) * 100;
            }
        }

        results.push({
            ...waterBody,

            latestObservation: latest || null,

            currentCapacityPercent:
                Number(currentCapacityPercent.toFixed(2))
        });
    }

    return results;
}


/*
|--------------------------------------------------------------------------
| Controller compatibility aliases
|--------------------------------------------------------------------------
|
| Existing waterBodyController.js imports:
|
| getAreaWaterBodies
| getWaterBodyRisk
|
| Keep those names available without changing the controller.
|--------------------------------------------------------------------------
*/

export const getAreaWaterBodies = getWaterBodies;

export const getWaterBodyRisk = getAreaWaterBodyRisk;