import {
    getAreaTerrain,
    getTerrainRisk
} from "../services/terrainService.js";

export async function getTerrain(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaTerrain(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Terrain error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch terrain."
        });
    }
}

export async function getTerrainRiskData(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getTerrainRisk(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Terrain risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate terrain risk."
        });
    }
}