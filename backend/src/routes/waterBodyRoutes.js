import express from "express";

import {
    getWaterBodies,
    getWaterRisk
} from "../controllers/waterBodyController.js";

const router = express.Router();

router.get("/:areaId", getWaterBodies);

router.get("/:areaId/risk", getWaterRisk);

export default router;