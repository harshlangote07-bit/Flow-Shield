import express from "express";

import {
    calculateRisk,
    getLatestRisk,
    getRiskHistory,
    getAllRisks
} from "../controllers/riskController.js";

const router = express.Router();

// Calculate fresh risk from current MongoDB data
router.post("/calculate/:areaId", calculateRisk);

// Latest saved risk assessment for one area
router.get("/:areaId", getLatestRisk);

// Historical risk assessments for one area
router.get("/:areaId/history", getRiskHistory);

// Latest risk assessment for every active area
router.get("/", getAllRisks);

export default router;