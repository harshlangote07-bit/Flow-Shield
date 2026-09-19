import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: [
                "user",
                "official",
                "admin"
            ],
            required: true,
            default: "user"
        },

        department: String,

        assignedAreas: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Area"
            }
        ],

        isActive: {
            type: Boolean,
            default: true
        },

        lastLoginAt: Date
    },
    {
        timestamps: true,
        collection: "users"
    }
);

export default mongoose.model("User", userSchema);