import {
    calculateAreaRisk,
    getLatestAreaRisk,
    getAreaRiskHistory,
    getAllAreaRisks
} from "../services/riskService.js";

export async function calculateRisk(req, res) {
    try {
        const { areaId } = req.params;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const result = await calculateAreaRisk(areaId);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Risk calculation error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to calculate flood risk."
        });
    }
}

export async function getLatestRisk(req, res) {
    try {
        const { areaId } = req.params;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const result = await getLatestAreaRisk(areaId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "No risk assessment found for this area."
            });
        }

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Latest risk error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch risk."
        });
    }
}

export async function getRiskHistory(req, res) {
    try {
        const { areaId } = req.params;
        const limit = Number(req.query.limit) || 50;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const result = await getAreaRiskHistory(areaId, limit);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Risk history error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch risk history."
        });
    }
}

export async function getAllRisks(req, res) {
    try {
        const result = await getAllAreaRisks();

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("All risks error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch area risks."
        });
    }
}