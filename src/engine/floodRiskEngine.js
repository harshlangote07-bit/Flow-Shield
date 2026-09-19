import { calculateRainfallScore } from "./rainfallScore.js";
import { calculateDrainageScore } from "./drainageScore.js";
import { calculateWaterBodyScore } from "./waterBodyScore.js";
import { predictWaterLevel } from "./waterLevelPrediction.js";
import { calculateTerrainScore } from "./terrainScore.js";
import { calculateSoilScore } from "./soilScore.js";
import { calculateLandUseScore } from "./landUseScore.js";
import { calculateHistoricalScore } from "./historicalScore.js";
import { calculateInteractionBonus } from "./interactionRules.js";
import { calculateConfidence } from "./confidence.js";
import { calculateNeighborFloodPropagation } from "./neighborFloodPropagation.js";

const WEIGHTS = {
    rainfall: 0.30,
    drainage: 0.20,
    waterBody: 0.15,
    terrain: 0.10,
    soil: 0.10,
    landUse: 0.05,
    historical: 0.10
};

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

function getRiskLevel(score) {
    if (score <= 20) return "LOW";
    if (score <= 40) return "MODERATE";
    if (score <= 60) return "HIGH";
    if (score <= 80) return "VERY_HIGH";
    return "CRITICAL";
}

function getMainFactors(components) {
    return Object.entries(components)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, score]) => ({
            name,
            score: Number(score.toFixed(2))
        }));
}

export function calculateFloodRisk(data) {
    const rainfallScore = calculateRainfallScore(data.weather);

    const drainageScore = calculateDrainageScore(
        data.drainage,
        data.officialReports
    );

    const waterBodiesWithPredictions = (
        data.waterBodies || []
    ).map(waterBody => ({
        ...waterBody,
        waterLevelPrediction: predictWaterLevel(
            waterBody,
            data.weather
        )
    }));

    const waterBodyResult = calculateWaterBodyScore(
        waterBodiesWithPredictions
    );

    const terrainScore = calculateTerrainScore(
        data.terrain || {}
    );

    const soilScore = calculateSoilScore(
        data.soil || {}
    );

    const landUseScore = calculateLandUseScore(
        data.landUse || {}
    );

    const historicalScore = calculateHistoricalScore(
        data.history || []
    );

    const components = {
        rainfall: rainfallScore,
        drainage: drainageScore,
        waterBody: waterBodyResult.score,
        terrain: terrainScore,
        soil: soilScore,
        landUse: landUseScore,
        historical: historicalScore
    };

    const baseScore =
        rainfallScore * WEIGHTS.rainfall +
        drainageScore * WEIGHTS.drainage +
        waterBodyResult.score * WEIGHTS.waterBody +
        terrainScore * WEIGHTS.terrain +
        soilScore * WEIGHTS.soil +
        landUseScore * WEIGHTS.landUse +
        historicalScore * WEIGHTS.historical;

    const interactionResult = calculateInteractionBonus({
        rainfall: rainfallScore,
        drainage: drainageScore,
        waterBody: waterBodyResult.score,
        soil: soilScore,
        officialReports: data.officialReports || []
    });

    const neighborResult = calculateNeighborFloodPropagation(
        data.area,
        data.neighboringAreas || []
    );

    const neighborBonus = neighborResult.score * 0.10;

    // Actual calculated severity before normalization.
    const rawScore =
        baseScore +
        interactionResult.bonus +
        neighborBonus;

    // Dashboard score is capped at 100.
    const finalScore = clamp(rawScore);

    const confidence = calculateConfidence(data);

    const roundedScore = Number(
        finalScore.toFixed(2)
    );

    const roundedRawScore = Number(
        rawScore.toFixed(2)
    );

    return {
        areaId: data.area.id,

        timestamp: new Date().toISOString(),

        risk: {
            rawScore: roundedRawScore,
            score: roundedScore,
            level: getRiskLevel(roundedScore),
            confidence
        },

        components: {
            rainfall: Number(rainfallScore.toFixed(2)),
            drainage: Number(drainageScore.toFixed(2)),
            waterBody: Number(waterBodyResult.score.toFixed(2)),
            terrain: Number(terrainScore.toFixed(2)),
            soil: Number(soilScore.toFixed(2)),
            landUse: Number(landUseScore.toFixed(2)),
            historical: Number(historicalScore.toFixed(2))
        },

        calculation: {
            baseScore: Number(baseScore.toFixed(2)),
            interactionBonus: interactionResult.bonus,
            neighborPropagation: Number(
                neighborBonus.toFixed(2)
            ),
            rawScore: roundedRawScore,
            normalizedScore: roundedScore,
            interactions: interactionResult.interactions
        },

        nearbyWaterBodies: waterBodyResult.bodies,

        neighboringAreas: neighborResult.neighbors,

        mainFactors: getMainFactors(components)
    };
}