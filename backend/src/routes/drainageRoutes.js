import express from "express";

import {
    getDrainage,
    getDrainageRisk,
    getReports,
    updateAsset
} from "../controllers/drainageController.js";

const router = express.Router();

router.get("/:areaId", getDrainage);

router.get("/:areaId/risk", getDrainageRisk);

router.get("/:areaId/reports", getReports);

router.patch("/assets/:assetId", updateAsset);

export default router;