import {
    getAllAreas,
    getAreaDetails
} from "../services/areaService.js";

export async function getAreas(req, res) {
    try {
        const areas = await getAllAreas();

        return res.status(200).json({
            success: true,
            data: areas
        });
    } catch (error) {
        console.error("Areas error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch areas."
        });
    }
}

export async function getArea(req, res) {
    try {
        const { areaId } = req.params;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const area = await getAreaDetails(areaId);

        if (!area) {
            return res.status(404).json({
                success: false,
                message: "Area not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: area
        });
    } catch (error) {
        console.error("Area details error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch area."
        });
    }
}