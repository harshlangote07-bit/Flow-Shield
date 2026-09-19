import {
    getAreaWaterBodies,
    getWaterBodyRisk
} from "../services/waterBodyService.js";

export async function getWaterBodies(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaWaterBodies(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Water bodies error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch water bodies."
        });
    }
}

export async function getWaterRisk(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getWaterBodyRisk(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Water body risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate water body risk."
        });
    }
}