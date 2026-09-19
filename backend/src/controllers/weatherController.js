import {
    getAreaWeather,
    getCurrentWeather
} from "../services/weatherService.js";

export async function getWeather(req, res) {
    try {
        const { areaId } = req.params;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const data = await getAreaWeather(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Weather error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch weather."
        });
    }
}

export async function getCurrentAreaWeather(req, res) {
    try {
        const { areaId } = req.params;

        if (!areaId) {
            return res.status(400).json({
                success: false,
                message: "Area ID is required."
            });
        }

        const data = await getCurrentWeather(areaId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Current weather error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch current weather."
        });
    }
}