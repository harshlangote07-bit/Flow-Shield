import {
    getAreaAlerts,
    getAllAlerts
} from "../services/alertService.js";

export async function getAlerts(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getAreaAlerts(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Alerts error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch alerts."
        });
    }
}

export async function getAllActiveAlerts(req, res) {
    try {
        const data = await getAllAlerts();

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("All alerts error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch alerts."
        });
    }
}