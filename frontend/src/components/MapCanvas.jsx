import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    GeoJSON,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import bengaluruZones from "../data/bengaluruZones.json";

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

function getRiskLevel(riskScore) {
    if (riskScore >= 70) return "high";
    if (riskScore >= 40) return "medium";
    return "low";
}

function getRiskColor(riskScore) {
    const risk = getRiskLevel(riskScore);

    switch (risk) {
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

function getZoneStyle(feature) {
    const riskScore = Number(feature?.properties?.riskScore ?? 0);

    return {
        fillColor: getRiskColor(riskScore),
        fillOpacity: 0.45,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
    };
}

function onEachZone(feature, layer, onSelect) {
    const name = feature?.properties?.name || "Bengaluru zone";
    const score = Number(feature?.properties?.riskScore ?? 0);
    const risk = getRiskLevel(score);
    const zoneId = feature?.properties?.id;

    layer.bindPopup(`
    <div style="min-width: 180px;">
      <strong style="font-size: 15px;">${name}</strong>
      <div style="margin-top: 8px;">
        Risk: <strong>${risk.toUpperCase()}</strong>
      </div>
      <div>
        Risk score: <strong>${score}</strong>
      </div>
    </div>
  `);

    layer.on({
        mouseover: (event) => {
            event.target.setStyle({
                fillOpacity: 0.7,
                weight: 3,
            });
        },

        mouseout: (event) => {
            event.target.setStyle(getZoneStyle(feature));
        },
        click: () => {
            if (zoneId && onSelect) {
                onSelect(zoneId);
            }
        },
    });
}

export default function MapCanvas({ selectedId, onSelect }) {
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
                center={[12.9716, 77.5946]}
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
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <GeoJSON
                    data={bengaluruZones}
                    style={getZoneStyle}
                    onEachFeature={(feature, layer) =>
                        onEachZone(feature, layer, onSelect)
                    }
                />

                <MapResizeFix />
            </MapContainer>
        </div>
    );
}