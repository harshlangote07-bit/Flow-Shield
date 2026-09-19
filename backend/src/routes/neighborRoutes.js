import express from "express";

import {
    getNeighbors,
    getPropagation
} from "../controllers/neighborController.js";

const router = express.Router();

router.get("/:areaId", getNeighbors);

router.get("/:areaId/propagation", getPropagation);

export default router;