import {
    getAreaSoil,
    getSoilRisk
} from "../services/soilService.js";

export async function getSoil(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaSoil(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Soil error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch soil."
        });
    }
}

export async function getSoilRiskData(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getSoilRisk(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Soil risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate soil risk."
        });
    }
}