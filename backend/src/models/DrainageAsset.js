import mongoose from "mongoose";

const drainageAssetSchema = new mongoose.Schema(
    {
        assetId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            index: true
        },

        assetType: {
            type: String,
            enum: [
                "pipe",
                "drain",
                "culvert",
                "channel",
                "outfall",
                "pump",
                "junction"
            ],
            required: true
        },

        name: String,

        location: {
            latitude: Number,
            longitude: Number
        },

        upstreamAssets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "DrainageAsset"
            }
        ],

        downstreamAssets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "DrainageAsset"
            }
        ],

        elevationMeters: {
            type: Number,
            required: true
        },

        lengthMeters: {
            type: Number,
            min: 0
        },

        diameterMeters: {
            type: Number,
            min: 0
        },

        capacityM3PerSecond: {
            type: Number,
            min: 0
        },

        blockagePercent: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        capacityUtilizationPercent: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        condition: {
            type: String,
            enum: [
                "excellent",
                "good",
                "fair",
                "poor",
                "critical"
            ],
            default: "good"
        },

        status: {
            type: String,
            enum: [
                "operational",
                "partially_blocked",
                "blocked",
                "failed",
                "under_maintenance"
            ],
            default: "operational"
        },

        isTrunk: {
            type: Boolean,
            default: false
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        lastInspectedAt: Date,

        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        lastUpdatedAt: Date,

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "drainage_assets"
    }
);

export default mongoose.model("DrainageAsset", drainageAssetSchema);