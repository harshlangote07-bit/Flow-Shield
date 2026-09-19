import mongoose from "mongoose";

const terrainDataSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            unique: true,
            index: true
        },

        elevationMeters: {
            type: Number,
            required: true
        },

        slopePercent: {
            type: Number,
            required: true,
            min: 0
        },

        lowLyingAreaPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        flowAccumulation: {
            type: Number,
            required: true,
            min: 0
        },

        floodplain: {
            type: Boolean,
            default: false
        },

        drainageDirection: String,

        updatedAtSource: Date
    },
    {
        timestamps: true,
        collection: "terrain_data"
    }
);

export default mongoose.model("TerrainData", terrainDataSchema);