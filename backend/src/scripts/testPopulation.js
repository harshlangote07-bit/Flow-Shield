
import "dotenv/config";

import connectDB from "../config/db.js";
import { Area } from "../models/index.js";
import { getPopulationForPolygon } from "../services/populationService.js";

async function main() {
    try {
        await connectDB();

        console.log("MongoDB connected");

        const area = await Area.findOne({
            areaId: "rajajinagar",
            isActive: true,
        });

        if (!area) {
            throw new Error("Rajajinagar area not found");
        }

        console.log(`Testing WorldPop for: ${area.name}`);

        const result = await getPopulationForPolygon(area.boundary);

        console.log("WorldPop response:");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("Population test failed:");
        console.error(error.message);

        process.exit(1);
    }
}

main();