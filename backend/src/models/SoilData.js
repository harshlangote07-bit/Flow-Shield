import mongoose from "mongoose";

const soilDataSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            unique: true,
            index: true
        },

        soilType: {
            type: String,
            enum: [
                "clay",
                "clayey",
                "silty clay",
                "silt",
                "loam",
                "sandy loam",
                "sand",
                "gravel",
                "rock",
                "other"
            ],
            required: true
        },

        infiltrationRate: {
            type: Number,
            min: 0
        },

        soilSaturation: {
            type: Number,
            min: 0,
            max: 100
        },

        drainageClass: {
            type: String,
            enum: [
                "very poor",
                "poor",
                "somewhat poor",
                "moderate",
                "well",
                "very well"
            ],
            required: true
        },

        updatedAtSource: Date
    },
    {
        timestamps: true,
        collection: "soil_data"
    }
);

export default mongoose.model("SoilData", soilDataSchema);