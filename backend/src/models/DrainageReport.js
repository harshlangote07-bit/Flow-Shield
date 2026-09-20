import mongoose from "mongoose";

const drainageReportSchema = new mongoose.Schema(
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

        drainageAssetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DrainageAsset",
            required: false,
            default: null,
            index: true
        },

        // Public users do not need an account.
        // Official reports can still store the user ID.
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },

        blockagePercent: {
            type: Number,
            min: 0,
            max: 100,
            default: null
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

        description: {
            type: String,
            trim: true,
            required: true
        },

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
        collection: "drainage_reports"
    }
);

export default mongoose.model(
    "DrainageReport",
    drainageReportSchema
);