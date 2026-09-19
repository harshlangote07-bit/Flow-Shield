import express from "express";

import {
    getHistoricalData,
    getHistoricalRiskData
} from "../controllers/historicalController.js";

const router = express.Router();

router.get("/:areaId", getHistoricalData);

router.get("/:areaId/risk", getHistoricalRiskData);

export default router;