// src/controllers/riskController.js

import { calculateFloodRisk } from "../engine/floodRiskEngine.js";
import { validateEngineInput } from "../engine/validateEngineInput.js";

export function calculateAreaRisk(req, res) {

    try {

        const data = req.body;

        // 1. Validate input

        const validation =
            validateEngineInput(data);

        if (!validation.valid) {

            return res.status(400).json({
                success: false,
                message: "Invalid flood-risk input.",
                errors: validation.errors,
                warnings: validation.warnings
            });
        }


        // 2. Calculate flood risk

        const result =
            calculateFloodRisk(data);


        // 3. Return result

        return res.status(200).json({

            success: true,

            data: result,

            warnings:
                validation.warnings
        });

    } catch (error) {

        console.error(
            "Flood risk calculation error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to calculate flood risk.",

            error:
                error.message
        });
    }
}