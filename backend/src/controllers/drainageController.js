import {
    getAreaDrainage,
    getAreaDrainageRisk,
    getDrainageReports,
    updateDrainageAsset
} from "../services/drainageService.js";

export async function getDrainage(req, res) {
    try {
        const { areaId } = req.params;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const data = await getAreaDrainage(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Drainage error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch drainage."
        });
    }
}

export async function getDrainageRisk(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaDrainageRisk(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Drainage risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate drainage risk."
        });
    }
}

export async function getReports(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getDrainageReports(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Drainage reports error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch drainage reports."
        });
    }
}

export async function updateAsset(req, res) {
    try {
        const { assetId } = req.params;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                message: "Asset ID is required."
            });
        }

        const data = await updateDrainageAsset(
            assetId,
            req.body,
            req.user
        );

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Drainage asset update error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update drainage asset."
        });
    }
}