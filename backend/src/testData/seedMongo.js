import dotenv from "dotenv";
import mongoose from "mongoose";

import {
    Area,
    DrainageAsset,
    DrainageReport,
    FloodHistory,
    LandUseData,
    OfficialWaterloggingReport,
    RiskAssessment,
    RiskConfig,
    SoilData,
    TerrainData,
    User,
    WaterBody,
    WaterLevelObservation,
    WeatherForecast,
    WeatherObservation
} from "../models/index.js";

dotenv.config();

const seedMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        // --------------------------------------------------
        // CLEAR ONLY THIS TEST DATA
        // --------------------------------------------------

        const existingArea = await Area.findOne({
            areaId: "AREA_TEST_001"
        });

        if (existingArea) {
            await Promise.all([
                DrainageAsset.deleteMany({
                    areaId: existingArea._id
                }),
                DrainageReport.deleteMany({
                    areaId: existingArea._id
                }),
                FloodHistory.deleteMany({
                    areaId: existingArea._id
                }),
                LandUseData.deleteMany({
                    areaId: existingArea._id
                }),
                OfficialWaterloggingReport.deleteMany({
                    areaId: existingArea._id
                }),
                RiskAssessment.deleteMany({
                    areaId: existingArea._id
                }),
                SoilData.deleteMany({
                    areaId: existingArea._id
                }),
                TerrainData.deleteMany({
                    areaId: existingArea._id
                }),
                WeatherForecast.deleteMany({
                    areaId: existingArea._id
                }),
                WeatherObservation.deleteMany({
                    areaId: existingArea._id
                }),
                WaterBody.deleteMany({
                    areaId: existingArea._id
                })
            ]);

            await Area.deleteOne({
                _id: existingArea._id
            });
        }

        await User.deleteMany({
            userId: "USER_TEST_001"
        });

        await WaterLevelObservation.deleteMany({
            source: "Test water-level sensor"
        });

        await RiskConfig.deleteMany({
            configName: "test-config"
        });

        // --------------------------------------------------
        // 1. USER
        // --------------------------------------------------

        const user = await User.create({
            userId: "USER_TEST_001",
            name: "Test Official",
            email: "official@test.flowshield.com",
            passwordHash: "test-password-hash",
            role: "official",
            department: "Flood Management",
            isActive: true
        });

        console.log("✓ User created");

        // --------------------------------------------------
        // 2. AREA
        // --------------------------------------------------

        const area = await Area.create({
            areaId: "AREA_TEST_001",
            name: "Test Flood Area",
            city: "Bengaluru",
            state: "Karnataka",

            boundary: {
                type: "Polygon",
                coordinates: [[
                    [77.5900, 12.9700],
                    [77.6000, 12.9700],
                    [77.6000, 12.9800],
                    [77.5900, 12.9800],
                    [77.5900, 12.9700]
                ]]
            },

            centroid: {
                latitude: 12.9750,
                longitude: 77.5950
            },

            elevationMeters: 850,

            neighboringAreas: [],

            isActive: true
        });

        user.assignedAreas = [area._id];
        await user.save();

        console.log("✓ Area created");

        // --------------------------------------------------
        // 3. DRAINAGE ASSETS
        // --------------------------------------------------

        const drainageMain = await DrainageAsset.create({
            assetId: "DRAIN_TEST_MAIN",
            areaId: area._id,
            assetType: "pipe",
            name: "Main Trunk Drain",

            location: {
                latitude: 12.9752,
                longitude: 77.5952
            },

            upstreamAssets: [],
            downstreamAssets: [],

            elevationMeters: 848,

            lengthMeters: 500,
            diameterMeters: 1.5,
            capacityM3PerSecond: 12,

            blockagePercent: 65,
            capacityUtilizationPercent: 85,

            condition: "poor",
            status: "partially_blocked",

            isTrunk: true,
            priority: "critical",

            lastInspectedAt: new Date(),
            lastUpdatedBy: user._id,
            lastUpdatedAt: new Date(),

            isActive: true
        });

        const drainageSecondary = await DrainageAsset.create({
            assetId: "DRAIN_TEST_SECONDARY",
            areaId: area._id,
            assetType: "drain",
            name: "Secondary Drain",

            location: {
                latitude: 12.9760,
                longitude: 77.5960
            },

            upstreamAssets: [],
            downstreamAssets: [drainageMain._id],

            elevationMeters: 852,

            lengthMeters: 250,
            diameterMeters: 0.8,
            capacityM3PerSecond: 6,

            blockagePercent: 25,
            capacityUtilizationPercent: 60,

            condition: "fair",
            status: "operational",

            isTrunk: false,
            priority: "high",

            lastInspectedAt: new Date(),
            lastUpdatedBy: user._id,
            lastUpdatedAt: new Date(),

            isActive: true
        });

        drainageMain.upstreamAssets = [drainageSecondary._id];
        await drainageMain.save();

        console.log("✓ Drainage assets created");

        // --------------------------------------------------
        // 4. DRAINAGE REPORT
        // --------------------------------------------------

        await DrainageReport.create({
            reportId: "DRAIN_REPORT_TEST_001",
            areaId: area._id,
            drainageAssetId: drainageMain._id,
            reportedBy: user._id,

            blockagePercent: 65,
            severity: "high",

            description:
                "Main trunk drain partially blocked during heavy rainfall.",

            reportedAt: new Date(),

            verified: true,
            verifiedBy: user._id,
            verifiedAt: new Date(),

            status: "verified"
        });

        console.log("✓ Drainage report created");

        // --------------------------------------------------
        // 5. FLOOD HISTORY
        // --------------------------------------------------

        await FloodHistory.create({
            areaId: area._id,
            eventDate: new Date("2025-08-15"),

            severity: "high",

            maxDepthMeters: 0.8,
            rainfall24h: 185,
            durationHours: 6,
            affectedAreaPercent: 35,

            damageLevel: "moderate",

            description: "Flow Shield test flood event",
            source: "Test historical dataset",

            verified: true
        });

        console.log("✓ Flood history created");

        // --------------------------------------------------
        // 6. LAND USE
        // --------------------------------------------------

        await LandUseData.create({
            areaId: area._id,

            imperviousSurfacePercent: 72,
            builtUpPercent: 60,
            vegetationPercent: 12,
            openLandPercent: 16,
            roadPercent: 12,

            updatedAtSource: new Date()
        });

        console.log("✓ Land use created");

        // --------------------------------------------------
        // 7. SOIL
        // --------------------------------------------------

        await SoilData.create({
            areaId: area._id,

            soilType: "clay",
            infiltrationRate: 8,
            soilSaturation: 78,
            drainageClass: "poor",

            updatedAtSource: new Date()
        });

        console.log("✓ Soil data created");

        // --------------------------------------------------
        // 8. TERRAIN
        // --------------------------------------------------

        await TerrainData.create({
            areaId: area._id,

            elevationMeters: 850,
            slopePercent: 1.8,
            lowLyingAreaPercent: 42,
            flowAccumulation: 75,

            floodplain: false,
            drainageDirection: "south-east",

            updatedAtSource: new Date()
        });

        console.log("✓ Terrain data created");

        // --------------------------------------------------
        // 9. WATER BODY
        // --------------------------------------------------

        const waterBody = await WaterBody.create({
            waterBodyId: "WATER_TEST_001",

            name: "Test Lake",
            type: "lake",

            areaId: area._id,

            location: {
                latitude: 12.9770,
                longitude: 77.5980
            },

            distanceMeters: 1200,

            areaKm2: 0.45,
            surfaceAreaM2: 450000,
            catchmentAreaM2: 1200000,

            runoffCoefficient: 0.75,

            currentWaterLevelMeters: 4.2,
            normalWaterLevelMeters: 3.0,
            dangerWaterLevelMeters: 4.5,
            maximumWaterLevelMeters: 5.5,

            inflowM3PerSecond: 8,
            outflowM3PerSecond: 4,
            drainageInflowM3PerSecond: 2,
            evaporationMmPerHour: 0.2,

            drainageConnected: true,
            historicalOverflow: true,
            overflowRisk: "high",

            isActive: true
        });

        console.log("✓ Water body created");

        // --------------------------------------------------
        // 10. WATER LEVEL OBSERVATION
        // --------------------------------------------------

        await WaterLevelObservation.create({
            waterBodyId: waterBody._id,

            observedAt: new Date(),

            waterLevelMeters: 4.2,
            capacityPercent: 82,

            status: "WARNING",

            source: "Test water-level sensor"
        });

        console.log("✓ Water level observation created");

        // --------------------------------------------------
        // 11. WEATHER OBSERVATION
        // --------------------------------------------------

        await WeatherObservation.create({
            areaId: area._id,

            observedAt: new Date(),

            rainfallIntensity: 32,
            rainfall1h: 38,
            rainfall3h: 72,
            rainfall6h: 105,
            rainfall24h: 180,

            precipitationProbability: 85,

            temperatureC: 24,
            humidityPercent: 91,
            windSpeedMps: 4.5,
            pressureHpa: 1005,

            weatherCondition: "Heavy Rain",

            source: "Test weather station"
        });

        console.log("✓ Weather observation created");

        // --------------------------------------------------
        // 12. WEATHER FORECAST
        // --------------------------------------------------

        const forecastGeneratedAt = new Date();

        const validFrom = new Date(
            forecastGeneratedAt.getTime() + 30 * 60 * 1000
        );

        const validUntil = new Date(
            forecastGeneratedAt.getTime() + 6 * 60 * 60 * 1000
        );

        await WeatherForecast.create({
            areaId: area._id,

            forecastGeneratedAt,
            validFrom,
            validUntil,

            forecast3h: 55,
            forecast6h: 90,

            precipitationProbability: 90,

            temperatureC: 23,
            humidityPercent: 93,
            windSpeedMps: 5,

            source: "Test weather forecast"
        });

        console.log("✓ Weather forecast created");

        // --------------------------------------------------
        // 13. OFFICIAL WATERLOGGING REPORT
        // --------------------------------------------------

        await OfficialWaterloggingReport.create({
            reportId: "WATERLOG_TEST_001",

            areaId: area._id,

            reportedBy: user._id,

            location: {
                latitude: 12.9745,
                longitude: 77.5945
            },

            type: "waterlogging",
            severity: "high",

            depthMeters: 0.45,

            description:
                "Verified waterlogging near the main drainage corridor.",

            reportedAt: new Date(),

            verified: true,
            verifiedBy: user._id,
            verifiedAt: new Date(),

            status: "verified"
        });

        console.log("✓ Official waterlogging report created");

        // --------------------------------------------------
        // 14. RISK CONFIG
        // --------------------------------------------------

        await RiskConfig.create({
            configName: "test-config",

            weights: {
                rainfall: 0.30,
                drainage: 0.20,
                waterBody: 0.15,
                terrain: 0.10,
                soil: 0.10,
                landUse: 0.05,
                historical: 0.10
            },

            riskLevels: {
                lowMax: 20,
                moderateMax: 40,
                highMax: 60,
                veryHighMax: 80,
                criticalMax: 100
            },

            interactionRules: {
                heavyRainDrainageBonus: 10,
                heavyRainSaturatedSoilBonus: 5,
                heavyRainWaterBodyBonus: 8,
                criticalWaterloggingBonus: 10,
                highWaterloggingBonus: 5,
                maximumInteractionBonus: 30
            },

            neighborPropagationWeight: 0.10,

            isActive: true
        });

        console.log("✓ Risk config created");

        // --------------------------------------------------
        // 15. RISK ASSESSMENT
        // --------------------------------------------------

        await RiskAssessment.create({
            areaId: area._id,

            timestamp: new Date(),

            rawScore: 82,
            score: 82,

            level: "VERY_HIGH",

            confidence: 90,

            components: {
                rainfall: 78,
                drainage: 76,
                waterBody: 70,
                terrain: 55,
                soil: 82,
                landUse: 72,
                historical: 65
            },

            calculation: {
                baseScore: 68,
                interactionBonus: 10,
                neighborPropagation: 4,
                rawScore: 82,
                normalizedScore: 82,

                interactions: [
                    {
                        type: "heavy_rain_blocked_drainage",
                        bonus: 10,
                        reason:
                            "Heavy rainfall combined with significant drainage blockage."
                    }
                ]
            },

            nearbyWaterBodies: [
                {
                    id: waterBody._id.toString(),
                    name: waterBody.name,
                    type: waterBody.type,
                    distanceMeters: waterBody.distanceMeters,

                    waterLevelPercent: 82,
                    predictedWaterLevelPercent: 88,
                    predictedWaterLevelMeters: 4.6,

                    predictedStatus: "WARNING",
                    overflowRisk: "high",

                    historicalOverflow: true,
                    drainageConnected: true,

                    contribution: 70
                }
            ],

            neighboringAreas: [],

            mainFactors: [
                {
                    name: "Heavy rainfall",
                    score: 78
                },
                {
                    name: "Drainage blockage",
                    score: 76
                },
                {
                    name: "High soil saturation",
                    score: 82
                }
            ]
        });

        console.log("✓ Risk assessment created");

        // --------------------------------------------------
        // FINAL VERIFICATION
        // --------------------------------------------------

        console.log("\n====================================");
        console.log("FLOW SHIELD TEST DATA SEEDED");
        console.log("====================================");

        console.log(
            "Area:",
            await Area.countDocuments({ areaId: "AREA_TEST_001" })
        );

        console.log(
            "Drainage Assets:",
            await DrainageAsset.countDocuments({
                assetId: /^DRAIN_TEST_/
            })
        );

        console.log(
            "Drainage Reports:",
            await DrainageReport.countDocuments({
                reportId: "DRAIN_REPORT_TEST_001"
            })
        );

        console.log(
            "Flood History:",
            await FloodHistory.countDocuments({
                description: "Flow Shield test flood event"
            })
        );

        console.log(
            "Land Use:",
            await LandUseData.countDocuments({
                areaId: area._id
            })
        );

        console.log(
            "Official Waterlogging:",
            await OfficialWaterloggingReport.countDocuments({
                reportId: "WATERLOG_TEST_001"
            })
        );

        console.log(
            "Risk Assessment:",
            await RiskAssessment.countDocuments({
                areaId: area._id
            })
        );

        console.log(
            "Risk Config:",
            await RiskConfig.countDocuments({
                configName: "test-config"
            })
        );

        console.log(
            "Soil:",
            await SoilData.countDocuments({
                areaId: area._id
            })
        );

        console.log(
            "Terrain:",
            await TerrainData.countDocuments({
                areaId: area._id
            })
        );

        console.log(
            "User:",
            await User.countDocuments({
                userId: "USER_TEST_001"
            })
        );

        console.log(
            "Water Body:",
            await WaterBody.countDocuments({
                waterBodyId: "WATER_TEST_001"
            })
        );

        console.log(
            "Water Level Observation:",
            await WaterLevelObservation.countDocuments({
                source: "Test water-level sensor"
            })
        );

        console.log(
            "Weather Forecast:",
            await WeatherForecast.countDocuments({
                areaId: area._id
            })
        );

        console.log(
            "Weather Observation:",
            await WeatherObservation.countDocuments({
                areaId: area._id
            })
        );

        console.log("====================================");

    } catch (error) {
        console.error("\nSeed failed:");
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    }
};

seedMongo();