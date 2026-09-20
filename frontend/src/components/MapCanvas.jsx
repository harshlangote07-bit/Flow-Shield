import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Polygon,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import bengaluruZones from "../data/bengaluruZones.json";

/* =========================================================
   MAP RESIZE
========================================================= */

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

/* =========================================================
   RISK HELPERS
========================================================= */

function getRiskLevel(riskScore) {
  if (riskScore >= 80) return "critical";
  if (riskScore >= 60) return "high";
  if (riskScore >= 40) return "medium";

  return "low";
}

function getRiskColor(riskScore) {
  const risk =
    getRiskLevel(riskScore);

  switch (risk) {
    case "critical":
      return "#7f302d";

    case "high":
      return "#bd4b46";

    case "medium":
      return "#c9991f";

    case "low":
      return "#0d746d";

    default:
      return "#819699";
  }
}

/* =========================================================
   STATIC ZONE STYLE
========================================================= */

function getZoneStyle(feature) {
  const riskScore = Number(
    feature?.properties?.riskScore ??
      0,
  );

  return {
    fillColor:
      getRiskColor(riskScore),

    fillOpacity: 0.35,

    color: "#ffffff",

    weight: 2,

    opacity: 1,
  };
}

/* =========================================================
   STATIC ZONE EVENTS
========================================================= */

function onEachZone(
  feature,
  layer,
  onSelect,
) {
  const name =
    feature?.properties?.name ||
    "Bengaluru zone";

  const score = Number(
    feature?.properties?.riskScore ??
      0,
  );

  const risk =
    getRiskLevel(score);

  const zoneId =
    feature?.properties?.id;

  layer.bindPopup(`
    <div style="min-width: 180px;">
      <strong style="font-size: 15px;">
        ${name}
      </strong>

      <div style="margin-top: 8px;">
        Risk:
        <strong>
          ${risk.toUpperCase()}
        </strong>
      </div>

      <div>
        Risk score:
        <strong>
          ${score}
        </strong>
      </div>

      <div
        style="
          margin-top: 6px;
          font-size: 11px;
          color: #60767b;
        "
      >
        Existing Bengaluru map geometry
      </div>
    </div>
  `);

  layer.on({
    mouseover: (event) => {
      event.target.setStyle({
        fillOpacity: 0.65,
        weight: 3,
      });
    },

    mouseout: (event) => {
      event.target.setStyle(
        getZoneStyle(feature),
      );
    },

    click: () => {
      if (zoneId && onSelect) {
        onSelect(zoneId);
      }
    },
  });
}

/* =========================================================
   BACKEND AREA HELPERS
========================================================= */

function backendAreaToLatLngs(area) {
  const coordinates =
    area?.boundary?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    !coordinates.length
  ) {
    return [];
  }

  /*
   * GeoJSON:
   *
   * [longitude, latitude]
   *
   * Leaflet:
   *
   * [latitude, longitude]
   */

  return coordinates.map(
    (ring) =>
      ring.map(
        ([longitude, latitude]) => [
          latitude,
          longitude,
        ],
      ),
  );
}

function getBackendAreaStyle(area) {
  const score = Number(
    area?.riskScore ?? 0,
  );

  return {
    fillColor:
      getRiskColor(score),

    fillOpacity: 0.48,

    color: "#ffffff",

    weight: 3,

    opacity: 1,

    dashArray: "6 4",
  };
}

/* =========================================================
   BACKEND AREA LAYER
========================================================= */

function BackendAreaLayer({
  area,
  selectedId,
  onSelect,
}) {
  const latLngs =
    backendAreaToLatLngs(area);

  if (!latLngs.length) {
    return null;
  }

  const score = Number(
    area?.riskScore ?? 0,
  );

  const level =
    area?.riskLevel ||
    "LOW";

  const areaId =
    area?.areaId;

    const population = Number(
  area?.population || 0
);

const populationExposed = Number(
  area?.populationExposed || 0
);

  const selected =
    selectedId === areaId;

  return (
    <Polygon
      positions={latLngs}
      pathOptions={{
        ...getBackendAreaStyle(
          area,
        ),

        weight: selected
          ? 5
          : 3,

        fillOpacity: selected
          ? 0.62
          : 0.48,
      }}
      eventHandlers={{
        click: () => {
          if (areaId && onSelect) {
            onSelect(areaId);
          }
        },

        mouseover: (event) => {
          event.target.setStyle({
            fillOpacity: 0.72,
            weight: 5,
          });
        },

        mouseout: (event) => {
          event.target.setStyle(
            getBackendAreaStyle(
              area,
            ),
          );
        },
      }}
    >
      <Popup>
        <div
          style={{
            minWidth: "200px",
          }}
        >
          <strong
            style={{
              fontSize: "15px",
            }}
          >
            {area?.name ||
              "Monitored area"}
          </strong>

          <div
            style={{
              marginTop: 8,
            }}
          >
            Risk:
            <strong>
              {" "}
              {String(
                level,
              ).replace(
                "_",
                " ",
              )}
            </strong>
          </div>

          <div>
            Risk score:
            <strong>
              {" "}
              {score}/100
            </strong>
          </div>

          <div>
  Estimated population:
  <strong>
    {" "}
    {population.toLocaleString("en-IN")}
  </strong>
</div>
<div>
  Estimated exposed:
  <strong>
    {" "}
    {populationExposed.toLocaleString("en-IN")}
  </strong>
</div>

          <div
            style={{
              marginTop: 7,
              fontSize: 11,
              color: "#60767b",
            }}
          >
            Estimated exposure based on current risk
          </div>
        </div>
      </Popup>
    </Polygon>
  );
}

/* =========================================================
   MAP CANVAS
========================================================= */

export default function MapCanvas({
  selectedId,
  onSelect,
  backendAreas = [],
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        minHeight: "560px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[
          12.9716,
          77.5946,
        ]}
        zoom={12}
        minZoom={11}
        maxZoom={16}
        maxBounds={[
          [12.70, 77.35],
          [13.20, 77.85],
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        {/* ===============================================
            BASE MAP
        =============================================== */}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ===============================================
            EXISTING BENGALURU GEOMETRY
        =============================================== */}

        <GeoJSON
          data={bengaluruZones}
          style={getZoneStyle}
          onEachFeature={(
            feature,
            layer,
          ) =>
            onEachZone(
              feature,
              layer,
              onSelect,
            )
          }
        />

        {/* ===============================================
            LIVE BACKEND AREAS
        =============================================== */}

        {backendAreas.map(
          (area) => (
            <BackendAreaLayer
              key={
                area.areaId
              }
              area={area}
              selectedId={
                selectedId
              }
              onSelect={
                onSelect
              }
            />
          ),
        )}

        <MapResizeFix />
      </MapContainer>
    </div>
  );
}