import {
    Area,
    RiskAssessment,
    WeatherObservation
} from "../models/index.js";

import {
    calculateNeighborFloodPropagation
} from "../engine/neighborFloodPropagation.js";

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

function calculateDistance(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {
    if (
        latitude1 === undefined ||
        longitude1 === undefined ||
        latitude2 === undefined ||
        longitude2 === undefined
    ) {
        return 0;
    }

    const earthRadius = 6371000;

    const dLatitude =
        ((latitude2 - latitude1) * Math.PI) / 180;

    const dLongitude =
        ((longitude2 - longitude1) * Math.PI) / 180;

    const lat1 =
        (latitude1 * Math.PI) / 180;

    const lat2 =
        (latitude2 * Math.PI) / 180;

    const a =
        Math.sin(dLatitude / 2) ** 2 +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLongitude / 2) ** 2;

    return Math.round(
        earthRadius *
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            )
    );
}

function rainfallToScore(weather) {
    const rainfall24h =
        Number(weather?.rainfall24h || 0);

    if (rainfall24h >= 150) return 100;
    if (rainfall24h >= 100) return 80;
    if (rainfall24h >= 75) return 60;
    if (rainfall24h >= 50) return 40;
    if (rainfall24h >= 25) return 20;

    return 0;
}

export async function getNeighboringAreas(areaId) {
    const area = await findArea(areaId);

    let neighbors;

    if (
        Array.isArray(area.neighboringAreas) &&
        area.neighboringAreas.length > 0
    ) {
        neighbors = await Area.find({
            _id: {
                $in: area.neighboringAreas
            },
            isActive: true
        }).lean();
    } else {
        neighbors = await Area.find({
            _id: {
                $ne: area._id
            },
            isActive: true
        }).lean();
    }

    const result = [];

    for (const neighbor of neighbors) {
        const [risk, weather] =
            await Promise.all([
                RiskAssessment.findOne({
                    areaId: neighbor._id
                })
                    .sort({ timestamp: -1 })
                    .lean(),

                WeatherObservation.findOne({
                    areaId: neighbor._id
                })
                    .sort({ observedAt: -1 })
                    .lean()
            ]);

        const distanceMeters =
            calculateDistance(
                area.centroid?.latitude,
                area.centroid?.longitude,
                neighbor.centroid?.latitude,
                neighbor.centroid?.longitude
            );

        result.push({
            areaId: neighbor.areaId,
            name: neighbor.name,
            distanceMeters,
            elevationMeters:
                Number(neighbor.elevationMeters || 0),
            sourceRiskScore:
                Number(risk?.score || 0),
            rainfallScore:
                rainfallToScore(weather)
        });
    }

    return result;
}

export async function getNeighborPropagation(areaId) {
    const area = await findArea(areaId);

    const neighbors =
        await getNeighboringAreas(areaId);

    return calculateNeighborFloodPropagation(
        {
            areaId: area.areaId,
            elevationMeters:
                Number(area.elevationMeters || 0)
        },
        neighbors
    );
}