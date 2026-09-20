import "dotenv/config";

import connectDB from "../config/db.js";
import { Area } from "../models/index.js";
import { getPopulationForPolygon } from "../services/populationService.js";

const AREA_IDS = [
    "malleshwaram",
    "rajajinagar",
    "vijayanagar",
    "majestic",
    "shivajinagar",
    "chikkapete",
    "chamarajpet",
    "basavanagudi",
    "banashankari",
    "jayanagar",
];

async function main() {
    try {
        await connectDB();

        console.log("\nStarting population import...\n");

        for (const areaId of AREA_IDS) {
            const area = await Area.findOne({
                areaId,
                isActive: true,
            });

            if (!area) {
                console.log(`SKIPPED: ${areaId} - not found`);
                continue;
            }

            console.log(`Fetching population: ${area.name}`);

            const result = await getPopulationForPolygon(area.boundary);

            const population = Math.round(
                result?.result?.total_population || 0
            );

            if (!population) {
                throw new Error(
                    `No population returned for ${area.name}`
                );
            }

            await Area.updateOne(
                { _id: area._id },
                {
                    $set: {
                        population,
                        populationSource: "WorldPop",
                        populationYear: 2025,
                        populationUpdatedAt: new Date(),
                    },
                }
            );

            console.log(
                `✓ ${area.name}: ${population.toLocaleString()} people`
            );
        }

        console.log("\nPopulation import completed.");
        process.exit(0);
    } catch (error) {
        console.error("\nPopulation import failed:");
        console.error(error.message);
        process.exit(1);
    }
}

main();