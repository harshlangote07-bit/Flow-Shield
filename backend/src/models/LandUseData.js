import mongoose from "mongoose";

const landUseDataSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            unique: true,
            index: true
        },

        imperviousSurfacePercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        builtUpPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        vegetationPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        openLandPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        roadPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        updatedAtSource: Date
    },
    {
        timestamps: true,
        collection: "landuse_data"
    }
);

export default mongoose.model("LandUseData", landUseDataSchema);