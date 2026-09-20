const WORLDPOP_URL = "https://api.worldpop.org/v2/population";
const WORLDPOP_TASK_URL = "https://api.worldpop.org/v2/tasks";

export async function getPopulationForPolygon(boundary) {
    if (!boundary?.type || !boundary?.coordinates) {
        throw new Error("Invalid polygon boundary");
    }

    const response = await fetch(WORLDPOP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            geojson: {
                type: boundary.type,
                coordinates: boundary.coordinates,
            },
            year: 2025,
            resolution: "100m",
        }),
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `WorldPop request failed: ${response.status} ${text}`
        );
    }

    const task = await response.json();

    if (!task.task_id) {
        throw new Error("WorldPop did not return a task ID");
    }

    return waitForWorldPopTask(task.task_id);
}

async function waitForWorldPopTask(taskId) {
    const maxAttempts = 30;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch(
            `${WORLDPOP_TASK_URL}/${taskId}`
        );

        if (!response.ok) {
            const text = await response.text();

            throw new Error(
                `WorldPop task request failed: ${response.status} ${text}`
            );
        }

        const result = await response.json();

        console.log(
            `WorldPop task ${taskId}: ${result.status}`
        );

        if (
    result.status === "success" ||
    result.status === "finished" ||
    result.status === "completed"
) {
    return result;
}

        if (
            result.status === "failed" ||
            result.status === "error"
        ) {
            throw new Error(
                `WorldPop task failed: ${JSON.stringify(result)}`
            );
        }

        await new Promise((resolve) => {
            setTimeout(resolve, delayMs);
        });
    }

    throw new Error(
        `WorldPop task ${taskId} timed out`
    );
}