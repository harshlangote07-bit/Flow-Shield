import {
    Area,
    DrainageAsset,
    DrainageReport
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

async function getAssets(areaMongoId) {
    return await DrainageAsset.find({
        areaId: areaMongoId,
        isActive: true
    })
        .populate(
            "upstreamAssets",
            "assetId assetType blockagePercent capacityUtilizationPercent status elevationMeters"
        )
        .populate(
            "downstreamAssets",
            "assetId assetType blockagePercent capacityUtilizationPercent status elevationMeters"
        )
        .lean();
}

function calculateDrainageMetrics(assets) {
    const totalAssets = assets.length;

    if (totalAssets === 0) {
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
            drainageScore: 0
        };
    }

    const blockedAssets = assets.filter(
        asset =>
            asset.status === "blocked" ||
            Number(asset.blockagePercent || 0) >= 80
    );

    const partiallyBlockedAssets = assets.filter(
        asset =>
            asset.status === "partially_blocked" ||
            (
                Number(asset.blockagePercent || 0) >= 30 &&
                Number(asset.blockagePercent || 0) < 80
            )
    );

    const failedAssets = assets.filter(
        asset => asset.status === "failed"
    );

    const criticalAssets = assets.filter(
        asset =>
            asset.condition === "critical" ||
            asset.status === "failed"
    );

    const trunkAssets = assets.filter(
        asset => asset.isTrunk === true
    );

    const blockedTrunkAssets = trunkAssets.filter(
        asset =>
            asset.status === "blocked" ||
            Number(asset.blockagePercent || 0) >= 70
    );

    const operationalAssets = assets.filter(
        asset => asset.status === "operational"
    );

    const totalBlockage = assets.reduce(
        (sum, asset) =>
            sum + Number(asset.blockagePercent || 0),
        0
    );

    const totalUtilization = assets.reduce(
        (sum, asset) =>
            sum +
            Number(asset.capacityUtilizationPercent || 0),
        0
    );

    const averageBlockagePercent =
        totalBlockage / totalAssets;

    const averageCapacityUtilizationPercent =
        totalUtilization / totalAssets;

    const maximumBlockagePercent = Math.max(
        ...assets.map(asset =>
            Number(asset.blockagePercent || 0)
        )
    );

    /*
     * This is an INPUT indicator for the engine,
     * not a replacement for the engine's drainage formula.
     *
     * Blocked trunk assets receive higher importance.
     */
    const blockedRatio =
        blockedAssets.length / totalAssets;

    const partialRatio =
        partiallyBlockedAssets.length / totalAssets;

    const trunkRatio =
        trunkAssets.length === 0
            ? 0
            : blockedTrunkAssets.length / trunkAssets.length;

    const drainageScore = Math.min(
        100,
        (
            blockedRatio * 60 +
            partialRatio * 25 +
            trunkRatio * 15
        )
    );

    return {
        totalAssets,
        blockedAssets: blockedAssets.length,
        partiallyBlockedAssets:
            partiallyBlockedAssets.length,
        operationalAssets: operationalAssets.length,
        failedAssets: failedAssets.length,
        criticalAssets: criticalAssets.length,
        trunkAssets: trunkAssets.length,
        blockedTrunkAssets: blockedTrunkAssets.length,
        averageBlockagePercent,
        averageCapacityUtilizationPercent,
        maximumBlockagePercent,
        drainageScore
    };
}

export async function getAreaDrainage(areaId) {
    const area = await findArea(areaId);
    const assets = await getAssets(area._id);

    const reports = await DrainageReport.find({
        areaId: area._id
    })
        .sort({ reportedAt: -1 })
        .limit(50)
        .lean();

    return {
        areaId: area.areaId,
        areaName: area.name,
        assets,
        reports,
        metrics: calculateDrainageMetrics(assets)
    };
}

export async function getAreaDrainageRisk(areaId) {
    const area = await findArea(areaId);
    const assets = await getAssets(area._id);

    return {
        areaId: area.areaId,
        areaName: area.name,
        ...calculateDrainageMetrics(assets)
    };
}

export async function getDrainageReports(areaId) {
    const area = await findArea(areaId);

    return await DrainageReport.find({
        areaId: area._id
    })
        .sort({ reportedAt: -1 })
        .lean();
}

export async function updateDrainageAsset(assetId, data) {
    const allowedFields = [
        "blockagePercent",
        "capacityUtilizationPercent",
        "condition",
        "status",
        "lastInspectedAt",
        "lastUpdatedBy"
    ];

    const update = {};

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            update[field] = data[field];
        }
    }

    update.lastUpdatedAt = new Date();

    const asset = await DrainageAsset.findOneAndUpdate(
        {
            assetId,
            isActive: true
        },
        {
            $set: update
        },
        {
            new: true,
            runValidators: true
        }
    ).lean();

    if (!asset) {
        const error = new Error(
            `Drainage asset not found: ${assetId}`
        );
        error.statusCode = 404;
        throw error;
    }

    return asset;
}