import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import "./models/index.js";
import riskRoutes from "./routes/riskRoutes.js";
import areaRoutes from "./routes/areaRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import waterBodyRoutes from "./routes/waterBodyRoutes.js";
import drainageRoutes from "./routes/drainageRoutes.js";
import historicalRoutes from "./routes/historicalRoutes.js";
import terrainRoutes from "./routes/terrainRoutes.js";
import soilRoutes from "./routes/soilRoutes.js";
import landUseRoutes from "./routes/landUseRoutes.js";
import neighborRoutes from "./routes/neighborRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import { startWeatherRefreshScheduler } from "./services/weatherRefreshService.js";
import { startRiskRefreshScheduler } from "./services/riskRefreshService.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Flow Shield backend is running"
    });
});

// API routes
app.use("/api/risk", riskRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/water-bodies", waterBodyRoutes);
app.use("/api/drainage", drainageRoutes);
app.use("/api/historical", historicalRoutes);
app.use("/api/terrain", terrainRoutes);
app.use("/api/soil", soilRoutes);
app.use("/api/land-use", landUseRoutes);
app.use("/api/neighbors", neighborRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    startWeatherRefreshScheduler();
    startRiskRefreshScheduler();
    app.listen(PORT, () => {
        console.log(`🚀 Flow Shield backend running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error("SERVER STARTUP ERROR:", error);
});