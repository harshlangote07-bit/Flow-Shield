import {
    Area,
    FloodHistory
} from "../models/index.js";

async function findArea(areaId) {
    const area = await Area.findOne({
        areaId,
        isActive: true
    }).lean();

    if (!area) {
        const error = new Error(`Area not found: ${areaId}`);
        error.statusCode = 404;
        throw error;
    }

    return area;
}

export async function getAreaHistoricalData(areaId) {
    const area = await findArea(areaId);

    return await FloodHistory.find({
        areaId: area._id
    })
        .sort({ eventDate: -1 })
        .lean();
}

export async function getHistoricalRisk(areaId) {
    const history =
        await getAreaHistoricalData(areaId);

    if (history.length === 0) {
        return {
            areaId,
            eventCount: 0,
            verifiedEventCount: 0,
            severeEventCount: 0,
            score: 0
        };
    }

    const verifiedEvents =
        history.filter(event => event.verified);

    const severeEvents =
        history.filter(event =>
            [
                "SEVERE",
                "CRITICAL",
                "EXTREME"
            ].includes(
                String(event.severity).toUpperCase()
            )
        );

    /*
     * Recent flood history is an indicator,
     * while the engine remains responsible for
     * final historical weighting.
     */

    const eventFrequencyScore =
        Math.min(100, history.length * 10);

    const severityScore =
        Math.min(
            100,
            (severeEvents.length / history.length) * 100
        );

    const verificationScore =
        Math.min(
            100,
            (verifiedEvents.length / history.length) * 100
        );

    const score =
        eventFrequencyScore * 0.40 +
        severityScore * 0.40 +
        verificationScore * 0.20;

    return {
        areaId,
        eventCount: history.length,
        verifiedEventCount: verifiedEvents.length,
        severeEventCount: severeEvents.length,
        score: Number(
            Math.max(0, Math.min(100, score)).toFixed(2)
        )
    };
}