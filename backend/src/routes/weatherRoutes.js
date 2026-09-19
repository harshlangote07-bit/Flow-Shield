import express from "express";

import {
    getWeather,
    getCurrentAreaWeather
} from "../controllers/weatherController.js";

const router = express.Router();

router.get("/:areaId", getWeather);

router.get("/:areaId/current", getCurrentAreaWeather);

export default router;