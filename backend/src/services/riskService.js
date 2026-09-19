import {
    Area,
    WeatherObservation,
    WeatherForecast,
    DrainageAsset,
    WaterBody,
    WaterLevelObservation,
    TerrainData,
    SoilData,
    LandUseData,
    FloodHistory,
    OfficialWaterloggingReport,
    RiskAssessment
} from "../models/index.js";

import { calculateFloodRisk } from "../engine/floodRiskEngine.js";

import {
    getNeighboringAreas
} from "./neighborService.js";


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


function buildDrainageInput(assets) {
    const total = assets.length;

    if (total === 0) {
        return {
            totalAssets: 0,
            blockedAssets: 0,
            partiallyBlockedAssets: 0,
            operationalAssets: 0,
            failedAssets: 0,
            criticalAssets: 0,
            trunkAssets: 0,
            blockedTrunkAssets: 0,
            averageBlockagePercent: 0,
            averageCapacityUtilizationPercent: 0,
            maximumBlockagePercent: 0,
            drainageScore: 0,
            assets: []
        };
    }

    const blocked = assets.filter(
        asset =>
            asset.status === "blocked" ||
            Number(asset.blockagePercent || 0) >= 80
    );

    const partiallyBlocked = assets.filter(
        asset =>
            asset.status === "partially_blocked" ||
            (
                Number(asset.blockagePercent || 0) >= 30 &&
                Number(asset.blockagePercent || 0) < 80
            )
    );

    const failed = assets.filter(
        asset => asset.status === "failed"
    );

    const critical = assets.filter(
        asset =>
            asset.condition === "critical" ||
            asset.status === "failed"
    );

    const trunks = assets.filter(
        asset => asset.isTrunk === true
    );

    const blockedTrunks = trunks.filter(
        asset =>
            asset.status === "blocked" ||
            Number(asset.blockagePercent || 0) >= 70
    );

    const operational = assets.filter(
        asset => asset.status === "operational"
    );

    const averageBlockage =
        assets.reduce(
            (sum, asset) =>
                sum +
                Number(asset.blockagePercent || 0),
            0
        ) / total;

    const averageUtilization =
        assets.reduce(
            (sum, asset) =>
                sum +
                Number(
                    asset.capacityUtilizationPercent || 0
                ),
            0
        ) / total;

    const maximumBlockage =
        Math.max(
            ...assets.map(asset =>
                Number(asset.blockagePercent || 0)
            )
        );

    return {
        totalAssets: total,
        blockedAssets: blocked.length,
        partiallyBlockedAssets:
            partiallyBlocked.length,
        operationalAssets: operational.length,
        failedAssets: failed.length,
        criticalAssets: critical.length,
        trunkAssets: trunks.length,
        blockedTrunkAssets: blockedTrunks.length,
        averageBlockagePercent: averageBlockage,
        averageCapacityUtilizationPercent:
            averageUtilization,
        maximumBlockagePercent: maximumBlockage,

        drainageScore: Math.min(
            100,
            (
                (blocked.length / total) * 60 +
                (partiallyBlocked.length / total) * 25 +
                (
                    trunks.length === 0
                        ? 0
                        : (blockedTrunks.length / trunks.length) * 15
                )
            )
        ),

        assets
    };
}


/*
 * Convert MongoDB water-body documents into the
 * structure required by the existing flood-risk engine.
 *
 * IMPORTANT:
 * The physical parameters below are required by
 * waterLevelPrediction.js.
 */
