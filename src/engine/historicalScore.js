// src/engine/historicalScore.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

/*
 * Convert flood severity into a risk score.
 */
function getSeverityScore(severity) {
    switch (String(severity || "").toLowerCase()) {

        case "critical":
            return 100;

        case "severe":
            return 90;

        case "high":
            return 75;

        case "moderate":
            return 50;

        case "low":
            return 25;

        case "minor":
            return 15;

        default:
            return 0;
    }
}

/*
 * Flood depth contribution.
 *
 * Deeper historical flooding means
 * greater future flood risk.
 */
function getDepthScore(depthMeters) {

    if (
        depthMeters == null ||
        depthMeters < 0
    ) {
        return 0;
    }

    if (depthMeters >= 2) {
        return 100;
    }

    if (depthMeters >= 1.5) {
        return 90;
    }

    if (depthMeters >= 1) {
        return 75;
    }

    if (depthMeters >= 0.5) {
        return 55;
    }

    if (depthMeters >= 0.25) {
        return 35;
    }

    return 15;
}

/*
 * Historical rainfall contribution.
 *
 * This captures whether previous floods
 * occurred during relatively heavy rainfall.
 */
function getRainfallScore(rainfall24h) {

    if (
        rainfall24h == null ||
        rainfall24h < 0
    ) {
        return 0;
    }

    if (rainfall24h >= 250) {
        return 100;
    }

    if (rainfall24h >= 200) {
        return 90;
    }

    if (rainfall24h >= 150) {
        return 75;
    }

    if (rainfall24h >= 100) {
        return 55;
    }

    if (rainfall24h >= 50) {
        return 30;
    }

    return 10;
}

/*
 * More recent historical floods should
 * have greater influence.
 */
function getRecencyScore(eventDate) {

    if (!eventDate) {
        return 50;
    }

    const eventTime =
        new Date(eventDate).getTime();

    if (Number.isNaN(eventTime)) {
        return 50;
    }

    const now =
        Date.now();

    const daysSince =
        Math.max(
            0,
            (now - eventTime) /
            (1000 * 60 * 60 * 24)
        );

    if (daysSince <= 365) {
        return 100;
    }

    if (daysSince <= 3 * 365) {
        return 80;
    }

    if (daysSince <= 5 * 365) {
        return 60;
    }

    if (daysSince <= 10 * 365) {
        return 40;
    }

    return 20;
}

/*
 * Main historical flood-risk calculation.
 */
export function calculateHistoricalScore(
    history = []
) {

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        return 0;
    }


    /*
     * Calculate a score for every
     * historical flood event.
     */
    const eventScores =
        history.map(event => {

            const severityScore =
                getSeverityScore(
                    event.severity
                );

            const depthScore =
                getDepthScore(
                    event.maxDepthMeters
                );

            const rainfallScore =
                getRainfallScore(
                    event.rainfall24h
                );

            const recencyScore =
                getRecencyScore(
                    event.eventDate
                );


            /*
             * Event-level score.
             */
            const eventScore =
                severityScore * 0.40 +
                depthScore * 0.20 +
                rainfallScore * 0.15 +
                recencyScore * 0.25;


            return clamp(eventScore);
        });


    /*
     * Use diminishing returns so that
     * 10 historical floods don't produce
     * an impossible score above 100.
     *
     * Multiple events strengthen the signal.
     */
    let combinedScore = 0;

    for (const eventScore of eventScores) {

        combinedScore =
            100 -
            (100 - combinedScore) *
            (1 - eventScore / 100);
    }


    return Number(
        clamp(combinedScore).toFixed(2)
    );
}