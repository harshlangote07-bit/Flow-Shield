import { useState } from "react";

import { Link, useLocation } from "wouter";
import { ArrowRight, Layers } from "lucide-react";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import MapCanvas from "../components/MapCanvas";

import bengaluruZones from "../data/bengaluruZones.json";
/* =========================================================
   MAP PAGE
========================================================= */

export default function MapPage({ selectedZone, setSelectedZone }) {
    const [, navigate] = useLocation();
    const [selected, setSelected] = useState(selectedZone || null);

    const zoneFeature = selected
        ? bengaluruZones.features.find(
            (feature) => feature.properties?.id === selected
        )
        : null;

    const zone = zoneFeature?.properties || {};
    const onSelect = (id) => {
        setSelected(id);
        setSelectedZone(id);
    };
    return (<div className="page">
        <><PageHeading eyebrow="Spatial intelligence" title="Flood risk map" subtitle="Select a zone to inspect the drivers behind its score. The map blends rainfall, river gauges, terrain, and drainage capacity." action={<div className="button button-quiet"><Layers size={14} /> 4 active layers</div>} /><div className="map-controls"><button className="control-pill active" type="button" data-testid="button-layer-risk">Risk surface</button><button
            className="control-pill"
            type="button"
            data-testid="button-layer-rain"
            onClick={() => navigate("/rainfall-radar")}
        >
            Rainfall radar
        </button>
            <span className="muted tiny" style={{ marginLeft: "auto" }}>Forecast horizon: 3 hours</span></div><div className="map-layout"><div className="panel map-page-canvas"><MapCanvas selectedId={selected} onSelect={onSelect} /></div>
                <aside className="panel">
                    {!zoneFeature ? (
                        <div
                            style={{
                                minHeight: "420px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                padding: "32px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "42px",
                                    marginBottom: "16px",
                                    opacity: 0.7,
                                }}
                            >
                                ◇
                            </div>

                            <div className="panel-kicker">ZONE DETAILS</div>

                            <strong
                                style={{
                                    fontSize: "20px",
                                    marginTop: "8px",
                                }}
                            >
                                Select a zone
                            </strong>

                            <p
                                style={{
                                    maxWidth: "260px",
                                    marginTop: "10px",
                                    lineHeight: "1.5",
                                }}
                            >
                                Click any zone on the map to view its flood-risk score and details.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="detail-head">
                                <div>
                                    <div className="panel-kicker">Selected zone</div>
                                    <strong>{zone.name || "Bengaluru zone"}</strong>
                                    <p>{zone.source_area || "Bengaluru"}</p>
                                </div>

                                <div
                                    className={`score-ring ${Number(zone.riskScore) >= 70
                                            ? "score-high"
                                            : Number(zone.riskScore) >= 40
                                                ? "score-medium"
                                                : "score-low"
                                        }`}
                                >
                                    {zone.riskScore ?? "—"}
                                </div>
                            </div>

                            <div className="factor">
                                <div className="factor-line">
                                    <span>Risk score</span>
                                    <span>{zone.riskScore ?? "—"} / 100</span>
                                </div>

                                <div className="factor-bar">
                                    <i
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(0, Number(zone.riskScore) || 0)
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <div className="factor-note">
                                    Calculated flood-risk score for this zone.
                                </div>
                            </div>

                            <div className="factor">
                                <div className="factor-line">
                                    <span>Risk level</span>
                                    <span>
                                        {Number(zone.riskScore) >= 70
                                            ? "HIGH"
                                            : Number(zone.riskScore) >= 40
                                                ? "MEDIUM"
                                                : "LOW"}
                                    </span>
                                </div>

                                <div className="factor-note">
                                    Risk level is derived from the risk score.
                                </div>
                            </div>

                            <div className="factor">
                                <div className="factor-line">
                                    <span>Zone ID</span>
                                    <span>{zone.id || "—"}</span>
                                </div>

                                <div className="factor-note">
                                    Geographic zone identifier used to connect this area with backend
                                    data.
                                </div>
                            </div>

                            <div className="detail-actions">
                                <Link
                                    href="/drainage"
                                    className="button button-teal button-small"
                                    data-testid="link-zone-drainage"
                                >
                                    Review drainage <ArrowRight size={13} />
                                </Link>

                                <Link
                                    href="/analysis"
                                    className="button button-quiet button-small"
                                    data-testid="link-zone-analysis"
                                >
                                    Recalculate
                                </Link>
                            </div>
                        </>
                    )}
                </aside>
            </div></>
    </div>
    );
}
