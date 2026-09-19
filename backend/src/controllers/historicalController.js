import {
    getAreaHistoricalData,
    getHistoricalRisk
} from "../services/historicalService.js";

export async function getHistoricalData(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaHistoricalData(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Historical data error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch historical data."
        });
    }
}

export async function getHistoricalRiskData(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getHistoricalRisk(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Historical risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate historical risk."
        });
    }
}