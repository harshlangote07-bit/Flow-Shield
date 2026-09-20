// src/engine/drainageScore.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

function getConditionScore(condition) {

    switch (String(condition || "").toLowerCase()) {

        case "excellent":
            return 0;

        case "good":
            return 20;

        case "fair":
            return 50;

        case "poor":
            return 75;

        case "critical":
            return 100;

        default:
            return 50;
    }
}

export function calculateDrainageScore(
    drainage,
    officialReports = []
) {

    /*
     * 1. Drain blockage
     *
     * 0% blockage  -> 0 risk
     * 100% blockage -> 100 risk
     */

const blockageScore =
    clamp(
        drainage.networkWeightedBlockagePercent ??
        drainage.blockagePercent ??
        0
    );


    /*
     * 2. Drainage capacity utilization
     *
     * Higher utilization means the drainage
     * system is closer to being overwhelmed.
     */

const capacityScore =
    clamp(
        drainage.networkWeightedCapacityUtilizationPercent ??
        drainage.capacityUtilizationPercent ??
        0
    );


    /*
     * 3. Physical condition of drainage
     */

const conditionScore =
    drainage.networkWeightedConditionScore ??
    getConditionScore(drainage.condition);

    /*
     * 4. Verified official reports
     *
     * Only verified reports affect the score.
     */

    const verifiedDrainageReports =
        officialReports.filter(
            report =>
                report.verified === true &&
                report.type === "drainage"
        );


    let reportScore = 0;

    for (const report of verifiedDrainageReports) {

        const severity =
            String(
                report.severity || ""
            ).toLowerCase();

        if (severity === "critical") {
            reportScore = Math.max(
                reportScore,
                100
            );
        }

        else if (severity === "high") {
            reportScore = Math.max(
                reportScore,
                80
            );
        }

        else if (severity === "moderate") {
            reportScore = Math.max(
                reportScore,
                50
            );
        }

        else {
            reportScore = Math.max(
                reportScore,
                25
            );
        }
    }


    /*
     * Final drainage score
     */

    const drainageScore =
        blockageScore * 0.45 +
        capacityScore * 0.30 +
        conditionScore * 0.15 +
        reportScore * 0.10;


    return clamp(drainageScore);
}