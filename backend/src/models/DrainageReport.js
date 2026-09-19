import mongoose from "mongoose";

const drainageReportSchema = new mongoose.Schema(
    {
        reportId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
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
            required: true,
            index: true
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        blockagePercent: {
            type: Number,
            min: 0,
            max: 100
        },

        severity: {
            type: String,
            enum: ["low", "moderate", "high", "critical"],
            required: true
        },

        description: {
            type: String,
            trim: true
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

        verifiedAt: {
            type: Date
        },

        status: {
            type: String,
            enum: ["reported", "verified", "resolved", "rejected"],
            default: "reported"
        },

        resolvedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        collection: "drainage_reports"
    }
);

export default mongoose.model("DrainageReport", drainageReportSchema);
