// src/engine/neighborFloodPropagation.js

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
}


/*
 * Calculate rainfall severity of the neighboring area.
 *
 * Uses the same major rainfall parameters as the
 * main flood-risk engine.
 */
function calculateNeighborRainfallScore(weather = {}) {

    const rainfallIntensity =
        Math.max(0, weather.rainfallIntensity ?? 0);

    const rainfall1h =
        Math.max(0, weather.rainfall1h ?? 0);

    const rainfall3h =
        Math.max(0, weather.rainfall3h ?? 0);

    const rainfall6h =
        Math.max(0, weather.rainfall6h ?? 0);

    const rainfall24h =
        Math.max(0, weather.rainfall24h ?? 0);

    const forecast3h =
        Math.max(0, weather.forecast3h ?? 0);

    const forecast6h =
        Math.max(0, weather.forecast6h ?? 0);

    const precipitationProbability =
        clamp(
            weather.precipitationProbability ?? 0
        );


    const intensityScore =
        clamp(
            (rainfallIntensity / 40) * 100
        );

    const rain1hScore =
        clamp(
            (rainfall1h / 50) * 100
        );

    const rain3hScore =
        clamp(
            (rainfall3h / 100) * 100
        );

    const rain6hScore =
        clamp(
            (rainfall6h / 150) * 100
        );

    const rain24hScore =
        clamp(
            (rainfall24h / 250) * 100
        );

    const forecast3hScore =
        clamp(
            (forecast3h / 75) * 100
        );

    const forecast6hScore =
        clamp(
            (forecast6h / 100) * 100
        );


    return clamp(
        intensityScore * 0.20 +
        rain1hScore * 0.20 +
        rain3hScore * 0.15 +
        rain6hScore * 0.10 +
        rain24hScore * 0.15 +
        forecast3hScore * 0.05 +
        forecast6hScore * 0.05 +
        precipitationProbability * 0.05
    );
}


/*
 * Calculate how much of the neighbor's rainfall
 * can affect the current area.
 *
 * IMPORTANT:
 *
 * We determine upstream/downstream ONLY
 * from elevation.
 */
function calculatePropagationFactor(
    currentArea,
    neighbor
) {

    const currentElevation =
        currentArea.elevationMeters ?? 0;

    const neighborElevation =
        neighbor.elevationMeters ?? 0;


    /*
     * Positive = neighbor is higher.
     * Negative = neighbor is lower.
     */
    const elevationDifference =
        neighborElevation -
        currentElevation;


    /*
     * LOWER neighbor:
     *
     * Water does not flow uphill.
     *
     * Therefore:
     * ZERO propagation.
     */
    if (elevationDifference <= 0) {
        return {
            direction: "downstream",
            elevationDifference,
            elevationFactor: 0,
            distanceFactor: 0,
            propagationFactor: 0
        };
    }


    /*
     * Higher neighbor = upstream.
     *
     * More elevation difference means
     * stronger potential flow.
     *
     * We cap this so elevation doesn't
     * completely dominate the calculation.
     */
    const elevationFactor =
        clamp(
            elevationDifference / 100,
            0,
            1
        );


    /*
     * Distance factor.
     *
     * Close = stronger
     * Far = weaker
     *
     * 0m    = 1.0
     * 2500m = 0.5
     * 5000m = 0
     */
    const distance =
        Math.max(
            0,
            neighbor.distanceMeters ?? 0
        );

    const distanceFactor =
        clamp(
            1 -
            distance / 5000,
            0,
            1
        );


    /*
     * Combine elevation and distance.
     */
    const propagationFactor =
        elevationFactor * 0.60 +
        distanceFactor * 0.40;


    return {
        direction: "upstream",
        elevationDifference,
        elevationFactor,
        distanceFactor,
        propagationFactor: clamp(
            propagationFactor,
            0,
            1
        )
    };
}


/*
 * Calculate flood influence from neighboring
 * areas for the CURRENT area.
 */
