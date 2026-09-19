import mongoose from "mongoose";

const waterBodySchema = new mongoose.Schema(
    {
        waterBodyId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        name: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: [
                "lake",
                "reservoir",
                "pond",
                "river",
                "canal",
                "wetland",
                "other"
            ],
            required: true
        },

        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            index: true
        },

        location: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        },

        distanceMeters: {
            type: Number,
            min: 0
        },

        areaKm2: {
            type: Number,
            min: 0
        },

        surfaceAreaM2: {
            type: Number,
            required: true,
            min: 0.01
        },

        catchmentAreaM2: {
            type: Number,
            required: true,
            min: 0
        },

        runoffCoefficient: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },

        currentWaterLevelMeters: {
            type: Number,
            required: true,
            min: 0
        },

        normalWaterLevelMeters: {
            type: Number,
            required: true,
            min: 0
        },

        dangerWaterLevelMeters: {
            type: Number,
            required: true,
            min: 0
        },

        maximumWaterLevelMeters: {
            type: Number,
            required: true,
            min: 0
        },

        inflowM3PerSecond: {
            type: Number,
            default: 0,
            min: 0
        },

        outflowM3PerSecond: {
            type: Number,
            default: 0,
            min: 0
        },

        drainageInflowM3PerSecond: {
            type: Number,
            default: 0,
            min: 0
        },

        evaporationMmPerHour: {
            type: Number,
            default: 0,
            min: 0
        },

        drainageConnected: {
            type: Boolean,
            default: false
        },

        historicalOverflow: {
            type: Boolean,
            default: false
        },

        overflowRisk: {
            type: String,
            enum: [
                "low",
                "moderate",
                "high",
                "critical",
                "unknown"
            ],
            default: "unknown"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "water_bodies"
    }
);

export default mongoose.model("WaterBody", waterBodySchema);