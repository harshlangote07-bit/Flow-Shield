import express from "express";

import {
  getDrainage,
  getDrainageRisk,
  getReports,
  updateAsset,
  createPublicReport
} from "../controllers/drainageController.js";

import {
  authenticate,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:areaId", getDrainage);

router.get("/:areaId/risk", getDrainageRisk);

router.get("/:areaId/reports", getReports);

router.post(
  "/:areaId/reports",
  createPublicReport
);

router.patch(
  "/assets/:assetId",
  authenticate,
  authorizeRoles("official", "admin"),
  updateAsset
);

export default router;