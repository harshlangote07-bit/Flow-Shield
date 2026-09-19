import {
    Area,
    RiskAssessment,
    OfficialWaterloggingReport
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

function riskAlert(risk) {
    if (!risk) {
        return null;
    }

    if (risk.level === "CRITICAL") {
        return {
            type: "FLOOD_RISK",
            severity: "CRITICAL",
            message: "Critical flood risk detected.",
            score: risk.score,
            timestamp: risk.timestamp
        };
    }

    if (risk.level === "VERY_HIGH") {
        return {
            type: "FLOOD_RISK",
            severity: "HIGH",
            message: "Very high flood risk detected.",
            score: risk.score,
            timestamp: risk.timestamp
        };
    }

    if (risk.level === "HIGH") {
        return {
            type: "FLOOD_RISK",
            severity: "HIGH",
            message: "High flood risk detected.",
            score: risk.score,
            timestamp: risk.timestamp
        };
    }

    return null;
}

export async function getAreaAlerts(areaId) {
    const area = await findArea(areaId);

    const [risk, reports] = await Promise.all([
        RiskAssessment.findOne({
            areaId: area._id
        })
            .sort({ timestamp: -1 })
            .lean(),

        OfficialWaterloggingReport.find({
            areaId: area._id,
            status: {
                $ne: "resolved"
            }
        })
            .sort({ reportedAt: -1 })
            .lean()
    ]);

    const alerts = [];

    const floodAlert = riskAlert(risk);

    if (floodAlert) {
        alerts.push({
            ...floodAlert,
            areaId: area.areaId,
            areaName: area.name
        });
    }

    for (const report of reports) {
        const severity =
            String(
                report.severity || ""
            ).toUpperCase();

        if (
            severity === "SEVERE" ||
            severity === "CRITICAL"
        ) {
            alerts.push({
                type: report.type,
                severity,
                message:
                    report.description ||
                    "Official flood/waterlogging report.",
                reportId: report.reportId,
                areaId: area.areaId,
                areaName: area.name,
                timestamp: report.reportedAt
            });
        }
    }

    return alerts;
}

export async function getAllAlerts() {
    const areas = await Area.find({
        isActive: true
    }).lean();

    const result = [];

    for (const area of areas) {
        const alerts =
            await getAreaAlerts(area.areaId);

        result.push(...alerts);
    }

    return result;
}