function buildWaterBodyInput(waterBodies) {
    return waterBodies.map(waterBody => {
        const latest = waterBody.latestObservation;

        const currentLevel = Number(
            latest?.waterLevelMeters ??
            waterBody.currentWaterLevelMeters ??
            0
        );

        const surfaceAreaM2 = Number(
            waterBody.surfaceAreaM2 ?? 0
        );

        const catchmentAreaM2 = Number(
            waterBody.catchmentAreaM2 ?? 0
        );

        const runoffCoefficient = Number(
            waterBody.runoffCoefficient ?? 0
        );

        const normalWaterLevelMeters = Number(
            waterBody.normalWaterLevelMeters ?? 0
        );

        const dangerWaterLevelMeters = Number(
            waterBody.dangerWaterLevelMeters ?? 0
        );

        const maximumWaterLevelMeters = Number(
            waterBody.maximumWaterLevelMeters ?? 0
        );

        const inflowM3PerSecond = Number(
            waterBody.inflowM3PerSecond ?? 0
        );

        const outflowM3PerSecond = Number(
            waterBody.outflowM3PerSecond ?? 0
        );

        const drainageInflowM3PerSecond = Number(
            waterBody.drainageInflowM3PerSecond ?? 0
        );

        const evaporationMmPerHour = Number(
            waterBody.evaporationMmPerHour ?? 0
        );

        let capacityPercent =
            latest?.capacityPercent;

        if (
            capacityPercent === undefined &&
            maximumWaterLevelMeters > 0
        ) {
            capacityPercent =
                (currentLevel / maximumWaterLevelMeters) * 100;
        }

        capacityPercent = Math.max(
            0,
            Math.min(
                100,
                Number(capacityPercent ?? 0)
            )
        );

        return {
            id: String(waterBody._id),

            waterBodyId:
                waterBody.waterBodyId,

            name:
                waterBody.name,

            type:
                waterBody.type,

            distanceMeters:
                Number(waterBody.distanceMeters ?? 0),

            areaKm2:
                Number(waterBody.areaKm2 ?? 0),

            surfaceAreaM2,

            catchmentAreaM2,

            runoffCoefficient,

            currentWaterLevelMeters:
                currentLevel,

            normalWaterLevelMeters,

            dangerWaterLevelMeters,

            maximumWaterLevelMeters,

            inflowM3PerSecond,

            outflowM3PerSecond,

            drainageInflowM3PerSecond,

            evaporationMmPerHour,

            drainageConnected:
                Boolean(waterBody.drainageConnected),

            historicalOverflow:
                Boolean(waterBody.historicalOverflow),

            overflowRisk:
                waterBody.overflowRisk || "unknown",

            waterLevelPercent:
                capacityPercent,

            latestObservation:
                latest || null,

            contribution: 0
        };
    });
}


function buildHistoricalInput(history) {
    const severe = history.filter(event =>
        [
            "SEVERE",
            "CRITICAL",
            "EXTREME"
        ].includes(
            String(event.severity).toUpperCase()
        )
    );

    return {
        eventCount: history.length,

        severeEventCount:
            severe.length,

        averageRainfall24h:
            history.length === 0
                ? 0
                : history.reduce(
                      (sum, event) =>
                          sum +
                          Number(
                              event.rainfall24h || 0
                          ),
                      0
                  ) / history.length,

        recentEvents:
            history
    };
}


