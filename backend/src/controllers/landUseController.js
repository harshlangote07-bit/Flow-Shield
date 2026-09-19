import {
    getAreaLandUse,
    getLandUseRisk
} from "../services/landUseService.js";

export async function getLandUse(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaLandUse(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Land use error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch land-use data."
        });
    }
}

export async function getLandUseRiskData(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getLandUseRisk(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Land use risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate land-use risk."
        });
    }
}