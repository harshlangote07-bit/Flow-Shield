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


function calculateNetworkImportance(assets) {
    if (!assets || assets.length === 0) {
        return [];
    }

    /*
     * ---------------------------------------------------------
     * Build asset lookup.
     *
     * We support both MongoDB ObjectId references and
     * assetId references.
     * ---------------------------------------------------------
     */
    const assetMap = new Map();

    for (const asset of assets) {
        assetMap.set(String(asset._id), asset);
        assetMap.set(String(asset.assetId), asset);
    }


    function getReferencedAssetId(reference) {
        if (!reference) {
            return null;
        }

        if (typeof reference === "string") {
            return reference;
        }

        if (reference._id) {
            return String(reference._id);
        }

        if (reference.assetId) {
            return String(reference.assetId);
        }

        return String(reference);
    }


    function getConnectedAssets(asset, direction) {
        const references =
            direction === "upstream"
                ? asset.upstreamAssets || []
                : asset.downstreamAssets || [];

        const connected = [];

        for (const reference of references) {
            const referenceId =
                getReferencedAssetId(reference);

            if (!referenceId) {
                continue;
            }

            const connectedAsset =
                assetMap.get(referenceId);

            if (connectedAsset) {
                connected.push(connectedAsset);
            }
        }

        return connected;
    }


    /*
     * ---------------------------------------------------------
     * Count reachable downstream assets.
     *
     * Direct downstream assets matter more than distant ones.
     * ---------------------------------------------------------
     */
    function countDownstreamReach(asset) {
        const visited = new Set();
        const queue = [];

        const directDownstream =
            getConnectedAssets(
                asset,
                "downstream"
            );

        for (const downstream of directDownstream) {
            queue.push({
                asset: downstream,
                depth: 1
            });
        }

        let weightedReach = 0;

        while (queue.length > 0) {
            const current =
                queue.shift();

            const currentId =
                String(current.asset._id);

            if (visited.has(currentId)) {
                continue;
            }

            visited.add(currentId);

            /*
             * Nearby downstream assets have more influence.
             */
            const depthWeight =
                Math.pow(
                    0.70,
                    current.depth - 1
                );

            weightedReach += depthWeight;

            const nextAssets =
                getConnectedAssets(
                    current.asset,
                    "downstream"
                );

            for (const nextAsset of nextAssets) {
                const nextId =
                    String(nextAsset._id);

                if (!visited.has(nextId)) {
                    queue.push({
                        asset: nextAsset,
                        depth:
                            current.depth + 1
                    });
                }
            }
        }

        return weightedReach;
    }


    /*
     * ---------------------------------------------------------
     * Count reachable upstream assets.
     *
     * Upstream connectivity matters, but less than downstream
     * dependency because blockage can affect everything
     * downstream of the asset.
     * ---------------------------------------------------------
     */
    function countUpstreamReach(asset) {
        const visited = new Set();
        const queue = [];

        const directUpstream =
            getConnectedAssets(
                asset,
                "upstream"
            );

        for (const upstream of directUpstream) {
            queue.push({
                asset: upstream,
                depth: 1
            });
        }

        let weightedReach = 0;

        while (queue.length > 0) {
            const current =
                queue.shift();

            const currentId =
                String(current.asset._id);

            if (visited.has(currentId)) {
                continue;
            }

            visited.add(currentId);

            const depthWeight =
                Math.pow(
                    0.50,
                    current.depth - 1
                );

            weightedReach += depthWeight;

            const nextAssets =
                getConnectedAssets(
                    current.asset,
                    "upstream"
                );

            for (const nextAsset of nextAssets) {
                const nextId =
                    String(nextAsset._id);

                if (!visited.has(nextId)) {
                    queue.push({
                        asset: nextAsset,
                        depth:
                            current.depth + 1
                    });
                }
            }
        }

        return weightedReach;
    }


    /*
     * ---------------------------------------------------------
     * Determine the size of the connected network around
     * each asset.
     *
     * This is important because we DON'T want a 2- or 3-pipe
     * network automatically producing importance = 100.
     * ---------------------------------------------------------
     */
    function countConnectedNetwork(asset) {
        const visited = new Set();
        const queue = [asset];

        while (queue.length > 0) {
            const current =
                queue.shift();

            const currentId =
                String(current._id);

            if (visited.has(currentId)) {
                continue;
            }

            visited.add(currentId);

            const upstream =
                getConnectedAssets(
                    current,
                    "upstream"
                );

            const downstream =
                getConnectedAssets(
                    current,
                    "downstream"
                );

            for (const nextAsset of [
                ...upstream,
                ...downstream
            ]) {
                const nextId =
                    String(nextAsset._id);

                if (!visited.has(nextId)) {
                    queue.push(nextAsset);
                }
            }
        }

        return visited.size;
    }


    /*
     * ---------------------------------------------------------
     * Calculate raw importance for each asset.
     * ---------------------------------------------------------
     */
    const rawImportance =
        assets.map(asset => {
            const directUpstream =
                getConnectedAssets(
                    asset,
                    "upstream"
                ).length;

            const directDownstream =
                getConnectedAssets(
                    asset,
                    "downstream"
                ).length;

            const upstreamReach =
                countUpstreamReach(asset);

            const downstreamReach =
                countDownstreamReach(asset);

            const connectedNetworkSize =
                countConnectedNetwork(asset);


            /*
             * A trunk is important, but trunk status alone
             * should NOT make an asset 100.
             */
            const trunkBonus =
                asset.isTrunk === true
                    ? 2
                    : 0;


            /*
             * An asset with meaningful connectivity on both
             * sides acts like a bridge in the network.
             */
            const bridgeBonus =
                directUpstream > 0 &&
                directDownstream > 0
                    ? 2
                    : 0;


            /*
             * Base centrality.
             *
             * Downstream dependency gets the largest influence.
             */
            const rawScore =
                1 +
                directUpstream * 1.5 +
                directDownstream * 2.0 +
                downstreamReach * 2.5 +
                upstreamReach * 0.75 +
                trunkBonus +
                bridgeBonus;


            return {
                asset,

                rawScore,

                directUpstream,

                directDownstream,

                upstreamReach,

                downstreamReach,

                connectedNetworkSize
            };
        });


    /*
     * ---------------------------------------------------------
     * Normalize according to network size.
     *
     * IMPORTANT:
     *
     * 1-3 connected assets:
     *     capped at 70
     *
     * 4 connected assets:
     *     capped at 85
     *
     * 5+ connected assets:
     *     can reach 100
     *
     * This prevents a tiny network from producing a misleading
     * "100 importance" value.
     * ---------------------------------------------------------
     */
    return rawImportance.map(item => {
        const networkSize =
            item.connectedNetworkSize;

        let networkImportance;


        /*
         * Small network.
         */
        if (networkSize <= 3) {
            networkImportance =
                Math.min(
                    70,
                    item.rawScore * 12
                );
        }


        /*
         * Four connected assets.
         */
        else if (networkSize === 4) {
            networkImportance =
                Math.min(
                    85,
                    item.rawScore * 12
                );
        }


        /*
         * Five or more connected assets.
         *
         * Only genuinely central assets should approach 100.
         */
        else {
            networkImportance =
                Math.min(
                    100,
                    item.rawScore * 12
                );
        }


        /*
         * Minimum value prevents a completely isolated or
         * weakly connected pipe from becoming zero.
         */
        networkImportance =
            Math.max(
                10,
                networkImportance
            );


        return {
            ...item.asset,

            networkImportance:
                Number(
                    networkImportance.toFixed(2)
                ),

            networkMetrics: {
                directUpstream:
                    item.directUpstream,

                directDownstream:
                    item.directDownstream,

                upstreamReach:
                    Number(
                        item.upstreamReach.toFixed(2)
                    ),

                downstreamReach:
                    Number(
                        item.downstreamReach.toFixed(2)
                    ),

                connectedNetworkSize:
                    item.connectedNetworkSize,

                isTrunk:
                    item.asset.isTrunk === true
            }
        };
    });
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

            networkWeightedBlockagePercent: 0,
            networkWeightedCapacityUtilizationPercent: 0,
            networkWeightedConditionScore: 0,

            averageNetworkImportance: 0,
            maximumNetworkImportance: 0,

            drainageScore: 0,

            assets: []
        };
    }


    /*
     * ---------------------------------------------------------
     * STEP 1
     *
     * Calculate network importance for every drainage asset.
     * ---------------------------------------------------------
     */
    const networkAssets =
        calculateNetworkImportance(assets);


    /*
     * ---------------------------------------------------------
     * STEP 2
     *
     * Preserve your existing asset classifications.
     * ---------------------------------------------------------
     */

    const blocked =
        networkAssets.filter(
            asset =>
                asset.status === "blocked" ||
                Number(
                    asset.blockagePercent || 0
                ) >= 80
        );


    const partiallyBlocked =
        networkAssets.filter(
            asset =>
                asset.status === "partially_blocked" ||
                (
                    Number(
                        asset.blockagePercent || 0
                    ) >= 30 &&
                    Number(
                        asset.blockagePercent || 0
                    ) < 80
                )
        );


    const failed =
        networkAssets.filter(
            asset =>
                asset.status === "failed"
        );


    const critical =
        networkAssets.filter(
            asset =>
                asset.condition === "critical" ||
                asset.status === "failed"
        );


    const trunks =
        networkAssets.filter(
            asset =>
                asset.isTrunk === true
        );


    const blockedTrunks =
        trunks.filter(
            asset =>
                asset.status === "blocked" ||
                Number(
                    asset.blockagePercent || 0
                ) >= 70
        );


    const operational =
        networkAssets.filter(
            asset =>
                asset.status === "operational"
        );


    /*
     * ---------------------------------------------------------
     * STEP 3
     *
     * Preserve the original averages.
     * ---------------------------------------------------------
     */

    const averageBlockage =
        networkAssets.reduce(
            (sum, asset) =>
                sum +
                Number(
                    asset.blockagePercent || 0
                ),
            0
        ) / total;


    const averageUtilization =
        networkAssets.reduce(
            (sum, asset) =>
                sum +
                Number(
                    asset.capacityUtilizationPercent || 0
                ),
            0
        ) / total;


    const maximumBlockage =
        Math.max(
            ...networkAssets.map(
                asset =>
                    Number(
                        asset.blockagePercent || 0
                    )
            )
        );


    /*
     * ---------------------------------------------------------
     * STEP 4
     *
     * Calculate total network importance.
     * ---------------------------------------------------------
     */

    const totalImportance =
        networkAssets.reduce(
            (sum, asset) =>
                sum +
                Number(
                    asset.networkImportance || 0
                ),
            0
        );


    /*
     * ---------------------------------------------------------
     * STEP 5
     *
     * Network-weighted blockage.
     *
     * A central pipe therefore matters more than an isolated
     * pipe with the same blockage percentage.
     * ---------------------------------------------------------
     */

    const weightedBlockage =
        networkAssets.reduce(
            (sum, asset) =>
                sum +
                (
                    Number(
                        asset.blockagePercent || 0
                    ) *
                    Number(
                        asset.networkImportance || 0
                    )
                ),
            0
        );


    const networkWeightedBlockagePercent =
        totalImportance > 0
            ? weightedBlockage /
              totalImportance
            : averageBlockage;


    /*
     * ---------------------------------------------------------
     * STEP 6
     *
     * Network-weighted capacity utilization.
     * ---------------------------------------------------------
     */

    const weightedUtilization =
        networkAssets.reduce(
            (sum, asset) =>
                sum +
                (
                    Number(
                        asset.capacityUtilizationPercent || 0
                    ) *
                    Number(
                        asset.networkImportance || 0
                    )
                ),
            0
        );


    const networkWeightedCapacityUtilizationPercent =
        totalImportance > 0
            ? weightedUtilization /
              totalImportance
            : averageUtilization;


    /*
     * ---------------------------------------------------------
     * STEP 7
     *
     * Network-weighted condition.
     * ---------------------------------------------------------
     */

    function getConditionScore(condition) {
        switch (
            String(condition || "").toLowerCase()
        ) {
            case "excellent":
                return 0;

            case "good":
                return 20;

            case "fair":
                return 50;

            case "poor":
                return 75;

            case "critical":
                return 100;

            default:
                return 50;
        }
    }


    const weightedCondition =
        networkAssets.reduce(
            (sum, asset) =>
                sum +
                (
                    getConditionScore(
                        asset.condition
                    ) *
                    Number(
                        asset.networkImportance || 0
                    )
                ),
            0
        );


    const networkWeightedConditionScore =
        totalImportance > 0
            ? weightedCondition /
              totalImportance
            : 50;


    /*
     * ---------------------------------------------------------
     * STEP 8
     *
     * Existing structural drainage score.
     *
     * We preserve the old classification behavior.
     * ---------------------------------------------------------
     */

    const blockedRatio =
        blocked.length / total;


    const partialRatio =
        partiallyBlocked.length / total;


    const trunkRatio =
        trunks.length === 0
            ? 0
            : blockedTrunks.length /
              trunks.length;


    const structuralDrainageScore =
        (
            blockedRatio * 60 +
            partialRatio * 25 +
            trunkRatio * 15
        );


    /*
     * ---------------------------------------------------------
     * STEP 9
     *
     * Network influence.
     *
     * IMPORTANT:
     *
     * Network importance is NOT allowed to dominate the
     * drainage score.
     *
     * This is deliberately a refinement rather than a
     * "flood guaranteed" multiplier.
     * ---------------------------------------------------------
     */

    const networkBlockageInfluence =
        Math.min(
            100,
            networkWeightedBlockagePercent
        );


    const networkCapacityInfluence =
        Math.min(
            100,
            networkWeightedCapacityUtilizationPercent
        );


    const networkConditionInfluence =
        Math.min(
            100,
            networkWeightedConditionScore
        );


    /*
     * ---------------------------------------------------------
     * STEP 10
     *
     * Final network-aware drainage score.
     *
     * 70% = existing structural drainage state
     * 15% = network-weighted blockage
     * 10% = network-weighted capacity
     * 5%  = network-weighted condition
     *
     * Therefore network importance can influence the result,
     * but it cannot independently cause a huge jump.
     * ---------------------------------------------------------
     */

    const drainageScore =
        Math.min(
            100,
            (
                structuralDrainageScore * 0.70 +
                networkBlockageInfluence * 0.15 +
                networkCapacityInfluence * 0.10 +
                networkConditionInfluence * 0.05
            )
        );


    /*
     * ---------------------------------------------------------
     * STEP 11
     *
     * Aggregate network statistics.
     * ---------------------------------------------------------
     */

    const averageNetworkImportance =
        totalImportance / total;


    const maximumNetworkImportance =
        Math.max(
            ...networkAssets.map(
                asset =>
                    Number(
                        asset.networkImportance || 0
                    )
            )
        );


    /*
     * ---------------------------------------------------------
     * STEP 12
     *
     * Return existing fields PLUS network information.
     * ---------------------------------------------------------
     */

    return {
        totalAssets: total,

        blockedAssets:
            blocked.length,

        partiallyBlockedAssets:
            partiallyBlocked.length,

        operationalAssets:
            operational.length,

        failedAssets:
            failed.length,

        criticalAssets:
            critical.length,

        trunkAssets:
            trunks.length,

        blockedTrunkAssets:
            blockedTrunks.length,

        averageBlockagePercent:
            Number(
                averageBlockage.toFixed(2)
            ),

        averageCapacityUtilizationPercent:
            Number(
                averageUtilization.toFixed(2)
            ),

        maximumBlockagePercent:
            Number(
                maximumBlockage.toFixed(2)
            ),

        networkWeightedBlockagePercent:
            Number(
                networkWeightedBlockagePercent.toFixed(2)
            ),

        networkWeightedCapacityUtilizationPercent:
            Number(
                networkWeightedCapacityUtilizationPercent.toFixed(2)
            ),

        networkWeightedConditionScore:
            Number(
                networkWeightedConditionScore.toFixed(2)
            ),

        averageNetworkImportance:
            Number(
                averageNetworkImportance.toFixed(2)
            ),

        maximumNetworkImportance:
            Number(
                maximumNetworkImportance.toFixed(2)
            ),

        drainageScore:
            Number(
                drainageScore.toFixed(2)
            ),

        assets:
            networkAssets
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