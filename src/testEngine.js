import { calculateFloodRisk } from "./engine/floodRiskEngine.js";
import { validateEngineInput } from "./engine/validateEngineInput.js";
import { floodRiskTestCases } from "./testData/floodRiskTestCases.js";

console.log("\n========================================");
console.log("       FLOOD RISK ENGINE TEST SUITE");
console.log("========================================\n");

for (const [name, testData] of Object.entries(floodRiskTestCases)) {

    console.log("\n----------------------------------------");
    console.log(`TEST CASE: ${name.toUpperCase()}`);
    console.log("----------------------------------------");

    const validation = validateEngineInput(testData);

    if (!validation.valid) {
        console.error("❌ VALIDATION FAILED");
        console.error(validation.errors);
        continue;
    }

    console.log("✅ Input validation passed");

    const result = calculateFloodRisk(testData);

    console.log("\nArea:", testData.area.name);
    console.log("Raw Score:", result.risk.rawScore);
    console.log("Normalized Score:", result.risk.score);
    console.log("Risk Level:", result.risk.level);
    console.log("Confidence:", result.risk.confidence);

    console.log("\nComponents:");
    console.table(result.components);

    console.log("\nCalculation:");
    console.log(result.calculation);

    console.log("\nNeighbor Propagation:");
    console.table(result.neighboringAreas);

    console.log("\nNearby Water Bodies:");
    console.table(result.nearbyWaterBodies);
}

console.log("\n========================================");
console.log("             TEST COMPLETE");
console.log("========================================\n");
