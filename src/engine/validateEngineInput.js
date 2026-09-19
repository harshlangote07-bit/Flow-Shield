// src/engine/validateEngineInput.js

export function validateEngineInput(data = {}) {

    const errors = [];
    const warnings = [];


    // -------------------------
    // Area
    // -------------------------

    if (!data.area) {
        errors.push("Area data is required.");
    } else if (!data.area.id) {
        errors.push("Area ID is required.");
    }


    // -------------------------
    // Weather
    // -------------------------

    if (!data.weather) {

        errors.push(
            "Weather data is required."
        );

    } else {

        const weatherFields = [
            "rainfall1h",
            "rainfall3h",
            "rainfall6h",
            "rainfall24h"
        ];

        for (const field of weatherFields) {

            if (
                data.weather[field] != null &&
                (
                    typeof data.weather[field] !== "number" ||
                    data.weather[field] < 0
                )
            ) {
                errors.push(
                    `Invalid weather field: ${field}`
                );
            }
        }
    }


    // -------------------------
    // Drainage
    // -------------------------

    if (!data.drainage) {

        warnings.push(
            "Drainage data is missing."
        );

    } else {

        if (
            data.drainage.blockagePercent != null &&
            (
                data.drainage.blockagePercent < 0 ||
                data.drainage.blockagePercent > 100
            )
        ) {
            errors.push(
                "Drainage blockage percentage must be between 0 and 100."
            );
        }

        if (
            data.drainage.capacityUtilizationPercent != null &&
            (
                data.drainage.capacityUtilizationPercent < 0 ||
                data.drainage.capacityUtilizationPercent > 100
            )
        ) {
            errors.push(
                "Drainage capacity utilization must be between 0 and 100."
            );
        }
    }


    // -------------------------
    // Water bodies
    // -------------------------

    if (
        data.waterBodies != null &&
        !Array.isArray(data.waterBodies)
    ) {

        errors.push(
            "Water bodies must be an array."
        );

    } else if (
        Array.isArray(data.waterBodies)
    ) {

        data.waterBodies.forEach(
            (waterBody, index) => {

                if (!waterBody.id) {

                    warnings.push(
                        `Water body at index ${index} has no ID.`
                    );
                }

                if (
                    waterBody.distanceMeters != null &&
                    waterBody.distanceMeters < 0
                ) {

                    errors.push(
                        `Invalid water body distance at index ${index}.`
                    );
                }

                if (
                    waterBody.catchmentAreaM2 != null &&
                    waterBody.catchmentAreaM2 < 0
                ) {

                    errors.push(
                        `Invalid catchment area at index ${index}.`
                    );
                }

                if (
                    waterBody.surfaceAreaM2 != null &&
                    waterBody.surfaceAreaM2 <= 0
                ) {

                    errors.push(
                        `Invalid surface area at index ${index}.`
                    );
                }
            }
        );
    }


    // -------------------------
    // Terrain
    // -------------------------

    if (!data.terrain) {

        warnings.push(
            "Terrain data is missing."
        );
    }


    // -------------------------
    // Soil
    // -------------------------

    if (!data.soil) {

        warnings.push(
            "Soil data is missing."
        );
    }


    // -------------------------
    // Land use
    // -------------------------

    if (!data.landUse) {

        warnings.push(
            "Land-use data is missing."
        );
    }


    // -------------------------
    // History
    // -------------------------

    if (
        data.history != null &&
        !Array.isArray(data.history)
    ) {

        errors.push(
            "Historical flood data must be an array."
        );
    }


    // -------------------------
    // Official reports
    // -------------------------

    if (
        data.officialReports != null &&
        !Array.isArray(data.officialReports)
    ) {

        errors.push(
            "Official reports must be an array."
        );
    }


    return {

        valid:
            errors.length === 0,

        errors,

        warnings
    };
}