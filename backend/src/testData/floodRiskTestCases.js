// src/testData/floodRiskTestCases.js

/*
 * FOUR FLOOD-RISK TEST CASES
 *
 * Target raw-score ranges:
 *
 * CASE_1 -> ~20   LOW
 * CASE_2 -> ~50   HIGH
 * CASE_3 -> ~100  CRITICAL
 * CASE_4 -> ~150  EXTREME RAW SEVERITY
 *
 * The exact score is produced by the engine.
 */

function createWeather({
    rainfallIntensity,
    rainfall1h,
    rainfall3h,
    rainfall6h,
    rainfall24h,
    precipitationProbability,
    forecast1h,
    forecast3h,
    forecast6h
}) {
    return {
        rainfallIntensity,
        rainfall1h,
        rainfall3h,
        rainfall6h,
        rainfall24h,

        precipitationProbability,

        forecast1h,
        forecast3h,
        forecast6h,

        temperature: 25,
        humidity: 70,
        pressure: 1012,
        windSpeed: 10,

        observedAt: "2026-09-19T18:30:00.000Z"
    };
}


/*
 * ============================================================
 * CASE 1
 * LOW RISK
 * ============================================================
 */

const LOW_RISK = {

    area: {
        id: "TEST_LOW",
        name: "Low Risk Area",

        elevationMeters: 850,

        latitude: 12.9716,
        longitude: 77.5946,

        areaKm2: 4.5
    },

    weather: createWeather({
        rainfallIntensity: 3,

        rainfall1h: 4,
        rainfall3h: 8,
        rainfall6h: 12,
        rainfall24h: 20,

        precipitationProbability: 20,

        forecast1h: 3,
        forecast3h: 7,
        forecast6h: 12
    }),

    drainage: {
        blockagePercent: 5,

        capacityUtilizationPercent: 25,

        condition: "excellent",

        drainageDensity: 5,

        totalDrainageLengthKm: 22,

        designCapacityM3PerSecond: 180,

        currentFlowM3PerSecond: 40,

        lastMaintenanceDate: "2026-09-10",

        maintenanceOverdue: false
    },

    officialReports: [],

    waterBodies: [
        {
            id: "LOW_WB_001",

            name: "Low Risk Lake",

            type: "lake",

            distanceMeters: 3500,

            areaKm2: 1.2,

            waterLevelPercent: 30,

            overflowRisk: "low",

            historicalOverflow: false,

            drainageConnected: false,

            currentWaterLevelMeters: 2.0,

            normalWaterLevelMeters: 3.0,

            dangerWaterLevelMeters: 5.0,

            maximumWaterLevelMeters: 6.0,

            surfaceAreaM2: 1200000,

            catchmentAreaM2: 3000000,

            runoffCoefficient: 0.30,

            inflowM3PerSecond: 3,

            outflowM3PerSecond: 5,

            evaporationMmPerHour: 0.1,

            overflowRateM3PerSecond: 20,

            drainageInflowM3PerSecond: 0
        }
    ],

    terrain: {
        elevationMeters: 850,

        elevationMinMeters: 820,

        elevationMaxMeters: 900,

        elevationMeanMeters: 850,

        slopePercent: 6,

        slopeMaxPercent: 10,

        lowLyingAreaPercent: 10,

        flowAccumulation: 15,

        drainageDirection: "south-east",

        floodplain: false,

        floodplainPercent: 0,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    soil: {
        soilType: "sand",

        infiltrationRate: 30,

        permeability: "high",

        drainageClass: "well",

        soilSaturation: 15,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    landUse: {
        builtUpPercent: 20,

        imperviousSurfacePercent: 15,

        vegetationPercent: 55,

        openLandPercent: 30,

        roadPercent: 10,

        landuseType: "mixed",

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    history: [],

    neighboringAreas: [
        {
            areaId: "LOW_NEIGHBOR",

            name: "Low Risk Neighbor",

            distanceMeters: 2500,

            elevationMeters: 800,

            flowDirection: "downstream",

            sourceRiskScore: 10,

            weather: {
                rainfall1h: 3,
                rainfall3h: 7,
                rainfall6h: 10,
                rainfall24h: 18,

                forecast1h: 2,
                forecast3h: 5,
                forecast6h: 8
            }
        }
    ]
};


/*
 * ============================================================
 * CASE 2
 * MODERATE / HIGH RISK
 * ============================================================
 */

const MEDIUM_RISK = {

    area: {
        id: "TEST_MEDIUM",
        name: "Medium Risk Area",

        elevationMeters: 700,

        latitude: 12.975,
        longitude: 77.600,

        areaKm2: 5.0
    },

    weather: createWeather({
        rainfallIntensity: 15,

        rainfall1h: 20,
        rainfall3h: 42,
        rainfall6h: 65,
        rainfall24h: 100,

        precipitationProbability: 55,

        forecast1h: 15,
        forecast3h: 35,
        forecast6h: 55
    }),

    drainage: {
        blockagePercent: 30,

        capacityUtilizationPercent: 55,

        condition: "fair",

        drainageDensity: 3,

        totalDrainageLengthKm: 15,

        designCapacityM3PerSecond: 140,

        currentFlowM3PerSecond: 85,

        lastMaintenanceDate: "2026-07-10",

        maintenanceOverdue: false
    },

    officialReports: [],

    waterBodies: [
        {
            id: "MEDIUM_WB_001",

            name: "Medium Risk Lake",

            type: "lake",

            distanceMeters: 1800,

            areaKm2: 2.0,

            waterLevelPercent: 55,

            overflowRisk: "moderate",

            historicalOverflow: false,

            drainageConnected: true,

            currentWaterLevelMeters: 3.2,

            normalWaterLevelMeters: 3.0,

            dangerWaterLevelMeters: 4.5,

            maximumWaterLevelMeters: 6.0,

            surfaceAreaM2: 2000000,

            catchmentAreaM2: 6000000,

            runoffCoefficient: 0.50,

            inflowM3PerSecond: 10,

            outflowM3PerSecond: 8,

            evaporationMmPerHour: 0.1,

            overflowRateM3PerSecond: 25,

            drainageInflowM3PerSecond: 4
        }
    ],

    terrain: {
        elevationMeters: 700,

        elevationMinMeters: 650,

        elevationMaxMeters: 800,

        elevationMeanMeters: 700,

        slopePercent: 3.5,

        slopeMaxPercent: 8,

        lowLyingAreaPercent: 35,

        flowAccumulation: 45,

        drainageDirection: "south",

        floodplain: false,

        floodplainPercent: 10,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    soil: {
        soilType: "loam",

        infiltrationRate: 8,

        permeability: "moderate",

        drainageClass: "moderate",

        soilSaturation: 45,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    landUse: {
        builtUpPercent: 50,

        imperviousSurfacePercent: 50,

        vegetationPercent: 25,

        openLandPercent: 20,

        roadPercent: 18,

        landuseType: "urban",

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    history: [
        {
            id: "MEDIUM_FLOOD_001",

            eventDate: "2025-09-15",

            eventType: "urban_flood",

            severity: "moderate",

            rainfall24h: 120,

            durationHours: 4,

            maxDepthMeters: 0.40,

            affectedAreaKm2: 1.0,

            causes: ["heavy_rainfall"],

            waterBodyInvolved: false,

            waterBodyId: null,

            damageLevel: "moderate",

            source: "official"
        }
    ],

    neighboringAreas: [
        {
            areaId: "MEDIUM_NEIGHBOR",

            name: "Medium Upstream Area",

            distanceMeters: 1200,

            elevationMeters: 760,

            flowDirection: "upstream",

            sourceRiskScore: 40,

            weather: {
                rainfall1h: 25,
                rainfall3h: 50,
                rainfall6h: 75,
                rainfall24h: 120,

                forecast1h: 18,
                forecast3h: 40,
                forecast6h: 65
            }
        }
    ]
};


/*
 * ============================================================
 * CASE 3
 * HIGH / CRITICAL RISK
 * ============================================================
 */

const HIGH_RISK = {

    area: {
        id: "TEST_HIGH",
        name: "High Risk Area",

        elevationMeters: 500,

        latitude: 12.980,
        longitude: 77.610,

        areaKm2: 4.8
    },

    weather: createWeather({
        rainfallIntensity: 28,

        rainfall1h: 35,
        rainfall3h: 75,
        rainfall6h: 120,
        rainfall24h: 190,

        precipitationProbability: 80,

        forecast1h: 25,
        forecast3h: 60,
        forecast6h: 90
    }),

    drainage: {
        blockagePercent: 60,

        capacityUtilizationPercent: 78,

        condition: "poor",

        drainageDensity: 2.5,

        totalDrainageLengthKm: 12,

        designCapacityM3PerSecond: 120,

        currentFlowM3PerSecond: 105,

        lastMaintenanceDate: "2026-04-10",

        maintenanceOverdue: true
    },

    officialReports: [
        {
            id: "HIGH_REPORT_001",

            type: "drainage",

            verified: true,

            severity: "high",

            blockagePercent: 70,

            description:
                "Major drainage blockage.",

            reportedBy: "OFFICIAL_001",

            reportedAt:
                "2026-09-19T18:10:00.000Z",

            verifiedAt:
                "2026-09-19T18:20:00.000Z"
        }
    ],

    waterBodies: [
        {
            id: "HIGH_WB_001",

            name: "High Risk Lake",

            type: "lake",

            distanceMeters: 700,

            areaKm2: 3.0,

            waterLevelPercent: 78,

            overflowRisk: "high",

            historicalOverflow: true,

            drainageConnected: true,

            currentWaterLevelMeters: 4.5,

            normalWaterLevelMeters: 4.0,

            dangerWaterLevelMeters: 5.0,

            maximumWaterLevelMeters: 6.0,

            surfaceAreaM2: 3000000,

            catchmentAreaM2: 9000000,

            runoffCoefficient: 0.70,

            inflowM3PerSecond: 20,

            outflowM3PerSecond: 8,

            evaporationMmPerHour: 0.1,

            overflowRateM3PerSecond: 30,

            drainageInflowM3PerSecond: 8
        }
    ],

    terrain: {
        elevationMeters: 500,

        elevationMinMeters: 450,

        elevationMaxMeters: 600,

        elevationMeanMeters: 500,

        slopePercent: 1.8,

        slopeMaxPercent: 5,

        lowLyingAreaPercent: 60,

        flowAccumulation: 75,

        drainageDirection: "south-east",

        floodplain: true,

        floodplainPercent: 35,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    soil: {
        soilType: "clay",

        infiltrationRate: 2.5,

        permeability: "low",

        drainageClass: "poor",

        soilSaturation: 75,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    landUse: {
        builtUpPercent: 70,

        imperviousSurfacePercent: 75,

        vegetationPercent: 10,

        openLandPercent: 10,

        roadPercent: 25,

        landuseType: "dense_urban",

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    history: [
        {
            id: "HIGH_FLOOD_001",

            eventDate: "2025-08-20",

            eventType: "urban_flood",

            severity: "high",

            rainfall24h: 190,

            durationHours: 7,

            maxDepthMeters: 0.9,

            affectedAreaKm2: 3,

            causes: [
                "heavy_rainfall",
                "drainage_blockage"
            ],

            waterBodyInvolved: true,

            waterBodyId: "HIGH_WB_001",

            damageLevel: "high",

            source: "official"
        }
    ],

    neighboringAreas: [
        {
            areaId: "HIGH_NEIGHBOR",

            name: "High Upstream Area",

            distanceMeters: 900,

            elevationMeters: 600,

            flowDirection: "upstream",

            sourceRiskScore: 85,

            weather: {
                rainfall1h: 45,
                rainfall3h: 100,
                rainfall6h: 150,
                rainfall24h: 220,

                forecast1h: 30,
                forecast3h: 75,
                forecast6h: 105
            }
        }
    ]
};


/*
 * ============================================================
 * CASE 4
 * EXTREME RAW RISK
 * ============================================================
 *
 * This intentionally creates a raw score above 100.
 *
 * Dashboard score will be capped at 100,
 * but rawScore will preserve the severity.
 */

const EXTREME_RISK = {

    area: {
        id: "TEST_EXTREME",
        name: "Extreme Flood Area",

        elevationMeters: 300,

        latitude: 12.985,
        longitude: 77.620,

        areaKm2: 5.5
    },

    weather: createWeather({
        rainfallIntensity: 45,

        rainfall1h: 55,
        rainfall3h: 120,
        rainfall6h: 190,
        rainfall24h: 300,

        precipitationProbability: 98,

        forecast1h: 40,
        forecast3h: 90,
        forecast6h: 130
    }),

    drainage: {
        blockagePercent: 95,

        capacityUtilizationPercent: 100,

        condition: "critical",

        drainageDensity: 1.5,

        totalDrainageLengthKm: 8,

        designCapacityM3PerSecond: 100,

        currentFlowM3PerSecond: 110,

        lastMaintenanceDate: "2026-01-10",

        maintenanceOverdue: true
    },

    officialReports: [
        {
            id: "EXTREME_REPORT_001",

            type: "drainage",

            verified: true,

            severity: "critical",

            blockagePercent: 95,

            description:
                "Critical drainage failure.",

            reportedBy: "OFFICIAL_001",

            reportedAt:
                "2026-09-19T18:00:00.000Z",

            verifiedAt:
                "2026-09-19T18:05:00.000Z"
        },

        {
            id: "EXTREME_REPORT_002",

            type: "waterlogging",

            verified: true,

            severity: "critical",

            waterDepthCm: 80,

            roadBlocked: true,

            trafficImpact: "severe",

            description:
                "Severe waterlogging across major roads.",

            reportedBy: "OFFICIAL_002",

            reportedAt:
                "2026-09-19T18:10:00.000Z",

            verifiedAt:
                "2026-09-19T18:15:00.000Z"
        }
    ],

    waterBodies: [
        {
            id: "EXTREME_WB_001",

            name: "Extreme Risk Reservoir",

            type: "reservoir",

            distanceMeters: 400,

            areaKm2: 4.5,

            waterLevelPercent: 94,

            overflowRisk: "critical",

            historicalOverflow: true,

            drainageConnected: true,

            currentWaterLevelMeters: 5.8,

            normalWaterLevelMeters: 4.0,

            dangerWaterLevelMeters: 5.0,

            maximumWaterLevelMeters: 6.0,

            surfaceAreaM2: 4500000,

            catchmentAreaM2: 15000000,

            runoffCoefficient: 0.85,

            inflowM3PerSecond: 35,

            outflowM3PerSecond: 5,

            evaporationMmPerHour: 0.05,

            overflowRateM3PerSecond: 50,

            drainageInflowM3PerSecond: 15
        }
    ],

    terrain: {
        elevationMeters: 300,

        elevationMinMeters: 250,

        elevationMaxMeters: 450,

        elevationMeanMeters: 300,

        slopePercent: 0.8,

        slopeMaxPercent: 3,

        lowLyingAreaPercent: 90,

        flowAccumulation: 95,

        drainageDirection: "south",

        floodplain: true,

        floodplainPercent: 80,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    soil: {
        soilType: "clay",

        infiltrationRate: 1,

        permeability: "very low",

        drainageClass: "very poor",

        soilSaturation: 98,

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    landUse: {
        builtUpPercent: 90,

        imperviousSurfacePercent: 95,

        vegetationPercent: 3,

        openLandPercent: 2,

        roadPercent: 35,

        landuseType: "dense_urban",

        updatedAt: "2026-09-01T00:00:00.000Z"
    },

    history: [
        {
            id: "EXTREME_FLOOD_001",

            eventDate: "2025-08-20",

            eventType: "urban_flood",

            severity: "critical",

            rainfall24h: 300,

            durationHours: 12,

            maxDepthMeters: 2.5,

            affectedAreaKm2: 5,

            causes: [
                "extreme_rainfall",
                "water_body_overflow",
                "drainage_failure"
            ],

            waterBodyInvolved: true,

            waterBodyId: "EXTREME_WB_001",

            damageLevel: "critical",

            source: "official"
        }
    ],

    neighboringAreas: [
        {
            areaId: "EXTREME_NEIGHBOR_001",

            name: "Extreme Upstream Area",

            distanceMeters: 600,

            elevationMeters: 420,

            flowDirection: "upstream",

            sourceRiskScore: 100,

            weather: {
                rainfall1h: 60,
                rainfall3h: 130,
                rainfall6h: 200,
                rainfall24h: 320,

                forecast1h: 45,
                forecast3h: 100,
                forecast6h: 140
            }
        },

        {
            areaId: "EXTREME_NEIGHBOR_002",

            name: "Connected Flood Zone",

            distanceMeters: 1000,

            elevationMeters: 350,

            flowDirection: "connected",

            sourceRiskScore: 90,

            weather: {
                rainfall1h: 50,
                rainfall3h: 115,
                rainfall6h: 180,
                rainfall24h: 280,

                forecast1h: 40,
                forecast3h: 90,
                forecast6h: 125
            }
        }
    ]
};


/*
 * Export all four test cases.
 */

export const floodRiskTestCases = {
    low: LOW_RISK,
    medium: MEDIUM_RISK,
    high: HIGH_RISK,
    extreme: EXTREME_RISK
};