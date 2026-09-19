import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
    {
        areaId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        // Geographic boundary of the area
        boundary: {
            type: {
                type: String,
                enum: ["Polygon", "MultiPolygon"],
                required: true
            },

            coordinates: {
                type: Array,
                required: true
            }
        },

        // Center point of the area
        centroid: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        },

        // Used by terrain and neighboring-area calculations
        elevationMeters: {
            type: Number,
            required: true
        },

        // Other areas connected/nearby to this area
        neighboringAreas: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Area"
            }
        ],

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "areas"
    }
);

areaSchema.index({
    boundary: "2dsphere"
});

const Area = mongoose.model("Area", areaSchema);

export default Area;