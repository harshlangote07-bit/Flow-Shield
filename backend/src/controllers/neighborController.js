import {
    getNeighboringAreas,
    getNeighborPropagation
} from "../services/neighborService.js";

export async function getNeighbors(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getNeighboringAreas(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Neighbors error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch neighboring areas."
        });
    }
}

export async function getPropagation(req, res) {
    try {
        const { areaId } = req.params;

        const data = await getNeighborPropagation(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Neighbor propagation error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to calculate neighbor propagation."
        });
    }
}