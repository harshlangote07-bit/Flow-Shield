import mongoose from "mongoose";

const weatherObservationSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            index: true
        },

        observedAt: {
            type: Date,
            required: true,
            index: true
        },

        rainfallIntensity: {
            type: Number,
            required: true,
            min: 0
        },

        rainfall1h: {
            type: Number,
            required: true,
            min: 0
        },

        rainfall3h: {
            type: Number,
            required: true,
            min: 0
        },

        rainfall6h: {
            type: Number,
            required: true,
            min: 0
        },

        rainfall24h: {
            type: Number,
            required: true,
            min: 0
        },

        precipitationProbability: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        temperatureC: Number,

        humidityPercent: {
            type: Number,
            min: 0,
            max: 100
        },

        windSpeedMps: {
            type: Number,
            min: 0
        },

        pressureHpa: Number,

        weatherCondition: String,

        source: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        collection: "weather_observations"
    }
);

weatherObservationSchema.index({
    areaId: 1,
    observedAt: -1
});

export default mongoose.model(
    "WeatherObservation",
    weatherObservationSchema
);