function buildMainFactors(components = {}) {
    return Object.entries(components)
        .map(([name, score]) => ({
            name,
            score: Number(score || 0)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
}


function getLevel(score) {
    const value = Number(score || 0);

    if (value <= 20) return "LOW";
    if (value <= 40) return "MODERATE";
    if (value <= 60) return "HIGH";
    if (value <= 80) return "VERY_HIGH";

    return "CRITICAL";
}


export async function calculateAreaRisk(areaId) {
    const area = await findArea(areaId);

    /*
     * Fetch all independent data in parallel.
     */
    const [
        weather,
        forecast,
        drainageAssets,
        waterBodies,
        terrain,
        soil,
        landUse,
        history,
        waterloggingReports,
        neighboringAreas
    ] = await Promise.all([
        WeatherObservation.findOne({
            areaId: area._id
        })
            .sort({ observedAt: -1 })
            .lean(),

        WeatherForecast.findOne({
            areaId: area._id
        })
            .sort({ forecastGeneratedAt: -1 })
            .lean(),

        DrainageAsset.find({
            areaId: area._id,
            isActive: true
        }).lean(),

        WaterBody.find({
            areaId: area._id,
            isActive: true
        }).lean(),

        TerrainData.findOne({
            areaId: area._id
        }).lean(),

        SoilData.findOne({
            areaId: area._id
        }).lean(),

        LandUseData.findOne({
            areaId: area._id
        }).lean(),

        FloodHistory.find({
            areaId: area._id
        })
            .sort({ eventDate: -1 })
            .limit(50)
            .lean(),

        OfficialWaterloggingReport.find({
            areaId: area._id,
            verified: true
        })
            .sort({ reportedAt: -1 })
            .limit(50)
            .lean(),

        getNeighboringAreas(areaId)
    ]);


    /*
     * Fetch the latest water-level observation
     * for every water body.
     */
    const waterBodiesWithLevels =
        await Promise.all(
            waterBodies.map(async waterBody => {
                const latest =
                    await WaterLevelObservation.findOne({
                        waterBodyId: waterBody._id
                    })
                        .sort({ observedAt: -1 })
                        .lean();

                return {
                    ...waterBody,
                    latestObservation: latest
                };
            })
        );


    const drainage =
        buildDrainageInput(drainageAssets);

    const waterBodyInput =
        buildWaterBodyInput(
            waterBodiesWithLevels
        );

    const historical =
        buildHistoricalInput(history);


    /*
     * Assemble all MongoDB/API data into the
     * existing flood-risk engine input.
     */
    const engineInput = {
        area: {
            areaId:
                area.areaId,

            name:
                area.name,

            elevationMeters:
                Number(
                    area.elevationMeters || 0
                ),

            centroid:
                area.centroid,

            neighboringAreas:
                area.neighboringAreas || []
        },

        weather:
            weather || {},

        weatherForecast:
            forecast || {},

        rainfall:
            weather || {},

        drainage,

        drainageAssets,

        waterBodies:
            waterBodyInput,

        terrain:
            terrain || {},

        soil:
            soil || {},

        landUse:
            landUse || {},

        historical,

        floodHistory:
            history,

        officialWaterloggingReports:
            waterloggingReports,

        neighboringAreas,

        timestamp:
            new Date()
    };


    /*
     * Existing flood-risk engine.
     * Do not duplicate risk formulas here.
     */
    const result =
        calculateFloodRisk(
            engineInput
        );


    const score =
        Number(
            result.score ??
            result.normalizedScore ??
            result.calculation?.normalizedScore ??
            0
        );

    const rawScore =
        Number(
            result.rawScore ??
            result.calculation?.rawScore ??
            score
        );

    const level =
        result.level ||
        getLevel(score);


    const assessment =
        await RiskAssessment.create({
            areaId:
                area._id,

            timestamp:
                new Date(),

            rawScore,

            score:
                Math.max(
                    0,
                    Math.min(
                        100,
                        score
                    )
                ),

            level,

            confidence:
                Number(
                    result.confidence || 0
                ),

            components:
                result.components || {},

            calculation:
                result.calculation || {
                    baseScore: 0,
                    interactionBonus: 0,
                    neighborPropagation: 0,
                    rawScore,
                    normalizedScore: score,
                    interactions: []
                },

            nearbyWaterBodies:
                result.nearbyWaterBodies ||
                waterBodyInput,

            neighboringAreas:
                result.neighboringAreas ||
                neighboringAreas,

            mainFactors:
                result.mainFactors ||
                buildMainFactors(
                    result.components
                )
        });


    return {
        assessment:
            assessment.toObject(),

        area: {
            areaId:
                area.areaId,

            name:
                area.name,

            city:
                area.city,

            state:
                area.state,

            centroid:
                area.centroid,

            elevationMeters:
                area.elevationMeters
        },

        inputSummary: {
            weatherAvailable:
                Boolean(weather),

            forecastAvailable:
                Boolean(forecast),

            drainageAssets:
                drainageAssets.length,

            waterBodies:
                waterBodies.length,

            terrainAvailable:
                Boolean(terrain),

            soilAvailable:
                Boolean(soil),

            landUseAvailable:
                Boolean(landUse),

            historicalEvents:
                history.length,

            verifiedWaterloggingReports:
                waterloggingReports.length,

            neighboringAreas:
                neighboringAreas.length
        }
    };
}


export async function getLatestAreaRisk(areaId) {
    const area =
        await findArea(areaId);

    return await RiskAssessment.findOne({
        areaId: area._id
    })
        .sort({
            timestamp: -1
        })
        .lean();
}


export async function getAreaRiskHistory(
    areaId,
    limit = 50
) {
    const area =
        await findArea(areaId);

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 50,
                1
            ),
            200
        );

    return await RiskAssessment.find({
        areaId: area._id
    })
        .sort({
            timestamp: -1
        })
        .limit(safeLimit)
        .lean();
}


export async function getAllAreaRisks() {
    const areas =
        await Area.find({
            isActive: true
        })
            .sort({
                name: 1
            })
            .lean();

    const results =
        await Promise.all(
            areas.map(async area => {
                const risk =
                    await RiskAssessment.findOne({
                        areaId: area._id
                    })
                        .sort({
                            timestamp: -1
                        })
                        .lean();

                return {
                    areaId:
                        area.areaId,

                    areaName:
                        area.name,

                    city:
                        area.city,

                    state:
                        area.state,

                    centroid:
                        area.centroid,

                    risk
                };
            })
        );

    return results;
}