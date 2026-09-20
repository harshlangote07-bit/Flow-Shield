const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================
   AREAS
========================= */

export function getAreas() {
  return request("/areas");
}

export function getArea(areaId) {
  return request(`/areas/${areaId}`);
}

/* =========================
   RISK
========================= */

export function getAllRisks() {
  return request("/risk");
}

export function getLatestRisk(areaId) {
  return request(`/risk/${areaId}`);
}

export function calculateRisk(areaId) {
  return request(`/risk/calculate/${areaId}`, {
    method: "POST",
  });
}

export function getRiskHistory(areaId) {
  return request(`/risk/${areaId}/history`);
}

/* =========================
   WEATHER
========================= */

export function getWeather(areaId) {
  return request(`/weather/${areaId}`);
}

export function getCurrentWeather(areaId) {
  return request(`/weather/${areaId}/current`);
}

/* =========================
   DRAINAGE
========================= */

export function getDrainage(areaId) {
  return request(`/drainage/${areaId}`);
}

export function getDrainageRisk(areaId) {
  return request(`/drainage/${areaId}/risk`);
}

export function getDrainageReports(areaId) {
  return request(`/drainage/${areaId}/reports`);
}

/* =========================
   WATER BODIES
========================= */

export function getWaterBodies(areaId) {
  return request(`/water-bodies/${areaId}`);
}

export function getWaterBodyRisk(areaId) {
  return request(`/water-bodies/${areaId}/risk`);
}

/* =========================
   HISTORICAL
========================= */

export function getHistorical(areaId) {
  return request(`/historical/${areaId}`);
}

export function getHistoricalRisk(areaId) {
  return request(`/historical/${areaId}/risk`);
}

/* =========================
   TERRAIN
========================= */

export function getTerrain(areaId) {
  return request(`/terrain/${areaId}`);
}

export function getTerrainRisk(areaId) {
  return request(`/terrain/${areaId}/risk`);
}

/* =========================
   SOIL
========================= */

export function getSoil(areaId) {
  return request(`/soil/${areaId}`);
}

export function getSoilRisk(areaId) {
  return request(`/soil/${areaId}/risk`);
}

/* =========================
   LAND USE
========================= */

export function getLandUse(areaId) {
  return request(`/land-use/${areaId}`);
}

export function getLandUseRisk(areaId) {
  return request(`/land-use/${areaId}/risk`);
}

/* =========================
   NEIGHBORS
========================= */

export function getNeighbors(areaId) {
  return request(`/neighbors/${areaId}`);
}

export function getPropagation(areaId) {
  return request(`/neighbors/${areaId}/propagation`);
}

/* =========================
   ALERTS
========================= */

export function getAlerts(areaId) {
  if (areaId) {
    return request(`/alerts/${areaId}`);
  }

  return request("/alerts");
}

/* =========================
   AUTH
========================= */

export function loginOfficial(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

/* =========================
   OFFICIAL DRAINAGE UPDATE
========================= */

export function updateDrainageAsset(assetId, data, token) {
  return request(`/drainage/assets/${assetId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}