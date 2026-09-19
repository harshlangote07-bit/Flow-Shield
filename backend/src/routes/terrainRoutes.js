import express from "express";

import {
    getTerrain,
    getTerrainRiskData
} from "../controllers/terrainController.js";

const router = express.Router();

router.get("/:areaId/risk", getTerrainRiskData);

router.get("/:areaId", getTerrain);

export default router;