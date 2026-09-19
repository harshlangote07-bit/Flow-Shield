import mongoose from "mongoose";

const waterLevelObservationSchema = new mongoose.Schema(
    {
        waterBodyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WaterBody",
            required: true,
            index: true
        },

        observedAt: {
            type: Date,
            required: true,
            index: true
        },

        waterLevelMeters: {
            type: Number,
            required: true,
            min: 0
        },

        capacityPercent: {
            type: Number,
            min: 0,
            max: 100
        },

        status: {
            type: String,
            enum: [
                "NORMAL",
                "WARNING",
                "CRITICAL",
                "OVERFLOW"
            ],
            required: true
        },

        source: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        collection: "water_level_observations"
    }
);

waterLevelObservationSchema.index({
    waterBodyId: 1,
    observedAt: -1
});

export default mongoose.model(
    "WaterLevelObservation",
    waterLevelObservationSchema
);