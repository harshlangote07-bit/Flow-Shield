import mongoose from "mongoose";

const riskConfigSchema = new mongoose.Schema(
    {
        configName: {
            type: String,
            required: true,
            unique: true
        },

        weights: {
            rainfall: {
                type: Number,
                required: true,
                default: 0.30
            },

            drainage: {
                type: Number,
                required: true,
                default: 0.20
            },

            waterBody: {
                type: Number,
                required: true,
                default: 0.15
            },

            terrain: {
                type: Number,
                required: true,
                default: 0.10
            },

            soil: {
                type: Number,
                required: true,
                default: 0.10
            },

            landUse: {
                type: Number,
                required: true,
                default: 0.05
            },

            historical: {
                type: Number,
                required: true,
                default: 0.10
            }
        },

        riskLevels: {
            lowMax: {
                type: Number,
                default: 20
            },

            moderateMax: {
                type: Number,
                default: 40
            },

            highMax: {
                type: Number,
                default: 60
            },

            veryHighMax: {
                type: Number,
                default: 80
            },

            criticalMax: {
                type: Number,
                default: 100
            }
        },

        interactionRules: {
            heavyRainDrainageBonus: {
                type: Number,
                default: 10
            },

            heavyRainSaturatedSoilBonus: {
                type: Number,
                default: 5
            },

            heavyRainWaterBodyBonus: {
                type: Number,
                default: 8
            },

            criticalWaterloggingBonus: {
                type: Number,
                default: 10
            },

            highWaterloggingBonus: {
                type: Number,
                default: 5
            },

            maximumInteractionBonus: {
                type: Number,
                default: 30
            }
        },

        neighborPropagationWeight: {
            type: Number,
            default: 0.10
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "risk_config"
    }
);

export default mongoose.model("RiskConfig", riskConfigSchema);