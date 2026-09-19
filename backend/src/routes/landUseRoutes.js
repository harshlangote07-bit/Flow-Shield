import express from "express";

import {
    getLandUse,
    getLandUseRiskData
} from "../controllers/landUseController.js";

const router = express.Router();

router.get("/:areaId", getLandUse);

router.get("/:areaId/risk", getLandUseRiskData);

export default router;