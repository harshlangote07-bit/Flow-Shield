import { Area } from "../models/index.js";

export async function getAllAreas() {
    return await Area.find({ isActive: true })
        .sort({ name: 1 })
        .lean();
}

export async function getAreaDetails(areaId) {
    return await Area.findOne({
        areaId,
        isActive: true
    }).lean();
}