// src/engine/interactionRules.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

export function calculateInteractionBonus({
    rainfall = 0,
    drainage = 0,
    waterBody = 0,
    soil = 0,
    officialReports = []
}) {

    let bonus = 0;

    const interactions = [];


    /*
     * Heavy rainfall + poor/blocked drainage
     *
     * Rainwater cannot leave the area efficiently.
     */
    if (
        rainfall >= 70 &&
        drainage >= 70
    ) {

        bonus += 10;

        interactions.push({
            type: "RAIN_DRAINAGE",
            bonus: 10,
            reason:
                "Heavy rainfall combined with poor or blocked drainage"
        });
    }


    /*
     * Heavy rainfall + saturated soil
     *
     * The ground has limited capacity
     * to absorb additional rainfall.
     */
    if (
        rainfall >= 70 &&
        soil >= 70
    ) {

        bonus += 5;

        interactions.push({
            type: "RAIN_SATURATED_SOIL",
            bonus: 5,
            reason:
                "Heavy rainfall combined with saturated soil"
        });
    }


    /*
     * Heavy rainfall + high nearby
     * water-body risk.
     */
    if (
        rainfall >= 70 &&
        waterBody >= 70
    ) {

        bonus += 8;

        interactions.push({
            type: "RAIN_WATER_BODY",
            bonus: 8,
            reason:
                "Heavy rainfall combined with high nearby water-body risk"
        });
    }


    /*
     * Verified official waterlogging reports.
     *
     * Only verified reports affect the
     * automatic flood-risk calculation.
     */
    const verifiedReports =
        Array.isArray(officialReports)
            ? officialReports.filter(
                report =>
                    report.verified === true
            )
            : [];


    let hasCriticalReport = false;
    let hasHighReport = false;


    for (const report of verifiedReports) {

        const severity =
            String(
                report.severity || ""
            ).toLowerCase();


        /*
         * Critical waterlogging.
         */
        if (severity === "critical") {
            hasCriticalReport = true;
        }


        /*
         * High waterlogging.
         */
        if (
            severity === "high" ||
            severity === "severe"
        ) {
            hasHighReport = true;
        }
    }


    /*
     * Critical verified report.
     */
    if (hasCriticalReport) {

        bonus += 10;

        interactions.push({
            type: "CRITICAL_WATERLOGGING",
            bonus: 10,
            reason:
                "Verified critical waterlogging report"
        });

    } else if (hasHighReport) {

        /*
         * High verified report.
         */
        bonus += 5;

        interactions.push({
            type: "HIGH_WATERLOGGING",
            bonus: 5,
            reason:
                "Verified high-severity waterlogging report"
        });
    }


    /*
     * Prevent interaction rules from
     * adding an excessive amount.
     */
    bonus = clamp(bonus, 0, 30);


    return {
        bonus: Number(
            bonus.toFixed(2)
        ),

        interactions
    };
}