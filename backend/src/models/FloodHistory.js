import mongoose from "mongoose";

const floodHistorySchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            index: true
        },

        eventDate: {
            type: Date,
            required: true,
            index: true
        },

        severity: {
            type: String,
            enum: [
                "minor",
                "low",
                "moderate",
                "high",
                "severe",
                "critical"
            ],
            required: true
        },

        maxDepthMeters: {
            type: Number,
            min: 0
        },

        rainfall24h: {
            type: Number,
            min: 0
        },

        durationHours: {
            type: Number,
            min: 0
        },

        affectedAreaPercent: {
            type: Number,
            min: 0,
            max: 100
        },

        damageLevel: {
            type: String,
            enum: [
                "none",
                "low",
                "moderate",
                "high",
                "severe"
            ]
        },

        description: String,

        source: String,

        verified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: "flood_history"
    }
);

export default mongoose.model("FloodHistory", floodHistorySchema);