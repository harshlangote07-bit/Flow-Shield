function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}

export function calculateConfidence(data = {}) {
    const checks = [
        {
            name: "weather",
            available: data.weather != null
        },
        {
            name: "drainage",
            available: data.drainage != null
        },
        {
            name: "waterBodies",
            available:
                Array.isArray(data.waterBodies) &&
                data.waterBodies.length > 0
        },
        {
            name: "terrain",
            available: data.terrain != null
        },
        {
            name: "soil",
            available: data.soil != null
        },
        {
            name: "landUse",
            available: data.landUse != null
        },
        {
            name: "history",
            available:
                Array.isArray(data.history) &&
                data.history.length > 0
        },
        {
            name: "officialReports",
            available: Array.isArray(data.officialReports)
        }
    ];

    const weights = {
        weather: 0.20,
        drainage: 0.15,
        waterBodies: 0.15,
        terrain: 0.15,
        soil: 0.10,
        landUse: 0.10,
        history: 0.10,
        officialReports: 0.05
    };

    let confidence = 0;

    for (const check of checks) {
        if (check.available) {
            confidence += weights[check.name] * 100;
        }
    }

    return Number(
        clamp(confidence).toFixed(2)
    );
}