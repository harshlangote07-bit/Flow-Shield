import mongoose from "mongoose";

const weatherForecastSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
            index: true
        },

        forecastGeneratedAt: {
            type: Date,
            required: true
        },

        validFrom: {
            type: Date,
            required: true
        },

        validUntil: {
            type: Date,
            required: true
        },

        forecast3h: {
            type: Number,
            required: true,
            min: 0
        },

        forecast6h: {
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

        source: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        collection: "weather_forecasts"
    }
);

weatherForecastSchema.index({
    areaId: 1,
    forecastGeneratedAt: -1
});

export default mongoose.model(
    "WeatherForecast",
    weatherForecastSchema
);