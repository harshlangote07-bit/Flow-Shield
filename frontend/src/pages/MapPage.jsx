import { useState } from "react";

import { Link, useLocation } from "wouter";
import { ArrowRight, Layers } from "lucide-react";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import MapCanvas from "../components/MapCanvas";
import { ZONES } from "../data/mockData";

/* =========================================================
   MAP PAGE
========================================================= */

export default function MapPage({ selectedZone, setSelectedZone }) {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState(selectedZone || "harbor");

  const zone = ZONES.find((item) => item.id === selected) || ZONES[0];
  const onSelect = (id) => { setSelected(id); setSelectedZone(id); };
  return(<div className="page">
    <><PageHeading eyebrow="Spatial intelligence" title="Flood risk map" subtitle="Select a zone to inspect the drivers behind its score. The map blends rainfall, river gauges, terrain, and drainage capacity." action={<div className="button button-quiet"><Layers size={14} /> 4 active layers</div>} /><div className="map-controls"><button className="control-pill active" type="button" data-testid="button-layer-risk">Risk surface</button><button
      className="control-pill"
      type="button"
      data-testid="button-layer-rain"
      onClick={() => navigate("/rainfall-radar")}
    >
      Rainfall radar
    </button><button className="control-pill" type="button" data-testid="button-layer-drainage">Drainage assets</button><span className="muted tiny" style={{ marginLeft: "auto" }}>Forecast horizon: 3 hours</span></div><div className="map-layout"><div className="panel map-page-canvas"><MapCanvas selectedId={selected} onSelect={onSelect} /></div>
        <aside className="panel"><div className="detail-head"><div><div className="panel-kicker">Selected zone</div><strong>{zone.name}</strong><p>{zone.subtitle}</p></div><div className="score-ring">{zone.score}</div></div>
          <div className="factor"><div className="factor-line"><span>Rainfall intensity</span><span>{zone.rainfall}</span></div><div className="factor-bar"><i style={{ width: `${Math.min(100, zone.score - 5)}%` }} /></div><div className="factor-note">Heavy cell has remained over the catchment for 46 minutes.</div></div>
          <div className="factor"><div className="factor-line"><span>River / canal level</span><span>{zone.level}</span></div><div className="factor-bar"><i style={{ width: `${Math.min(100, zone.score - 13)}%` }} /></div><div className="factor-note">Gauge trend is rising faster than the last model run.</div></div>
          <div className="factor"><div className="factor-line"><span>Drainage capacity</span><span>{zone.id === "north" ? "72% free" : "38% free"}</span></div><div className="factor-bar"><i style={{ width: zone.id === "north" ? "28%" : "62%" }} /></div><div className="factor-note">Capacity is estimated from verified crew checks and pump telemetry.</div></div>
          <div className="recommendation"><strong>Recommended next step</strong><p>{zone.id === "harbor" ? "Dispatch a crew to Pier 4 and stage a mobile pump before the next rainfall pulse." : zone.id === "junction" ? "Inspect the south canal grates and confirm gate control before 17:15." : "Maintain patrol cadence and recheck the nearest gauge after the next radar sweep."}</p></div>
          <div className="detail-actions"><Link href="/drainage" className="button button-teal button-small" data-testid="link-zone-drainage">Review drainage <ArrowRight size={13} /></Link><Link href="/analysis" className="button button-quiet button-small" data-testid="link-zone-analysis">Recalculate</Link></div>
        </aside>
      </div></>
  </div>  
);
}
