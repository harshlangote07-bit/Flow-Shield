import express from "express";

import {
    getAlerts,
    getAllActiveAlerts
} from "../controllers/alertController.js";

const router = express.Router();

// Alerts for a particular area
router.get("/:areaId", getAlerts);

// Alerts across all active areas
router.get("/", getAllActiveAlerts);

export default router;