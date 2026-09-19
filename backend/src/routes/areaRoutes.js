import express from "express";

import {
    getAreas,
    getArea
} from "../controllers/areaController.js";

const router = express.Router();

router.get("/", getAreas);

router.get("/:areaId", getArea);

export default router;