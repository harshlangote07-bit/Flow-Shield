import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
    {
        type: String,
        bonus: Number,
        reason: String
    },
    { _id: false }
);

const nearbyWaterBodySchema = new mongoose.Schema(
    {
        id: String,
        name: String,
        type: String,
        distanceMeters: Number,
        waterLevelPercent: Number,
        predictedWaterLevelPercent: Number,
        predictedWaterLevelMeters: Number,
        predictedStatus: String,
        overflowRisk: String,
        historicalOverflow: Boolean,
        drainageConnected: Boolean,
        contribution: Number
    },
    { _id: false }
);

const neighboringAreaSchema = new mongoose.Schema(
    {
        areaId: String,
        name: String,
        distanceMeters: Number,
        elevationMeters: Number,
        elevationDifference: Number,
        direction: String,
        sourceRiskScore: Number,
        rainfallScore: Number,
        elevationFactor: Number,
        distanceFactor: Number,
        propagationFactor: Number,
        propagatedRisk: Number
    },
    { _id: false }
);

const mainFactorSchema = new mongoose.Schema(
    {
        name: String,
        score: Number
    },
    { _id: false }
);

const riskAssessmentSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            index: true
        },

        timestamp: {
            type: Date,
            required: true,
            index: true
        },

        rawScore: {
            type: Number,
            required: true
        },

        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        level: {
            type: String,
            enum: [
                "LOW",
                "MODERATE",
                "HIGH",
                "VERY_HIGH",
                "CRITICAL"
            ],
            required: true
        },

        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        components: {
            rainfall: Number,
            drainage: Number,
            waterBody: Number,
            terrain: Number,
            soil: Number,
            landUse: Number,
            historical: Number
        },

        calculation: {
            baseScore: Number,
            interactionBonus: Number,
            neighborPropagation: Number,
            rawScore: Number,
            normalizedScore: Number,
            interactions: {
                type: [interactionSchema],
                default: []
            }
        },

        nearbyWaterBodies: {
            type: [nearbyWaterBodySchema],
            default: []
        },

        neighboringAreas: {
            type: [neighboringAreaSchema],
            default: []
        },

        mainFactors: {
            type: [mainFactorSchema],
            default: []
        }
    },
    {
        timestamps: true,
        collection: "risk_assessments"
    }
);

riskAssessmentSchema.index({
    areaId: 1,
    timestamp: -1
});

export default mongoose.model("RiskAssessment", riskAssessmentSchema);