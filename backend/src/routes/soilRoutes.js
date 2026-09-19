import express from "express";

import {
    getSoil,
    getSoilRiskData
} from "../controllers/soilController.js";

const router = express.Router();

router.get("/:areaId", getSoil);

router.get("/:areaId/risk", getSoilRiskData);

export default router;