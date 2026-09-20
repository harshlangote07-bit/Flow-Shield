import { ZONES } from "../data/mockData";

export default function MapCanvas({
  selectedId,
  onSelect,
  compact = false,
}) {
  return (
    <div className={`map-canvas ${compact ? "" : "map-page-canvas"}`}>
      <div className="map-river" />
      <div className="map-road" />

      <span
        className="map-label"
        style={{
          left: "15%",
          top: "20%",
        }}
      >
        West quay
      </span>

      <span
        className="map-label"
        style={{
          left: "67%",
          top: "59%",
        }}
      >
        Civic core
      </span>

      <span
        className="map-label"
        style={{
          left: "23%",
          top: "83%",
        }}
      >
        South canal
      </span>

      {ZONES.map((zone) => (
        <button
          key={zone.id}
          type="button"
          className={`zone ${zone.risk} ${
            selectedId === zone.id ? "selected" : ""
          }`}
          style={{
            left: zone.x,
            top: zone.y,
          }}
          onClick={() => onSelect(zone.id)}
          aria-label={`Select ${zone.name}`}
          data-testid={`button-zone-${zone.id}`}
        >
          <span>
            {zone.short} · {zone.score}
          </span>
        </button>
      ))}

      <div className="map-overlay">
        <strong>Storm cell: moving east</strong>
        <span>Updated 2 minutes ago · radar + gauge blend</span>
      </div>

      <div className="map-legend">
        <span className="legend-item">
          <i className="legend-dot high" />
          High
        </span>

        <span className="legend-item">
          <i className="legend-dot medium" />
          Watch
        </span>

        <span className="legend-item">
          <i className="legend-dot low" />
          Stable
        </span>
      </div>
    </div>
  );
}