import mongoose from "mongoose";

const officialWaterloggingReportSchema = new mongoose.Schema(
    {
        reportId: {
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

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
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

        type: {
            type: String,
            enum: [
                "waterlogging",
                "drainage",
                "flooding"
            ],
            required: true
        },

        severity: {
            type: String,
            enum: [
                "low",
                "moderate",
                "high",
                "critical"
            ],
            required: true
        },

        depthMeters: {
            type: Number,
            min: 0
        },

        description: String,

        reportedAt: {
            type: Date,
            default: Date.now
        },

        verified: {
            type: Boolean,
            default: false
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        verifiedAt: Date,

        status: {
            type: String,
            enum: [
                "reported",
                "verified",
                "resolved",
                "rejected"
            ],
            default: "reported"
        },

        resolvedAt: Date
    },
    {
        timestamps: true,
        collection: "official_waterlogging_reports"
    }
);

export default mongoose.model(
    "OfficialWaterloggingReport",
    officialWaterloggingReportSchema
);