export function calculateNeighborFloodPropagation(
    currentArea,
    neighboringAreas = []
) {

    if (
        !currentArea ||
        !Array.isArray(neighboringAreas) ||
        neighboringAreas.length === 0
    ) {
        return {
            score: 0,
            neighbors: []
        };
    }


    const neighbors =
        neighboringAreas
            .map(neighbor => {

                const sourceRisk =
                    clamp(
                        neighbor.sourceRiskScore ?? 0
                    );


                /*
                 * Calculate rainfall severity
                 * in the neighboring area.
                 */
                const rainfallScore =
                    calculateNeighborRainfallScore(
                        neighbor.weather || {}
                    );


                /*
                 * Determine upstream/downstream
                 * automatically from elevation.
                 */
                const propagation =
                    calculatePropagationFactor(
                        currentArea,
                        neighbor
                    );


                /*
                 * If neighbor is downstream,
                 * it contributes ZERO.
                 */
                if (
                    propagation.propagationFactor === 0
                ) {
                    return {
                        areaId: neighbor.areaId,

                        name: neighbor.name,

                        distanceMeters:
                            neighbor.distanceMeters ?? 0,

                        elevationMeters:
                            neighbor.elevationMeters ?? 0,

                        elevationDifference:
                            Number(
                                propagation
                                    .elevationDifference
                                    .toFixed(2)
                            ),

                        direction:
                            propagation.direction,

                        sourceRiskScore:
                            Number(
                                sourceRisk.toFixed(2)
                            ),

                        rainfallScore:
                            Number(
                                rainfallScore.toFixed(2)
                            ),

                        elevationFactor: 0,

                        distanceFactor: 0,

                        propagationFactor: 0,

                        propagatedRisk: 0
                    };
                }


                /*
                 * Neighbor rainfall and existing
                 * neighbor risk both matter.
                 *
                 * Rainfall gets slightly more weight
                 * because we're specifically trying
                 * to propagate the effect of rainfall.
                 */
                const sourceConditionScore =
                    rainfallScore * 0.60 +
                    sourceRisk * 0.40;


                /*
                 * Only a SMALL portion of the
                 * neighboring condition reaches
                 * the current area.
                 *
                 * Maximum theoretical transfer
                 * is 15% of source condition.
                 */
                const propagatedRisk =
                    sourceConditionScore *
                    propagation.propagationFactor *
                    0.15;


                return {
                    areaId:
                        neighbor.areaId,

                    name:
                        neighbor.name,

                    distanceMeters:
                        neighbor.distanceMeters ?? 0,

                    elevationMeters:
                        neighbor.elevationMeters ?? 0,

                    elevationDifference:
                        Number(
                            propagation
                                .elevationDifference
                                .toFixed(2)
                        ),

                    direction:
                        propagation.direction,

                    sourceRiskScore:
                        Number(
                            sourceRisk.toFixed(2)
                        ),

                    rainfallScore:
                        Number(
                            rainfallScore.toFixed(2)
                        ),

                    elevationFactor:
                        Number(
                            propagation
                                .elevationFactor
                                .toFixed(3)
                        ),

                    distanceFactor:
                        Number(
                            propagation
                                .distanceFactor
                                .toFixed(3)
                        ),

                    propagationFactor:
                        Number(
                            propagation
                                .propagationFactor
                                .toFixed(3)
                        ),

                    propagatedRisk:
                        Number(
                            propagatedRisk.toFixed(2)
                        )
                };
            });


    /*
     * Combine multiple upstream influences
     * using diminishing returns.
     */
    let combinedScore = 0;

    for (const neighbor of neighbors) {

        combinedScore =
            100 -
            (100 - combinedScore) *
            (
                1 -
                neighbor.propagatedRisk / 100
            );
    }


    return {

        score:
            Number(
                clamp(combinedScore).toFixed(2)
            ),

        neighbors:
            neighbors.sort(
                (a, b) =>
                    b.propagatedRisk -
                    a.propagatedRisk
            )
    };
}